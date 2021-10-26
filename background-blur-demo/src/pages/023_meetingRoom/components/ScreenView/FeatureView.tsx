import React, { useMemo } from "react";
import { useAppState } from "../../../../provider/AppStateProvider";
import { FocustTarget, PictureInPictureType } from "./const";
import { FullScreenView } from "./FullScreenView";
import { LineView } from "./LineView";

type FeatureViewProps = {
    pictureInPicture: PictureInPictureType;
    focusTarget: FocustTarget;
    width: number;
    height: number;
};

export const FeatureView = ({ pictureInPicture, focusTarget, width, height }: FeatureViewProps) => {
    const { attendeeList } = useAppState();
    const lineViewOffset = height * 0.8;
    const mainView = useMemo(() => {
        return <FullScreenView height={height * 0.8} width={width} pictureInPicture={"None"} focusTarget={"SharedContent"} />;
    }, [width, height, attendeeList]);

    const attendeeView = useMemo(() => {
        return <LineView height={height * 0.2} width={width} excludeSharedContent={false} excludeSpeaker={false} viewInLine={5} />;
    }, [width, height, attendeeList]);

    return (
        <>
            <div>{mainView}</div>
            <div style={{ position: "relative", top: lineViewOffset }}>{attendeeView}</div>
        </>
    );
};
