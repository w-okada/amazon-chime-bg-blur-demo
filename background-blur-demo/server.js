// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable */
const compression = require("compression");
const fs = require("fs");
const url = require("url");
const uuid = require("uuid");
const AWS = require("aws-sdk");

let config = undefined;
if (fs.existsSync("./config.js")) {
    config = require("./config");
}
let hostname = "0.0.0.0";
let port = 8888;
let protocol = "http";
let options = {};

const ssl_server_key = "server.key";
const ssl_server_crt = "server.crt";
if (fs.existsSync(ssl_server_key) && fs.existsSync(ssl_server_crt)) {
    protocol = "https";
}
if (protocol == "https") {
    options = {
        key: fs.readFileSync(ssl_server_key),
        cert: fs.readFileSync(ssl_server_crt),
    };
}

console.log(`Launch server: ${protocol}://${hostname}:${port}`);

let chime = undefined;
if (config) {
    console.log("[NOTE] USE Config Credential");
    chime = new AWS.Chime({
        region: "us-east-1",
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });
} else {
    console.log("[NOTE] USE Default Credential");
    chime = new AWS.Chime({ region: "us-east-1" });
}

const alternateEndpoint = process.env.ENDPOINT;
if (alternateEndpoint) {
    console.log("Using endpoint: " + alternateEndpoint);
    chime.createMeeting({ ClientRequestToken: uuid() }, () => {});
    AWS.NodeHttpClient.sslAgent.options.rejectUnauthorized = false;
    chime.endpoint = new AWS.Endpoint(alternateEndpoint);
} else {
    chime.endpoint = new AWS.Endpoint("https://service.chime.aws.amazon.com/console");
}

console.log(chime.endpoint);
const meetingCache = {};
const attendeeCache = {};

const log = (message) => {
    console.log(`${new Date().toISOString()} ${message}`);
};

const checkMeetingExists = async (meetingName) => {
    // Check the meeting is in cache or not?
    if (!meetingCache[meetingName]) {
        return false;
    }
    const cache = meetingCache[meetingName];

    // Check the meeting exist or not
    const meetings = await chime.listMeetings().promise();
    for (meetingIndex in Object.values(meetings.Meetings)) {
        const meeting = meetings.Meetings[meetingIndex];
        console.log(meeting);
        console.log(cache);
        if (meeting.MeetingId === cache.MeetingId) {
            return true;
        }
    }
    return false;
};

const _createMeeting = async (meetingName, region) => {
    // create meeting and cache
    const meetingInfo = await chime
        .createMeeting({
            ClientRequestToken: uuid.v4(),
            MediaRegion: region,
        })
        .promise();

    meetingCache[meetingName] = meetingInfo.Meeting;
    console.log("created meeting");
    console.log(meetingCache[meetingName]);
    // initialize attendee cache
    attendeeCache[meetingName] = {};
};

const _joinMeeting = async (meetingName, userName, response) => {
    console.log("joining.....");

    const attendeeInfo = await chime
        .createAttendee({
            MeetingId: meetingCache[meetingName].MeetingId,
            ExternalUserId: uuid.v4(),
        })
        .promise();

    console.log("Join", attendeeInfo);

    const joinInfo = {
        JoinInfo: {
            MeetingName: meetingName,
            Meeting: meetingCache[meetingName],
            Attendee: attendeeInfo.Attendee,
        },
    };

    attendeeCache[meetingName][joinInfo.JoinInfo.Attendee.AttendeeId] = userName;
    joinInfo.UserName = userName;
    response.statusCode = 201;
    response.setHeader("Content-Type", "application/json");
    response.write(JSON.stringify(joinInfo), "utf8");
    response.end();
    log(JSON.stringify(joinInfo, null, 2));
};

const joinMeeting = async (meetingName, userName, region, response) => {
    const res = await chime.listMeetings().promise();
    const meetingExists = await checkMeetingExists(meetingName);
    if (!meetingExists) {
        await _createMeeting(meetingName, region);
    }
    await _joinMeeting(meetingName, userName, response);
};

const leaveMeeting = (meetingName, attendeeId) => {
    attendeeCache[meetingName][ttendeeId] = undefined;
};

const endMeeting = async (meetingName, attendeeId, response) => {
    leaveMeeting(meetingName, attendeeId);
    await chime
        .deleteMeeting({
            MeetingId: meetingCache[meetingName].Meeting.MeetingId,
        })
        .promise();
    meetingCache[meetingName] = undefined;
    response.statusCode = 200;
    response.end();
};

const server = require(protocol).createServer(options, async (request, response) => {
    log(`${request.method} ${request.url} BEGIN`);
    compression({})(request, response, () => {});
    try {
        if (request.url.startsWith("/meeting?")) {
            const query = url.parse(request.url, true).query;
            const operation = query.operation;
            const meetingName = query.meetingName;
            const userName = query.userName;
            const region = query.region;
            const attendeeId = query.attendeeId;

            if (request.method === "GET") {
            } else if (request.method === "POST") {
                switch (operation) {
                    case "join":
                        console.log("join meeting");
                        await joinMeeting(meetingName, userName, region, response);
                        break;
                    case "leave":
                        console.log("leave meeting");
                        break;
                    case "end":
                        console.log("end meeting");
                        await endMeeting(meetingName, attendeeId, response);
                        break;
                    default:
                        throw `unknown meeting operation: ${operation}`;
                }
            } else {
                throw `unknown operation: ${request.method}, ${reqiest.url}`;
            }
        } else if (request.url.startsWith("/attendee?")) {
            const query = url.parse(request.url, true).query;
            const meetingName = query.meetingName;
            const attendeeId = query.attendeeId;
            if (request.method === "GET") {
                const attendeeInfo = {
                    AttendeeInfo: {
                        AttendeeId: attendeeId,
                        Name: attendeeCache[meetingName][attendeeId],
                    },
                };
                response.statusCode = 200;
                response.setHeader("Content-Type", "application/json");
                response.write(JSON.stringify(attendeeInfo), "utf8");
                response.end();
                log(JSON.stringify(attendeeInfo, null, 2));
            } else if (request.method === "POST") {
            } else {
                throw `unknown operation: ${request.method}, ${reqiest.url}`;
            }
        } else {
            if (request.method === "GET") {
                console.log(request.url);
                if (request.url.endsWith(".js")) {
                    response.setHeader("Content-Type", "application/javascript");
                } else if (request.url.endsWith(".css")) {
                    response.setHeader("Content-Type", "text/css");
                } else if (request.url.endsWith(".ico")) {
                    response.setHeader("Content-Type", "image/x-icon");
                } else if (request.url.endsWith(".png")) {
                    response.setHeader("Content-Type", "image/png");
                } else if (request.url.endsWith(".svg")) {
                    response.setHeader("Content-Type", "image/svg+xml");
                } else {
                    response.setHeader("Content-Type", "text/html");
                }
                response.statusCode = 200;
                if (request.url === "/" || request.url.startsWith("/?")) {
                    response.end(fs.readFileSync(`dist/index.html`));
                } else {
                    response.end(fs.readFileSync(`dist${request.url}`));
                }
            }
        }
    } catch (err) {
        log(`server caught error: ${err}`);
        response.statusCode = 403;
        response.setHeader("Content-Type", "application/json");
        response.write(JSON.stringify({ error: err.message }), "utf8");
        response.end();
    }
    log(`${request.method} ${request.url} END`);
});

server.listen(port, hostname, () => {
    log(`server running at ${protocol}://${hostname}:${port}/`);
});
