import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, InputLabel, MenuItem, Select, Typography } from "@material-ui/core";
import React, { useState } from "react";
import { useStyles } from "../../css";
import { DefaultDeviceController } from "amazon-chime-sdk-js";
import { useAppState } from "../../../../provider/AppStateProvider";
import { VirtualBackgroundType, NoiseSuppressionLevel } from "../../../../provider/hooks/useChimeClient";
import { CustomTextField } from "../../../000_common/CustomTextField";

type SettingDialogProps = {
    open: boolean;
    onClose: () => void;
};

export const SettingDialog = (props: SettingDialogProps) => {
    const classes = useStyles();
    const {
        audioInputList,
        videoInputList,
        audioOutputList,
        audioInputMedia,
        videoInputMedia,
        audioOutputDeviceId,
        setAudioInputMedia,
        setVideoInputMedia,
        setAudioOutputDevice,
        startLocalVideoTile,
        stopLocalVideoTile,

        noiseSuppressionLevel,
        virtualBackgroundType,
        setNoiseSuppressionLevel,
        setVirtualBackgroundType,
        getVirtualBackgroundType,
        setVirtualBackgroundImageURL,
        virtualBackgroundImageURL,
        refreshVideoInput,
    } = useAppState();

    const onInputVideoChange = async (e: any) => {
        //// for input movie experiment [start]
        const videoElem = document.getElementById("for-input-movie")! as HTMLVideoElement;
        videoElem.pause();
        videoElem.srcObject = null;
        videoElem.src = "";
        //// for input movie experiment [end]

        if (e.target.value === "None") {
            await setVideoInputMedia(null);
            stopLocalVideoTile();
        } else if (e.target.value === "File") {
            const input = document.createElement("input");
            input.type = "file";
            input.onchange = (e: any) => {
                const path = URL.createObjectURL(e.target.files[0]);
                const fileType = e.target.files[0].type;
                console.log(path, fileType);
                if (fileType.startsWith("video")) {
                    const videoElem = document.getElementById("for-input-movie")! as HTMLVideoElement;
                    videoElem.pause();
                    videoElem.srcObject = null;

                    videoElem.onloadeddata = async (e) => {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        const mediaStream = videoElem.captureStream() as MediaStream;

                        /////// Generate AudioInput Source
                        let stream: MediaStream | null = new MediaStream();
                        if (mediaStream.getAudioTracks().length > 0) {
                            mediaStream.getAudioTracks().forEach((t) => {
                                console.log("AUDIO TRACK", t);
                                stream!.addTrack(t);
                            });
                            console.log("AUDIO ", stream);
                            // audioInputDeviceSetting!.setAudioInput(mediaStream)
                        } else {
                            stream = null;
                            console.log("NO AUDIO TRACK");
                            // audioInputDeviceSetting!.setAudioInput(null)
                        }

                        const audioContext = DefaultDeviceController.getAudioContext();
                        const outputNode = audioContext.createMediaStreamDestination();
                        if (stream) {
                            const sourceNode = audioContext.createMediaStreamSource(stream);
                            sourceNode.connect(outputNode);
                        }

                        setAudioInputMedia(outputNode.stream);

                        /////// Generate VideoInput Source
                        if (mediaStream.getVideoTracks().length > 0) {
                            const stream = new MediaStream();
                            mediaStream.getVideoTracks().forEach((t) => {
                                stream.addTrack(t);
                            });
                            await setVideoInputMedia(mediaStream);
                            startLocalVideoTile();
                        } else {
                            await setVideoInputMedia(null);
                            stopLocalVideoTile();
                        }
                    };
                    videoElem.src = path;
                    videoElem.currentTime = 0;
                    videoElem.autoplay = true;
                    videoElem.play();
                }
            };
            input.click();
        } else {
            setVideoInputMedia(e.target.value);
            startLocalVideoTile();
        }
    };

    const onInputAudioChange = async (e: any) => {
        if (e.target.value === "None") {
            await setAudioInputMedia(null);
        } else {
            await setAudioInputMedia(e.target.value);
        }
    };

    const onOutputAudioChange = async (e: any) => {
        if (e.target.value === "None") {
            await setAudioOutputDevice(null);
        } else {
            await setAudioOutputDevice(e.target.value);
        }
    };

    const onNoiseSuppressionLevelChange = async (e: any) => {
        setNoiseSuppressionLevel(e.target.value);
    };

    const onVirtualBackgroundTypeChange = async (e: any) => {
        setVirtualBackgroundType(e.target.value);
    };

    const onApplyVirtualBackgroundImageClicked = () => {
        refreshVideoInput();
    };

    return (
        <div>
            <Dialog disableBackdropClick disableEscapeKeyDown scroll="paper" open={props.open} onClose={props.onClose}>
                <DialogTitle>
                    <Typography gutterBottom>Settings</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="h5" gutterBottom>
                        Devices
                    </Typography>
                    <form className={classes.form} noValidate>
                        <FormControl className={classes.formControl}>
                            <InputLabel>Camera</InputLabel>
                            <Select onChange={onInputVideoChange} value={videoInputMedia}>
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
                                <MenuItem value="File" key="File">
                                    File
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl className={classes.formControl}>
                            <InputLabel>Microhpone</InputLabel>
                            <Select onChange={onInputAudioChange} value={audioInputMedia}>
                                <MenuItem disabled value="Microphone">
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

                        <FormControl className={classes.formControl}>
                            <InputLabel>Speaker</InputLabel>
                            <Select onChange={onOutputAudioChange} value={audioOutputDeviceId}>
                                <MenuItem disabled value="Speaker">
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

                        <Typography variant="h5" gutterBottom>
                            Effect
                        </Typography>
                        <FormControl className={classes.formControl}>
                            <InputLabel>Noise Suppression</InputLabel>
                            <Select onChange={onNoiseSuppressionLevelChange} value={noiseSuppressionLevel}>
                                <MenuItem disabled value="Video">
                                    <em>Noise Suppression</em>
                                </MenuItem>
                                {(() => {
                                    return Object.values(NoiseSuppressionLevel).map((val) => {
                                        return (
                                            <MenuItem value={val} key={val}>
                                                {val}
                                            </MenuItem>
                                        );
                                    });
                                })()}
                            </Select>
                        </FormControl>

                        <FormControl className={classes.formControl}>
                            <InputLabel>Virtual Background Type</InputLabel>
                            <Select onChange={onVirtualBackgroundTypeChange} value={virtualBackgroundType}>
                                <MenuItem disabled value="Video">
                                    <em>Virtual Background Type</em>
                                </MenuItem>
                                {(() => {
                                    return Object.values(VirtualBackgroundType).map((val) => {
                                        return (
                                            <MenuItem value={val} key={val}>
                                                {getVirtualBackgroundType(val)}
                                            </MenuItem>
                                        );
                                    });
                                })()}
                            </Select>
                        </FormControl>

                        <CustomTextField
                            required
                            variant="outlined"
                            margin="normal"
                            fullWidth
                            id="background-image"
                            name="Background Image"
                            label="Background Image"
                            autoFocus
                            value={virtualBackgroundImageURL}
                            onChange={(e) => setVirtualBackgroundImageURL(e.target.value)}
                            // InputProps={{
                            //     className: classes.input,
                            // }}
                        />

                        <Button fullWidth variant="outlined" color="primary" onClick={onApplyVirtualBackgroundImageClicked}>
                            apply image
                        </Button>
                        <div className={classes.lineSpacer} />
                        <div className={classes.lineSpacer} />
                        <Divider />
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={props.onClose} color="primary">
                        Ok
                    </Button>
                </DialogActions>
            </Dialog>
            <video id="for-input-movie" loop hidden />
        </div>
    );
};
