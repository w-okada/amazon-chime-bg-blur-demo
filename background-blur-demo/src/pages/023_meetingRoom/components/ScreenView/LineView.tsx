import React, { useEffect, useMemo, useState } from "react";
import { useAppState } from "../../../../provider/AppStateProvider";
import { MeetingRoom, ArrowForward, ArrowBack } from "@material-ui/icons";

type Props = {
    excludeSpeaker: boolean;
    excludeSharedContent: boolean;
    width: number;
    height: number;
    viewInLine: number;
};
export const LineView = ({ excludeSpeaker, excludeSharedContent, width, height, viewInLine }: Props) => {
    const colNum = 5;

    const [pageNum, setPageNum] = useState(0);
    const { attendeeList, activeSpeakerId, getAllTiles, getUserNameByAttendeeId, bindVideoElement, backgroundBlurLevel } = useAppState();

    const attendeeNum = Object.keys(attendeeList).length;
    const allPageNum = attendeeNum % colNum === 0 ? Math.floor(attendeeNum / colNum) - 1 : Math.floor(attendeeNum / colNum);
    const startNum = colNum * pageNum;
    const endNum = startNum + 5;
    const showAttendees = Object.keys(attendeeList).slice(startNum, endNum);
    const allTiles = getAllTiles();
    const showAttendeesTiles = allTiles.filter((x) => {
        return showAttendees.includes(x.state().boundAttendeeId!);
    });
    const attendeeIdsOfshowAttendeeIiles = showAttendeesTiles.map((x) => {
        return x.state().boundAttendeeId;
    });

    useEffect(() => {
        showAttendees.map((attendeeId, i) => {
            const lineViewId = `line-view-${i}`;
            const element = document.getElementById(lineViewId);
            if (element instanceof HTMLVideoElement) {
                const tile = showAttendeesTiles.find((x) => {
                    return x.state().boundAttendeeId === attendeeId;
                });
                if (tile) {
                    bindVideoElement(tile.state().tileId!, element);
                }
            } else if (element instanceof HTMLCanvasElement) {
                const ctx = element.getContext("2d")!;
                ctx.fillStyle = "#000000";
                ctx.clearRect(0, 0, element.width, element.height);
                ctx.fillStyle = "#00ffff";
                if (attendeeId === activeSpeakerId) {
                    ctx.fillText("ACTIVE SPEAKER", 100, 100);
                } else {
                    ctx.fillText("NO VIDEO", 100, 100);
                }
            } else {
            }
        });
    }, [pageNum, attendeeList, activeSpeakerId]);

    const onPrevClick = () => {
        setPageNum(pageNum - 1);
    };
    const onNextClick = () => {
        setPageNum(pageNum + 1);
    };

    const view = useMemo(() => {
        const colWidth = Math.floor(width / colNum) - 30;

        return (
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", width: `${width}px`, height: `${height}px`, overflowX: "auto" }}>
                <div onClick={onPrevClick}>{pageNum !== 0 ? <ArrowBack /> : <></>}</div>
                {showAttendees.map((attendeeId, i) => {
                    const lineViewContainerId = `line-view-container-${i}`;
                    const lineViewId = `line-view-${i}`;
                    return (
                        <div key={lineViewContainerId} style={{ background: "#000000", height: height - 2, width: colWidth, margin: "1px", flex: "0 0 auto", position: "relative" }}>
                            {attendeeIdsOfshowAttendeeIiles.includes(attendeeId) && attendeeId !== activeSpeakerId ? (
                                <video id={lineViewId} width={colWidth} height={height - 2} />
                            ) : (
                                <canvas id={lineViewId} width={colWidth} height={height - 2} />
                            )}
                            <div
                                style={{
                                    position: "absolute",
                                    lineHeight: 1,
                                    fontSize: 14,
                                    height: 15,
                                    top: height - 20,
                                    left: 5,
                                    background: attendeeId === activeSpeakerId ? "#ee7777cc" : "#777777cc",
                                }}
                            >
                                {getUserNameByAttendeeId(attendeeId, true)}
                            </div>
                        </div>
                    );
                })}
                <div onClick={onNextClick}>{pageNum < allPageNum ? <ArrowForward /> : <></>}</div>
            </div>
        );
    }, [pageNum, attendeeList, activeSpeakerId]); // eslint-disable-line

    return <>{view}</>;
};
