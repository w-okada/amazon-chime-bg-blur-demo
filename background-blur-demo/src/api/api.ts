// export const createMeeting = (region: string) => {
//     return new Promise((resolve, reject) => {
//         const req = new XMLHttpRequest();
//         req.open("POST", `meeting?region=${region}`, true);
//         req.onload = function () {
//             if (req.status === 201) {
//                 resolve(JSON.parse(req.responseText));
//             } else {
//                 reject(new Error(req.statusText));
//             }
//         };
//         req.onerror = function () {
//             reject(new Error(req.statusText));
//         };
//         req.send();
//     });
// };

export type JoinMeetingProps = {
    meetingName: string;
    userName: string;
    region: string;
};

export type JoinMeetingResponse = {
    UserName: string;
    JoinInfo: {
        MeetingName: string;
        Attendee: {
            AttendeeId: string;
            ExternalUserId: string;
            JoinToken: string;
        };
        Meeting: {
            ExternalMeetingId: string | null;
            MediaPlacement: {
                AudioFallbackUrl: string;
                AudioHostUrl: string;
                ScreenDataUrl: string;
                ScreenSharingUrl: string;
                ScreenViewingUrl: string;
                SignalingUrl: string;
                TurnControlUrl: string;
            };
            MediaRegion: string;
            MeetingId: string;
        };
    };
    code: string | null;
};
export const joinMeeting = (props: JoinMeetingProps): Promise<JoinMeetingResponse> => {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.open("POST", `/meeting?operation=join&meetingName=${props.meetingName}&userName=${props.userName}&region=${props.region}`, true);
        req.onload = function () {
            if (req.status === 201) {
                const res: JoinMeetingResponse = JSON.parse(req.responseText);
                resolve(res);
            } else {
                reject(new Error(req.statusText));
            }
        };
        req.onerror = function () {
            reject(new Error(req.statusText));
        };
        req.send();
    });
};

// export const endMeeting = (title: string, userName: string) => {
//     return new Promise<void>((resolve, reject) => {
//         const req = new XMLHttpRequest();
//         req.open("POST", "/end?title=" + title + "&userName=" + userName, true);
//         req.onload = function () {
//             if (req.status === 200) {
//                 resolve();
//             } else {
//                 reject(new Error(req.statusText));
//             }
//         };
//         req.onerror = function () {
//             reject(new Error(req.statusText));
//         };
//         req.send();
//     });
// };

export type GetAttendeeProps = {
    meetingName: string;
    attendeeId: string;
};

export type GetAttendeeResponse = {
    AttendeeInfo: {
        AttendeeId: string;
        Name: string;
    };
};
export const getAttendee = async (props: GetAttendeeProps): Promise<GetAttendeeResponse> => {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.open("GET", `/attendee?meetingName=${props.meetingName}&attendeeId=${props.attendeeId}`, true);
        req.onload = function () {
            if (req.status === 200) {
                const res: GetAttendeeResponse = JSON.parse(req.responseText);
                resolve(res);
            } else {
                reject(new Error(req.statusText));
            }
        };
        req.onerror = function () {
            reject(new Error(req.statusText));
        };
        req.send();
    });
};
