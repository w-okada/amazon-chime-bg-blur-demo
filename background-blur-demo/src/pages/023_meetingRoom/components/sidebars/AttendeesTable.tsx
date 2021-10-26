import React, { useMemo } from "react";
import { IconButton, Tooltip } from "@material-ui/core";
import VideocamIcon from "@material-ui/icons/Videocam";
import VideocamOffIcon from "@material-ui/icons/VideocamOff";
import { useAppState } from "../../../../provider/AppStateProvider";

type VideoState = "ENABLED" | "PAUSED" | "NOT_SHARE";

export const AttendeesTable = () => {
    const { attendeeId, attendeeList, getAllTiles, hasLocalVideoStarted } = useAppState();

    // console.log("[ATTENDEESTABLE!]", attendeeList, chimeClientUpdateTime);
    const allTiles = getAllTiles();
    const targetVideoStates: VideoState[] = Object.values(attendeeList).map((x) => {
        const tile = allTiles.find((t) => {
            return t.state().boundAttendeeId === x.attendeeId;
        });
        if (!tile) {
            return "NOT_SHARE";
        }
        if (x.attendeeId === attendeeId) {
            // For Loca Tile
            if (hasLocalVideoStarted() && x.isVideoPaused === false) {
                return "ENABLED";
            } else if (hasLocalVideoStarted() && x.isVideoPaused === true) {
                return "PAUSED";
            } else {
                return "NOT_SHARE";
            }
        }
        // For Remote Tile
        if (x.isVideoPaused) {
            return "PAUSED";
        } else {
            return "ENABLED";
        }
    });

    const targetVideoStatesString = targetVideoStates.reduce<string>((states, cur) => {
        return `${states}_${cur}`;
    }, "");

    const audienceList = useMemo(() => {
        const l = Object.values(attendeeList).map((x, index) => {
            let videoStateComp;
            switch (targetVideoStates[index]) {
                case "ENABLED":
                    videoStateComp = (
                        <Tooltip title={`click to pause`}>
                            <IconButton
                                style={{ width: "20px", height: "20px", color: "black" }}
                                onClick={() => {
                                    // chimeClient!.setPauseVideo(x.attendeeId, true);
                                    console.log("pause clicked");
                                }}
                            >
                                <VideocamIcon></VideocamIcon>
                            </IconButton>
                        </Tooltip>
                    );
                    break;
                case "PAUSED":
                    videoStateComp = (
                        <Tooltip title={`click to play`}>
                            <IconButton
                                style={{ width: "20px", height: "20px", color: "black" }}
                                onClick={() => {
                                    // chimeClient!.setPauseVideo(x.attendeeId, false);
                                    console.log("pause clicked");
                                }}
                            >
                                <VideocamOffIcon></VideocamOffIcon>
                            </IconButton>
                        </Tooltip>
                    );
                    break;
                case "NOT_SHARE":
                    videoStateComp = (
                        <Tooltip title={`not share`}>
                            <IconButton style={{ width: "20px", height: "20px", color: "gray" }}>
                                <VideocamOffIcon></VideocamOffIcon>
                            </IconButton>
                        </Tooltip>
                    );
                    break;
            }

            return (
                <div style={{ display: "flex", flexDirection: "row" }} key={x.attendeeId}>
                    <Tooltip title={`${x.attendeeId}`}>
                        <div>{x.name}</div>
                    </Tooltip>
                    <div>{videoStateComp}</div>
                </div>
            );
        });

        return <div style={{ display: "flex", flexDirection: "column" }}>{l}</div>;
    }, [attendeeList, targetVideoStatesString]); // eslint-disable-line

    return (
        <>
            <div style={{ marginLeft: "15pt" }}>{audienceList}</div>
        </>
    );
};
