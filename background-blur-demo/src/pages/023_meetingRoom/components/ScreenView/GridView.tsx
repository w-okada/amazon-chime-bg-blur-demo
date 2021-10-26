import { GridList, GridListTile, GridListTileBar, makeStyles, withStyles } from "@material-ui/core";
import React, { useEffect, useMemo } from "react";
import { useAppState } from "../../../../provider/AppStateProvider";

const GridListTileBar2 = withStyles({
    root: {
        height: 15,
    },
    title: {
        fontSize: 10,
    },
})(GridListTileBar);

const useStyles = makeStyles((theme) => ({
    gridList: {
        width: "100%",
    },
    videoTile: {
        width: "100%",
        height: "100%",
    },
    videoTileActive: {
        width: "100%",
        height: "100%",
    },
    videoTileBar: {},
    videoTileBarActive: {
        backgroundColor: "#ee7777",
    },
}));

type Props = {
    excludeSharedContent: boolean;
    width: number;
    height: number;
};

export const GridView = ({ excludeSharedContent, width, height }: Props) => {
    const { getAllTiles, bindVideoElement, hasLocalVideoStarted, backgroundBlurLevel } = useAppState();

    const targetTiles = getAllTiles().filter((x) => {
        if (x.state().localTile && hasLocalVideoStarted() === false) {
            return false;
        } else {
            return true;
        }

        // return !x.state().localTile || x.state().active;
    });

    // rendering flag
    const targetIds = targetTiles.reduce<string>((ids, cur) => {
        return `${ids}_${cur.state().boundAttendeeId}`;
    }, "");

    // Bind and Fit Size
    useEffect(() => {
        {
            targetTiles.map((tile, index) => {
                const idPrefix = `drawable-videotile-${tile.state().boundAttendeeId}`;
                const videoElementId = `${idPrefix}-${index}-video`;
                const videoElement = document.getElementById(videoElementId)! as HTMLVideoElement;
                // Bind Video
                if (videoElement && tile.state().tileId) {
                    bindVideoElement(tile.state().tileId!, videoElement);
                } else {
                    console.log("BIND FAILED", videoElementId, videoElement);
                }
            });
        }
    }, [targetIds, width, height]); // eslint-disable-line

    const cols = Math.min(Math.ceil(Math.sqrt(targetTiles.length)), 5);
    const rows = Math.ceil(targetTiles.length / cols);
    const contentWidth = width / cols;
    const contentHeight = height / rows;
    const grid = useMemo(() => {
        return (
            <div style={{ display: "flex" }}>
                {/* <GridList cellHeight="auto" className={classes.gridList} cols={cols}> */}
                {targetTiles.map((tile, index) => {
                    const idPrefix = `drawable-videotile-${tile.state().boundAttendeeId}`;
                    const videoElementId = `${idPrefix}-${index}-video`;
                    return (
                        // <GridListTile key={tile.state().boundAttendeeId} cols={1}>
                        <video id={videoElementId} key={videoElementId} style={{ objectFit: "contain", width: contentWidth, height: contentHeight }} />
                        // </GridListTile>
                    );
                })}
                {/* </GridList> */}
            </div>
        );
    }, [targetIds, width, height]); // eslint-disable-line

    return <>{grid}</>;
};
