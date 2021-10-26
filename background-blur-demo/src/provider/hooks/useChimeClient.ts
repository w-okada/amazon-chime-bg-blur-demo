import {
    AudioInputDevice,
    BackgroundBlurVideoFrameProcessor,
    ConsoleLogger,
    DefaultActiveSpeakerPolicy,
    DefaultDeviceController,
    DefaultMeetingSession,
    DefaultVideoTransformDevice,
    MeetingSessionConfiguration,
    NoOpVideoFrameProcessor,
    VideoFrameProcessor,
    VideoInputDevice,
    VideoTileState,
    VoiceFocusDeviceTransformer,
    VoiceFocusTransformDevice,
} from "amazon-chime-sdk-js";
import BlurStrength from "amazon-chime-sdk-js/build/backgroundblurprocessor/BackgroundBlurStrength";
import { useMemo, useRef, useState } from "react";
import * as api from "../../api/api";
import { FrameCounterProcessor } from "./utils/FrameCounterProcessor";
import { FramePerfMonitor } from "./utils/FramePerformMonitor";



interface ChimeClientState {
    userName?: string;
    attendeeId?: string;
    meetingName?: string;
    region?: string;

    meetingSession?: DefaultMeetingSession;
    previewCanvas?: HTMLVideoElement | null;
    meetingStarted: boolean;
}

export type AttendeeState = {
    attendeeId: string;
    name: string;
    active: boolean;
    score: number; // active score
    volume: number; // volume
    muted: boolean;
    paused: boolean;
    signalStrength: number;
    isSharedContent: boolean;
    ownerId: string;
    isVideoPaused: boolean;
    tileId: number;
};

export const NoiseSuppressionLevel = {
    c100: "c100",
    c50: "c50",
    c20: "c20",
    c10: "c10",
    none: "none",
    auto: "auto",
} as const;
export type NoiseSuppressionLevel = typeof NoiseSuppressionLevel[keyof typeof NoiseSuppressionLevel];

// const NoiseSuppressionLevelWithoutNone = {
//     c100: "c100",
//     c50: "c50",
//     c20: "c20",
//     c10: "c10",
//     auto: "auto",
// } as const;
// type NoiseSuppressionLevelWithoutNone = typeof NoiseSuppressionLevelWithoutNone[keyof typeof NoiseSuppressionLevelWithoutNone];

export const BackgroundBlurLevel = {
    HIGH: 30,
    MEDIUM: 15,
    LOW: 7,
    NONE: 0,
} as const;
export type BackgroundBlurLevel = typeof BackgroundBlurLevel[keyof typeof BackgroundBlurLevel];

export const useChimeClient = () => {
    const [state, setState] = useState<ChimeClientState>({ meetingStarted: false });
    // const [chimeClientUpdateTime, setChimeClientUpdateTime] = useState(new Date().getTime());

    const _attendeeList = useRef<{ [attendeeId: string]: AttendeeState }>({});
    const [attendeeList, setAttendeeList] = useState(_attendeeList.current);

    const _activeSpeakerId = useRef<string | null>(null);
    const [activeSpeakerId, setActiveSpeakerId] = useState(_activeSpeakerId.current);

    const [audioInputDeviceId, setAudioInputDeviceId] = useState<string | null>(null);
    const [videoInputDeviceId, setVideoInputDeviceId] = useState<string | null>(null);
    const [audioOutputDeviceId, setAudioOutputDeviceId] = useState<string | null>(null);
    const [noiseSuppressionLevel, _setNoiseSuppressionLevel] = useState<NoiseSuppressionLevel>("c10");
    const [backgroundBlurLevel, _setBackgroundBlurLevel] = useState<BackgroundBlurLevel>(BackgroundBlurLevel.NONE);

    const _audioOutputElement = useRef<HTMLAudioElement | null>(null);

    const [audioInputEnable, _setAudioInputEnable] = useState(true);
    const [videoInputEnable, _setVideoInputEnable] = useState(true);
    const [audioOutputEnable, _setAudioOutputEnable] = useState(true);
    const [voiceFocusTransformDevice, setVoiceFocusTransformDevice] = useState<VoiceFocusTransformDevice | null>(null);

    const [voiceFocusDeviceTransformers, setVoiceFocusDeviceTransformers] = useState<{ [key: string]: VoiceFocusDeviceTransformer }>({});
    const [voiceFocusTransformDevices, setVoiceFocusTransformDevices] = useState<{ [key: string]: VoiceFocusTransformDevice }>({});

    const [videoTransformDevices, setVideoTransformDevices] = useState<{ [key: string]: DefaultVideoTransformDevice }>({});
    const [videoFrameProcessors, setVideoFrameProcessors] = useState<{ [key: string]: VideoFrameProcessor }>({});

    const [performance, setPerformance] = useState<number[]>([0, 0]);
    const [performance2, setPerformance2] = useState<number>(0);

    const perfStartData = useRef<number>(0);
    const perfEndData = useRef<number>(0);
    const perfDiffData = useRef<number[]>([]);

    const createFrameCounterProcessor = (key: string) => {
        return new FrameCounterProcessor((timestamps: number[]) => {
            if (timestamps.length === 30) {
                const start = timestamps[0];
                const end = timestamps[timestamps.length - 1];
                const avr = Math.round((end - start) / timestamps.length);
                const fps = Math.round(1000 / avr);
                console.log(`avr:${key} ${avr}ms/frame, ${fps}fps`);
                setPerformance([avr, fps]);
            }
        });
    };

    const createFramePerfMonitor_start = () => {
        return new FramePerfMonitor(perfStartData);
    };
    const createFramePerfMonitor_end = () => {
        return new FramePerfMonitor(perfEndData, () => {
            const processingTime = perfEndData.current - perfStartData.current;
            perfDiffData.current.push(processingTime);
            if (perfDiffData.current.length % 30 === 0) {
                const diffSum = perfDiffData.current.reduce((prev, cur) => {
                    return prev + cur;
                }, 0);
                const avr = Math.round(diffSum / 30);
                setPerformance2(avr);
                perfDiffData.current.splice(0);
            }
        });
    };

    //////////////////////////////
    /// Meeting Operation    /////
    //////////////////////////////
    // (1) joinMeeting
    const joinMeeting = async (meetingName: string, userName: string, region: string) => {
        const meetingInfo = await api.joinMeeting({
            meetingName,
            userName,
            region,
        });
        const logger = new ConsoleLogger("MeetingLogs");
        const deviceController = new DefaultDeviceController(logger, {
            enableWebAudio: true,
        });
        deviceController.addDeviceChangeObserver({
            audioInputsChanged(_freshAudioInputDeviceList: MediaDeviceInfo[]): void {
                console.log("audioInputsChanged", _freshAudioInputDeviceList);
            },
            audioOutputsChanged(_freshAudioOutputDeviceList: MediaDeviceInfo[]): void {
                console.log("audioOutputsChanged", _freshAudioOutputDeviceList);
            },
            videoInputsChanged(_freshVideoInputDeviceList: MediaDeviceInfo[]): void {
                console.log("videoInputsChanged", _freshVideoInputDeviceList);
            },
        });
        const configuration = new MeetingSessionConfiguration(meetingInfo.JoinInfo.Meeting, meetingInfo.JoinInfo.Attendee);
        const meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);

        meetingSession.audioVideo.addObserver({
            // audioVideoDidStartConnecting(reconnecting: boolean): void {}
            // audioVideoDidStart(): void {}
            // audioVideoDidStop(sessionStatus: MeetingSessionStatus): void {}
            videoTileDidUpdate(tileState: VideoTileState): void {
                console.log(`[DEBUG] [${tileState.tileId}, ${tileState.boundAttendeeId}] videoTileDidUpdate`);
                if (_attendeeList.current[tileState.boundAttendeeId!]) {
                    _attendeeList.current[tileState.boundAttendeeId!].tileId = tileState.tileId!;
                    setAttendeeList({ ..._attendeeList.current });
                } else {
                }
            },
            videoTileWasRemoved(tileId: number): void {
                console.log(`[DEBUG] [${tileId}] videoTileWasRemoved`);
                const attendee = Object.values(_attendeeList.current).find((x) => {
                    return x.tileId === tileId;
                });
                if (attendee) {
                    attendee.tileId = -1;
                    console.log(`[DEBUG] [${tileId}] videoTileWasRemoved update`);
                    setAttendeeList({ ..._attendeeList.current });
                }
            },
            // videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void {}

            ////// videoSendHealthDidChange
            ////// videoSendBandwidthDidChange
            ////// videoReceiveBandwidthDidChange

            ////// estimatedDownlinkBandwidthLessThanRequired(estimatedDownlinkBandwidthKbps: number, requiredVideoDownlinkBandwidthKbps: number): void {},
            ////// videoNotReceivingEnoughData?(receivingDataMap
            //metricsDidReceive(clientMetricReport: ClientMetricReport): void {}
            ////// connectionHealthDidChange
            //// connectionDidBecomePoor(): void {}
            //// connectionDidSuggestStopVideo(): void {}
            ///// videoSendDidBecomeUnavailable(): void {}
        });
        // meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence((attendeeId: string, present: boolean) => {
        //     console.log(`[DEBUG] attendeeIdPresenceSubscriber ${attendeeId} present = ${present}`);
        // });
        // meetingSession.audioVideo.subscribeToActiveSpeakerDetector(
        //     new DefaultActiveSpeakerPolicy(),
        //     (attendeeIds: string[]) => {
        //         console.log(`[DEBUG] activeSpeakerDetectorSubscriber ${attendeeIds}`);
        //     },
        //     (scores) => {
        //         //console.log("subscribeToActiveSpeakerDetector", scores)
        //     },
        //     100
        // );

        const audioInputDevices = await meetingSession.deviceController.listAudioInputDevices();
        const videoInputDevices = await meetingSession.deviceController.listVideoInputDevices();
        const audioOutputDevices = await meetingSession.deviceController.listAudioOutputDevices();
        // console.log(audioInputDevices);

        setState({ ...state, userName, attendeeId: meetingInfo.JoinInfo.Attendee.AttendeeId, meetingName, region, meetingSession: meetingSession });
    };

    // (2) enterMeeting
    const enterMeeting = async () => {
        if (!state.meetingSession) {
            console.log("[Debug] meetingsession is null?", state.meetingSession);
            throw new Error("meetingsession is null?");
        }

        // (1) prepair
        //// https://github.com/aws/amazon-chime-sdk-js/issues/502#issuecomment-652665492
        //// When stop preview, camera stream is terminated!!? So when enter meeting I rechoose Devices as workaround. (2)
        stopPreviewVideoElement();

        // (2) subscribe AtttendeeId presence
        state.meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence(async (attendeeId: string, present: boolean) => {
            console.log(`[Debug] ${attendeeId} present = ${present}`);
            if (present) {
                if (attendeeId in Object.keys(_attendeeList.current) === false) {
                    let userName = "";
                    if (attendeeId.indexOf("#") > 0) {
                        const strippedAttendeeId = attendeeId.substring(0, attendeeId.indexOf("#"));
                        const result = await api.getAttendee({ meetingName: state.meetingName!, attendeeId: strippedAttendeeId });
                        userName = result.AttendeeInfo.Name;
                    } else {
                        try {
                            const result = await api.getAttendee({ meetingName: state.meetingName!, attendeeId: attendeeId });
                            userName = result.AttendeeInfo.Name;
                        } catch {
                            userName = attendeeId;
                        }
                    }
                    // Add to Attendee List
                    const new_attendee: AttendeeState = {
                        attendeeId: attendeeId,
                        name: userName,
                        active: false,
                        score: 0,
                        volume: 0,
                        muted: false,
                        paused: false,
                        signalStrength: 0,
                        isSharedContent: false,
                        ownerId: "",
                        isVideoPaused: false,
                        tileId: -1,
                    };

                    if (attendeeId.split("#").length === 2) {
                        new_attendee.isSharedContent = true;
                        new_attendee.ownerId = attendeeId.split("#")[0];
                    }

                    _attendeeList.current[attendeeId] = new_attendee;

                    // Add Subscribe volume Indicator
                    state.meetingSession!.audioVideo.realtimeSubscribeToVolumeIndicator(
                        attendeeId,
                        async (attendeeId: string, volume: number | null, muted: boolean | null, signalStrength: number | null) => {
                            _attendeeList.current[attendeeId].volume = volume || 0;
                            _attendeeList.current[attendeeId].muted = muted || false;
                            _attendeeList.current[attendeeId].signalStrength = signalStrength || 0;
                        }
                    );
                    setAttendeeList({ ..._attendeeList.current });
                    // setChimeClientUpdateTime(new Date().getTime());
                    // console.log("[DEBUG] ATTENDEE LIST UPDATED (add)");
                } else {
                    console.log(`[DEBUG]  ${attendeeId} is already in attendees`);
                }
                return;
            } else {
                console.log(`[Debug] 3 ${_attendeeList.current}`);

                // Delete Subscribe volume Indicator
                state.meetingSession!.audioVideo.realtimeUnsubscribeFromVolumeIndicator(attendeeId);
                delete _attendeeList.current[attendeeId];
                console.log("[DEBUG] ATTENDEE LIST UPDATED (del)");
                // setChimeClientUpdateTime(new Date().getTime());
                setAttendeeList({ ..._attendeeList.current });
                return;
            }
        });

        // (3) subscribe ActiveSpeakerDetector
        state.meetingSession.audioVideo.subscribeToActiveSpeakerDetector(
            new DefaultActiveSpeakerPolicy(),
            (activeSpeakers: string[]) => {
                let newActiveSpeakerId: string | null = null;
                for (const attendeeId in _attendeeList.current) {
                    _attendeeList.current[attendeeId].active = false;
                }
                for (const attendeeId of activeSpeakers) {
                    if (_attendeeList.current[attendeeId]) {
                        _attendeeList.current[attendeeId].active = true;
                        newActiveSpeakerId = attendeeId;
                        break;
                    }
                }
                if (!_activeSpeakerId.current || _activeSpeakerId.current !== newActiveSpeakerId) {
                    _activeSpeakerId.current = newActiveSpeakerId;
                }
                //setChimeClientUpdateTime(new Date().getTime());
                setAttendeeList({ ..._attendeeList.current });
                setActiveSpeakerId(_activeSpeakerId.current);
            },
            (scores: { [attendeeId: string]: number }) => {
                for (const attendeeId in scores) {
                    if (_attendeeList.current[attendeeId]) {
                        _attendeeList.current[attendeeId].score = scores[attendeeId];
                    }
                }
                setAttendeeList({ ..._attendeeList.current });
                //setChimeClientUpdateTime(new Date().getTime());
            },
            5000
        );

        // (4) start
        state.meetingSession!.audioVideo.start();
        setState({ ...state, meetingStarted: true });
        await state.meetingSession!.audioVideo.chooseVideoInputDevice(videoInputDeviceId).then(() => {
            state.meetingSession!.audioVideo.startLocalVideoTile();
        });
    };

    // (3) leaveMeeting
    const leaveMeeting = async () => {
        state.meetingSession!.audioVideo.stop();
        setState({ meetingStarted: false });
        Object.keys(_attendeeList.current).forEach((key) => {
            delete _attendeeList.current[key];
        });

        _activeSpeakerId.current = null;
        //setChimeClientUpdateTime(new Date().getTime());
        setAttendeeList({ ..._attendeeList.current });
        setActiveSpeakerId(_activeSpeakerId.current);
    };

    /////////////////////////
    /// Meeting Control   ///
    /////////////////////////
    //// (1-1)
    const setAudioInputCommon = async (deviceId: string | null, noiseSuppressionLevel: NoiseSuppressionLevel) => {
        let inputMediaStream: MediaStream | null = null;
        if (deviceId === "dummy") {
            const audioContext = DefaultDeviceController.getAudioContext();
            const dummyOutputNode = audioContext.createMediaStreamDestination();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.0;
            gainNode.connect(dummyOutputNode);
            const oscillatorNode = audioContext.createOscillator();
            oscillatorNode.frequency.value = 440;
            oscillatorNode.connect(gainNode);
            oscillatorNode.start();
            inputMediaStream = dummyOutputNode.stream;
        }

        if (voiceFocusTransformDevice) {
            voiceFocusTransformDevice.stop();
        }

        if (noiseSuppressionLevel === "none") {
            state.meetingSession!.audioVideo.chooseAudioInputDevice(inputMediaStream || deviceId);
        } else {
            const key = noiseSuppressionLevel.toString();
            let voiceFocusDeviceTransformer: VoiceFocusDeviceTransformer | null = null;
            if (await VoiceFocusDeviceTransformer.isSupported()) {
                if (voiceFocusDeviceTransformers[key]) {
                    voiceFocusDeviceTransformer = voiceFocusDeviceTransformers[key];
                } else {
                    voiceFocusDeviceTransformer = await VoiceFocusDeviceTransformer.create({ variant: noiseSuppressionLevel });
                }
                if (voiceFocusDeviceTransformer.isSupported() === false) {
                    console.log("[DeviceSetting] Transformer for suppression is created, but not supported.");
                    voiceFocusDeviceTransformer = null;
                }
            }

            if (voiceFocusDeviceTransformer === null) {
                state.meetingSession!.audioVideo.chooseAudioInputDevice(inputMediaStream || deviceId);
                throw "VoiceFocus is not supported";
            } else {
                let voiceFocusTransformDevice;
                if (voiceFocusTransformDevices[key]) {
                    voiceFocusTransformDevice = voiceFocusTransformDevices[key];
                } else {
                    voiceFocusTransformDevice = await voiceFocusDeviceTransformer.createTransformDevice(inputMediaStream || deviceId);
                }
                if (voiceFocusTransformDevice) {
                    state.meetingSession!.audioVideo.chooseAudioInputDevice(voiceFocusTransformDevice);
                    voiceFocusDeviceTransformers[key] = voiceFocusDeviceTransformer;
                    voiceFocusTransformDevices[key] = voiceFocusTransformDevice;

                    setVoiceFocusDeviceTransformers(voiceFocusDeviceTransformers);
                    setVoiceFocusTransformDevices(voiceFocusTransformDevices);
                } else {
                    state.meetingSession!.audioVideo.chooseAudioInputDevice(inputMediaStream || deviceId);
                    throw "VoiceFocus is not supported";
                }
            }
        }
    };

    // const remoteIp = "localhost";
    // const remoteSpec = {
    //     paths: {
    //         worker: `http://${remoteIp}:8000/worker.js`,
    //         wasmPathPrefix: `http://${remoteIp}:8000/`,
    //     },
    //     model: {
    //         path: `http://${remoteIp}:8000/selfie_segmentation_landscape.tflite`,
    //         input: {
    //             height: 144,
    //             width: 256,
    //             range: [0, 1],
    //             channels: 3,
    //         },
    //         output: {
    //             height: 144,
    //             width: 256,
    //             range: [0, 1],
    //             channels: 1,
    //         },
    //     },
    // };

    const remoteIp = "localhost";
    const remoteSpecSame = {
        paths: {
            worker: `/tmp/worker.js`,
            wasmPathPrefix: `/tmp`,
        },
        model: {
            path: `/tmp/selfie_segmentation_landscape.tflite`,
            input: {
                height: 144,
                width: 256,
                range: [0, 1],
                channels: 3,
            },
            output: {
                height: 144,
                width: 256,
                range: [0, 1],
                channels: 1,
            },
        },
    };

    const setVideoInputCommon = async (enabled: boolean, deviceId: string | null, backgroundBlurLevel: BackgroundBlurLevel) => {
        if (!deviceId || enabled === false) {
            await state.meetingSession!.audioVideo.chooseVideoInputDevice(null).then(() => {
                state.meetingSession?.audioVideo.stopLocalVideoTile();
            });
        } else if (backgroundBlurLevel === BackgroundBlurLevel.NONE || false === (await BackgroundBlurVideoFrameProcessor.isSupported())) {
            // await state.meetingSession!.audioVideo.chooseVideoInputDevice(deviceId);

            let device = new DefaultVideoTransformDevice(state.meetingSession!.logger, deviceId, [createFrameCounterProcessor("none")]);
            ////// TBD: only chooseVideoInputDevice can not stop the processor???
            if (state.meetingStarted) {
                state.meetingSession?.audioVideo.stopLocalVideoTile();
                await state.meetingSession!.audioVideo.chooseVideoInputDevice(device);
                state.meetingSession?.audioVideo.startLocalVideoTile();
            } else {
                await state.meetingSession!.audioVideo.chooseVideoInputDevice(device);
            }
        } else {
            let processor;
            const key = backgroundBlurLevel.toString() || "unknown";
            if (videoFrameProcessors[key]) {
                processor = videoFrameProcessors[key];
            } else {
                // processor = await BackgroundBlurVideoFrameProcessor.create(remoteSpecSame, { blurStrength: backgroundBlurLevel as BlurStrength });
                processor = await BackgroundBlurVideoFrameProcessor.create(undefined, { blurStrength: backgroundBlurLevel} );
            }
            if (!processor) {
                await state.meetingSession!.audioVideo.chooseVideoInputDevice(deviceId);
                throw "NoOpVideoFrameProcessor is generated";
            } else {
                let device;
                if (videoTransformDevices[key]) {
                    device = videoTransformDevices[key];
                    device = device.chooseNewInnerDevice(deviceId);
                } else {
                    device = new DefaultVideoTransformDevice(state.meetingSession!.logger, deviceId, [
                        createFramePerfMonitor_start(),
                        processor,
                        createFramePerfMonitor_end(),
                        createFrameCounterProcessor(key),
                    ]);
                }
                ////// TBD: only chooseVideoInputDevice can not stop the processor???
                state.meetingSession?.audioVideo.stopLocalVideoTile();
                await state.meetingSession!.audioVideo.chooseVideoInputDevice(device);
                state.meetingSession?.audioVideo.startLocalVideoTile();
                videoFrameProcessors[key] = processor;
                videoTransformDevices[key] = device;
                setVideoFrameProcessors(videoFrameProcessors);
                setVideoTransformDevices(videoTransformDevices);
            }
        }
        // const quality = state.meetingSession?.audioVideo.getVideoInputQualitySettings();
        // console.log(quality);
        // state.meetingSession?.audioVideo.chooseVideoInputQuality(quality!.videoWidth, quality!.videoHeight, 30, quality!.videoMaxBandwidthKbps);
    };

    // const setVideoInputCommon_prev = async (deviceId: string | null, backgroundBlurLevel: BackgroundBlurLevel) => {
    //     if (backgroundBlurLevel === BackgroundBlurLevel.NONE) {
    //         await state.meetingSession!.audioVideo.chooseVideoInputDevice(deviceId);
    //     } else {
    //         let processor;
    //         const key = backgroundBlurLevel.toString() || "unknown";
    //         if (videoFrameProcessors[key]) {
    //             processor = videoFrameProcessors[key];
    //         } else {
    //             // processor = await BackgroundBlurVideoFrameProcessor.create(undefined, { blurStrength: backgroundBlurLevel as BlurStrength });
    //             processor = await BackgroundBlurVideoFrameProcessor.create(undefined, { blurStrength: 30});
    //         }
    //         if (!processor || processor instanceof NoOpVideoFrameProcessor) {
    //             await state.meetingSession!.audioVideo.chooseVideoInputDevice(deviceId);
    //             throw "NoOpVideoFrameProcessor is generated";
    //         } else {
    //             let device;
    //             if (videoTransformDevices[key]) {
    //                 device = videoTransformDevices[key];
    //                 device = device.chooseNewInnerDevice(deviceId);
    //             } else {
    //                 device = new DefaultVideoTransformDevice(state.meetingSession!.logger, deviceId, [processor]);
    //             }
    //             await state.meetingSession!.audioVideo.chooseVideoInputDevice(device);
    //             videoFrameProcessors[key] = processor;
    //             videoTransformDevices[key] = device;
    //             setVideoFrameProcessors(videoFrameProcessors);
    //             setVideoTransformDevices(videoTransformDevices);
    //         }
    //     }
    // };

    //// (1-2) I/O Device
    const setAudioInputDevice = async (deviceId: string | null) => {
        setAudioInputDeviceId(deviceId);
        await setAudioInputCommon(deviceId, noiseSuppressionLevel);
    };
    const setVideoInputDevice = async (deviceId: string | null) => {
        setVideoInputDeviceId(deviceId);
        await setVideoInputCommon(videoInputEnable, deviceId, backgroundBlurLevel);
    };
    const setAudioOutputDevice = async (deviceId: string | null) => {
        setAudioOutputDeviceId(deviceId);
        await state.meetingSession!.audioVideo.chooseAudioOutputDevice(deviceId);
    };
    const setAudioOutputElement = async (element: HTMLAudioElement) => {
        await state.meetingSession!.audioVideo.bindAudioElement(element);
        _audioOutputElement.current = element;
    };
    const setAudioInputEnable = async (enable: boolean) => {
        if (enable === false) {
            state.meetingSession!.audioVideo.realtimeMuteLocalAudio();
        } else {
            state.meetingSession!.audioVideo.realtimeUnmuteLocalAudio();
        }
        _setAudioInputEnable(enable);
    };
    const setVideoInputEnable = async (enable: boolean) => {
        if (enable === false) {
            state.meetingSession!.audioVideo.stopLocalVideoTile();
        } else {
            await setVideoInputCommon(enable, videoInputDeviceId, backgroundBlurLevel).then(() => {
                state.meetingSession!.audioVideo.startLocalVideoTile();
            });
        }
        _setVideoInputEnable(enable);
    };
    const setAudioOutputEnable = async (enable: boolean) => {
        if (enable === false) {
            if (_audioOutputElement.current) {
                _audioOutputElement.current.volume = 0;
            }
        } else {
            if (_audioOutputElement.current) {
                _audioOutputElement.current.volume = 1;
            }
        }
        _setAudioOutputEnable(enable);
    };

    const startLocalVideoTile = () => {
        state.meetingSession?.audioVideo.startLocalVideoTile();
    };
    const stopLocalVideoTile = () => {
        state.meetingSession?.audioVideo.stopLocalVideoTile();
    };

    const bindVideoElement = (tileId: number, videoElement: HTMLVideoElement) => {
        state.meetingSession!.audioVideo.bindVideoElement(tileId, videoElement);
    };

    //// (1-3) I/O Effector
    const setBackgroundBlurLevel = async (level: BackgroundBlurLevel) => {
        console.log("aaaaaaa", state);
        _setBackgroundBlurLevel(level);
        await setVideoInputCommon(videoInputEnable, videoInputDeviceId, level);
    };
    const setNoiseSuppressionLevel = async (level: NoiseSuppressionLevel) => {
        _setNoiseSuppressionLevel(level);
        await setAudioInputCommon(audioInputDeviceId, level);
    };

    //// (2) For Wait Room
    const setPreviewVideoElement = (element: HTMLVideoElement | null) => {
        setState({ ...state, previewCanvas: element });
    };
    const startPreviewVideoElement = () => {
        if (state.previewCanvas) {
            state.meetingSession!.audioVideo.startVideoPreviewForVideoInput(state.previewCanvas);
        }
    };
    const stopPreviewVideoElement = () => {
        if (state.previewCanvas) {
            state.meetingSession!.audioVideo.stopVideoPreviewForVideoInput(state.previewCanvas);
        }
    };

    /////////////////////////
    /// Utility           ///
    /////////////////////////
    const getContentTiles = () => {
        const videoTiles = state.meetingSession!.audioVideo.getAllVideoTiles();
        return Object.values(videoTiles).filter((x) => {
            return x.state().isContent;
        });
    };
    const getActiveSpeakerTiles = () => {
        const videoTiles = state.meetingSession!.audioVideo.getAllVideoTiles();
        return Object.values(videoTiles).filter((x) => {
            return x.state().boundAttendeeId === _activeSpeakerId.current;
        });
    };
    const getAllTiles = () => {
        const remoteVideoTiles = state.meetingSession!.audioVideo.getAllRemoteVideoTiles();
        const locaVideoTiles = state.meetingSession!.audioVideo.getLocalVideoTile();
        if (locaVideoTiles) {
            return [...remoteVideoTiles, locaVideoTiles];
        } else {
            return [...remoteVideoTiles];
        }
    };

    const getUserNameByAttendeeId = (attendeeId: string, cahce: boolean) => {
        return _attendeeList.current[attendeeId].name;
    };
    const hasLocalVideoStarted = () => {
        return state.meetingSession!.audioVideo.hasStartedLocalVideoTile();
    };

    return {
        // chimeClientUpdateTime,
        userName: state.userName,
        attendeeId: state.attendeeId,
        meetingName: state.meetingName,
        region: state.region,
        attendeeList: attendeeList,
        meetingStated: state.meetingStarted,
        // videoTileList: videoTileList.current,
        activeSpeakerId: activeSpeakerId,
        //////////////////////////////
        /// Meeting Operation    /////
        //////////////////////////////
        joinMeeting,
        enterMeeting,
        leaveMeeting,
        /////////////////////////
        /// Meeting Control   ///
        /////////////////////////
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
        startPreviewVideoElement,
        stopPreviewVideoElement,
        //// (3) For Wait Room
        setPreviewVideoElement,
        /////////////////////////
        /// Utility           ///
        /////////////////////////
        getContentTiles,
        getActiveSpeakerTiles,
        getAllTiles,
        getUserNameByAttendeeId,
        hasLocalVideoStarted,
        performance,
        performance2,
    };
};
