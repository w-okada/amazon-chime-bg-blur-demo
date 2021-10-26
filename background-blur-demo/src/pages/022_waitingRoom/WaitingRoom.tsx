import { Avatar, Box, Button, CircularProgress, Container, CssBaseline, FormControl, Grid, InputLabel, Link, MenuItem, Select, Typography } from "@material-ui/core";
import React, { useEffect, useMemo, useState } from "react";
import { MeetingRoom } from "@material-ui/icons";
import { Copyright } from "../000_common/Copyright";
import { useStyles } from "../000_common/Style";
import { useAppState } from "../../provider/AppStateProvider";
import { DeviceInfo } from "../../provider/hooks/useDeviceState";

export const WaitingRoom = () => {
    const classes = useStyles();
    const {
        userName,
        meetingName,
        region,
        setStage,
        setMessage,

        enterMeeting,

        audioInputList,
        videoInputList,
        audioOutputList,
        reloadDevices,

        //// (1) I/O Device
        setAudioInputDevice,
        setVideoInputDevice,
        setAudioOutputDevice,
        //// (2) I/O Effector
        setBackgroundBlurLevel,
        //// (3) For Wait Room
        setPreviewVideoElement,
        startPreviewVideoElement,
        stopPreviewVideoElement,
    } = useAppState();
    const [isLoading, setIsLoading] = useState(false);

    //// Default Device ID
    const defaultDeiceId = (deviceList: DeviceInfo[] | null) => {
        // if (!deviceList) {
        //     return "None";
        // }
        // const defaultDevice = deviceList.find((dev) => {
        //     return dev.deviceId !== "default";
        // });
        // return defaultDevice ? defaultDevice.deviceId : "None";
        return "None";
    };

    const defaultAudioInputDevice = defaultDeiceId(audioInputList);
    const defaultVideoInputDevice = defaultDeiceId(videoInputList);
    const defaultAudioOutputDevice = defaultDeiceId(audioOutputList);
    const [audioInputDeviceId, setAudioInputDeviceId] = useState(defaultAudioInputDevice);
    const [videoInputDeviceId, setVideoInputDeviceId] = useState(defaultVideoInputDevice);
    const [audioOutputDeviceId, setAudioOutputDeviceId] = useState(defaultAudioOutputDevice);

    const onReloadDeviceClicked = () => {
        reloadDevices();
    };

    const onEnterClicked = async () => {
        setIsLoading(true);
        try {
            stopPreviewVideoElement();

            await enterMeeting();
            setIsLoading(false);
            setStage("MEETING_ROOM");
        } catch (e: any) {
            setMessage("Exception", "Enter Meeting Failed", [`${e}`]);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const videoEl = document.getElementById("camera-preview") as HTMLVideoElement;
        setPreviewVideoElement(videoEl);
        return () => {
            //            setPreviewVideoElement(null);
        };
    }, []); // eslint-disable-line

    useEffect(() => {
        if (videoInputDeviceId === "None") {
            setVideoInputDevice(null).then(() => {
                stopPreviewVideoElement();
            });
        } else if (videoInputDeviceId === "File") {
            // fileInputRef.current!.click()
        } else {
            setVideoInputDevice(videoInputDeviceId).then(() => {
                startPreviewVideoElement();
                // //// for just in case
                // setTimeout(() => {
                //     setVideoInputDevice(videoInputDeviceId).then(() => {
                //         console.log("start Preview1");
                //         startPreviewVideoElement();
                //         console.log("start Preview2");
                //     });
                // }, 1000 * 5);
            });
        }
    }, [videoInputDeviceId]); // eslint-disable-line

    useEffect(() => {
        if (audioInputDeviceId === "None") {
            setAudioInputDevice(null);
        } else {
            setAudioInputDevice(audioInputDeviceId);
        }
    }, [audioInputDeviceId]); // eslint-disable-line

    useEffect(() => {
        if (audioOutputDeviceId === "None") {
            setAudioOutputDevice(null);
        } else {
            setAudioOutputDevice(audioOutputDeviceId);
        }
    }, [audioOutputDeviceId]); // eslint-disable-line

    const videoPreview = useMemo(() => {
        return <video id="camera-preview" className={classes.cameraPreview} />;
    }, []); // eslint-disable-line
    return (
        <Container maxWidth="xs" className={classes.root}>
            <CssBaseline />
            <div className={classes.paper}>
                <Avatar className={classes.avatar}>
                    <MeetingRoom />
                </Avatar>

                <Typography variant="h4" className={classes.title}>
                    Waiting Meeting
                </Typography>
                <Typography variant="body1" className={classes.title}>
                    You will join room <br />
                    (user:{userName}, room:{meetingName}@{region}) <br />
                    Setup your devices.
                </Typography>

                <form className={classes.form} noValidate>
                    <Button fullWidth variant="outlined" color="primary" onClick={onReloadDeviceClicked}>
                        reload device list
                    </Button>

                    <FormControl className={classes.formControl}>
                        <InputLabel>Camera</InputLabel>
                        <Select
                            onChange={(e) => {
                                setVideoInputDeviceId(e.target.value! as string);
                            }}
                            defaultValue={videoInputDeviceId}
                        >
                            <MenuItem disabled value="Video">
                                <em>Video</em>
                            </MenuItem>
                            {videoInputList?.map((dev) => {
                                return (
                                    <MenuItem value={dev.deviceId} key={dev.deviceId}>
                                        {dev.label}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                    <Typography>Preview.(virtual bg is not applied here yet.)</Typography>
                    {videoPreview}

                    <br />

                    <FormControl className={classes.formControl}>
                        <InputLabel>Microhpone</InputLabel>
                        <Select
                            onChange={(e) => {
                                setAudioInputDeviceId(e.target.value! as string);
                            }}
                            defaultValue={audioInputDeviceId}
                        >
                            <MenuItem disabled value="Video">
                                <em>Microphone</em>
                            </MenuItem>
                            {audioInputList?.map((dev) => {
                                return (
                                    <MenuItem value={dev.deviceId} key={dev.deviceId}>
                                        {dev.label}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>

                    <br />
                    <FormControl className={classes.formControl}>
                        <InputLabel>Speaker</InputLabel>
                        <Select
                            onChange={(e) => {
                                setAudioOutputDeviceId(e.target.value! as string);
                            }}
                            defaultValue={audioOutputDeviceId}
                        >
                            <MenuItem disabled value="Video">
                                <em>Speaker</em>
                            </MenuItem>
                            {audioOutputList?.map((dev) => {
                                return (
                                    <MenuItem value={dev.deviceId} key={dev.deviceId}>
                                        {dev.label}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>
                    <Grid container direction="column" alignItems="center">
                        {isLoading ? (
                            <CircularProgress />
                        ) : (
                            <Button fullWidth variant="contained" color="primary" className={classes.submit} onClick={onEnterClicked} id="submit">
                                Enter
                            </Button>
                        )}
                    </Grid>
                    <Grid container direction="column">
                        <Grid item xs>
                            <Link
                                onClick={(e: any) => {
                                    setStage("ENTRANCE");
                                }}
                            >
                                Go Back
                            </Link>
                        </Grid>
                    </Grid>
                    <Box mt={8}>
                        <Copyright />
                    </Box>
                </form>
            </div>
        </Container>
    );
};
