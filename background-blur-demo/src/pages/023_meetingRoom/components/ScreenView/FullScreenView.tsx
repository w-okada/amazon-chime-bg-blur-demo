import React, { useEffect, useMemo } from "react";
import { FocustTarget, PictureInPictureType } from "./const";
import { VideoTile, VideoTileState } from "amazon-chime-sdk-js";
import { useAppState } from "../../../../provider/AppStateProvider";

type FullScreenProps = {
    pictureInPicture: PictureInPictureType;
    focusTarget: FocustTarget;
    width: number;
    height: number;
};

export const FullScreenView = ({ pictureInPicture, focusTarget, width, height }: FullScreenProps) => {
    const { attendeeList, getActiveSpeakerTiles, getContentTiles, bindVideoElement, backgroundBlurLevel } = useAppState();

    const contentsTiles = getContentTiles();
    const activeSpekerTiles = getActiveSpeakerTiles();
    let targetTiles: VideoTile[] = [];

    if (contentsTiles.length > 0) {
        targetTiles = targetTiles.concat(contentsTiles);
    } else if (activeSpekerTiles.length > 0) {
        targetTiles = targetTiles.concat(activeSpekerTiles);
    }

    // rendering flag
    const targetIds = targetTiles.reduce<string>((ids, cur) => {
        return `${ids}_${cur.state().boundAttendeeId}`;
    }, "");

    // Bind and Fit Size
    useEffect(() => {
        {
            targetTiles.map((tile, index) => {
                const idPrefix = `drawable-videotile-${tile.state().boundAttendeeId}`;
                const videoElementId = `${idPrefix}-video`;
                const videoElement = document.getElementById(videoElementId)! as HTMLVideoElement;
                // Bind Video
                if (videoElement && tile.state().tileId) {
                    bindVideoElement(tile.state().tileId!, videoElement);
                } else {
                    console.log("BIND FAILED", videoElementId, videoElement);
                }
            });
        }
    }, [targetIds, width, height, attendeeList]); // eslint-disable-line

    const view = useMemo(() => {
        const contentWidth = width / targetTiles.length;
        return (
            <div style={{ display: "flex", flexWrap: "nowrap", width: `${width}px`, height: `${height}px`, objectFit: "contain", position: "absolute" }}>
                {targetTiles.map((tile, index) => {
                    if (!tile) {
                        return <div key={index}>no share contets, no active speaker</div>;
                    }
                    const idPrefix = `drawable-videotile-${tile.state().boundAttendeeId}`;
                    const videoElementId = `${idPrefix}-video`;
                    return (
                        <div style={{ width: width, height: height }} key={videoElementId}>
                            <video id={videoElementId} style={{ objectFit: "contain", position: "absolute", height: height, width: contentWidth }} />
                        </div>
                    );
                })}
            </div>
        );
    }, [targetIds, width, height, attendeeList]); // eslint-disable-line

    return <>{view}</>;
};
