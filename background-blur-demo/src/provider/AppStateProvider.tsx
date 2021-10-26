import { VideoTile, VideoTileState } from "amazon-chime-sdk-js";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { ReactNode } from "react";
import { AttendeeState, BackgroundBlurLevel, NoiseSuppressionLevel, useChimeClient } from "./hooks/useChimeClient";
import { DeviceInfo, useDeviceState } from "./hooks/useDeviceState";
import { MessageType, useMessageState } from "./hooks/useMessageState";
import { STAGE, useStageManager } from "./hooks/useStageManager";
import { useWindowSizeChangeListener } from "./hooks/useWindowSizeChange";

type Props = {
    children: ReactNode;
};

interface AppStateValue {
    // chimeClientUpdateTime: number;
    /** For StageManager */
    stage: STAGE;
    setStage: (stage: STAGE) => void;

    /** For Message*/
    messageActive: boolean;
    messageType: MessageType;
    messageTitle: string;
    messageDetail: string[];
    setMessage: (type: MessageType, title: string, detail: string[]) => void;
    resolveMessage: () => void;

    /** For ChimeClient**/
    userName?: string;
    attendeeId?: string;
    meetingName?: string;
    region?: string;
    attendeeList: { [attendeeId: string]: AttendeeState };
    // videoTileList: { [attendeeId: string]: VideoTileState };
    activeSpeakerId: string | null;
    meetingStated: boolean;

    joinMeeting: (meetingName: string, userName: string, region: string) => Promise<void>;
    enterMeeting: () => Promise<void>;
    leaveMeeting: () => Promise<void>;
    audioInputDeviceId: string | null;
    videoInputDeviceId: string | null;
    audioOutputDeviceId: string | null;
    audioInputEnable: boolean;
    videoInputEnable: boolean;
    audioOutputEnable: boolean;

    setAudioInputDevice: (deviceId: string | null) => Promise<void>;
    setVideoInputDevice: (deviceId: string | null) => Promise<void>;
    setAudioOutputDevice: (deviceId: string | null) => Promise<void>;
    setAudioOutputElement: (element: HTMLAudioElement) => Promise<void>;
    setAudioInputEnable: (enable: boolean) => void;
    setVideoInputEnable: (enable: boolean) => void;
    setAudioOutputEnable: (enable: boolean) => void;
    startLocalVideoTile: () => void;
    stopLocalVideoTile: () => void;
    bindVideoElement: (tileId: number, videoElement: HTMLVideoElement) => void;

    backgroundBlurLevel: BackgroundBlurLevel;
    noiseSuppressionLevel: NoiseSuppressionLevel;
    setBackgroundBlurLevel: (level: BackgroundBlurLevel) => void;
    setNoiseSuppressionLevel: (level: NoiseSuppressionLevel) => void;

    setPreviewVideoElement: (element: HTMLVideoElement | null) => void;
    startPreviewVideoElement: () => void;
    stopPreviewVideoElement: () => void;
    getContentTiles: () => VideoTile[];
    getActiveSpeakerTiles: () => VideoTile[];
    getAllTiles: () => VideoTile[];
    getUserNameByAttendeeId: (attendeeId: string, cahce: boolean) => string;
    hasLocalVideoStarted: () => boolean;
    performance: number[];
    performance2: number;
    /** For Device State */
    audioInputList: DeviceInfo[] | null;
    videoInputList: DeviceInfo[] | null;
    audioOutputList: DeviceInfo[] | null;
    reloadDevices: () => void;
    /** Window Size */
    screenWidth: number;
    screenHeight: number;
}

const AppStateContext = React.createContext<AppStateValue | null>(null);

export const useAppState = (): AppStateValue => {
    const state = useContext(AppStateContext);
    if (!state) {
        throw new Error("useAppState must be used within AppStateProvider");
    }
    return state;
};

const query = new URLSearchParams(window.location.search);

export const AppStateProvider = ({ children }: Props) => {
    const { stage, setStage } = useStageManager({});
    const { messageActive, messageType, messageTitle, messageDetail, setMessage, resolveMessage } = useMessageState();

    const {
        // chimeClientUpdateTime,
        userName,
        attendeeId,
        meetingName,
        region,
        attendeeList,
        // videoTileList,
        activeSpeakerId,
        meetingStated,
        joinMeeting,
        enterMeeting,
        leaveMeeting,
        //// (1) I/O Device
        audioInputDeviceId,
        videoInputDeviceId,
        audioOutputDeviceId,
        audioInputEnable,
        videoInputEnable,
        audioOutputEnable,

        setAudioInputDevice,
        setVideoInputDevice,
        setAudioOutputDevice,
        setAudioOutputElement,
        setAudioInputEnable,
        setVideoInputEnable,
        setAudioOutputEnable,

        startLocalVideoTile,
        stopLocalVideoTile,
        bindVideoElement,
        //// (2) I/O Effector
        backgroundBlurLevel,
        noiseSuppressionLevel,
        setBackgroundBlurLevel,
        setNoiseSuppressionLevel,

        //// (3) For Wait Room
        setPreviewVideoElement,
        startPreviewVideoElement,
        stopPreviewVideoElement,

        getContentTiles,
        getActiveSpeakerTiles,
        getAllTiles,
        getUserNameByAttendeeId,
        hasLocalVideoStarted,
        performance,
        performance2,
    } = useChimeClient();
    const { audioInputList, videoInputList, audioOutputList, reloadDevices } = useDeviceState();
    const { screenWidth, screenHeight } = useWindowSizeChangeListener();

    const providerValue = {
        // chimeClientUpdateTime,
        /** For StageManager */
        stage,
        setStage,
        /** For Message*/
        messageActive,
        messageType,
        messageTitle,
        messageDetail,
        setMessage,
        resolveMessage,

        /** For ChimeClient**/
        userName,
        attendeeId,
        meetingName,
        region,
        attendeeList,
        // videoTileList,
        activeSpeakerId,
        meetingStated,
        joinMeeting,
        enterMeeting,
        leaveMeeting,
        //// (1) I/O Device
        audioInputDeviceId,
        videoInputDeviceId,
        audioOutputDeviceId,
        audioInputEnable,
        videoInputEnable,
        audioOutputEnable,

        setAudioInputDevice,
        setVideoInputDevice,
        setAudioOutputDevice,
        setAudioOutputElement,
        setAudioInputEnable,
        setVideoInputEnable,
        setAudioOutputEnable,

        startLocalVideoTile,
        stopLocalVideoTile,
        bindVideoElement,
        //// (2) I/O Effector
        backgroundBlurLevel,
        noiseSuppressionLevel,
        setBackgroundBlurLevel,
        setNoiseSuppressionLevel,

        //// (3) For Wait Room
        setPreviewVideoElement,
        startPreviewVideoElement,
        stopPreviewVideoElement,

        getContentTiles,
        getActiveSpeakerTiles,
        getAllTiles,
        getUserNameByAttendeeId,
        hasLocalVideoStarted,
        performance,
        performance2,

        /** For Device State */
        audioInputList,
        videoInputList,
        audioOutputList,
        reloadDevices,

        /** Window Size */
        screenWidth,
        screenHeight,
    };

    return <AppStateContext.Provider value={providerValue}>{children}</AppStateContext.Provider>;
};
