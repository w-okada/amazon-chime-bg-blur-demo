import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, InputLabel, MenuItem, Select, Typography } from "@material-ui/core";
import React, { useState } from "react";
import { useStyles } from "../../css";
import { DefaultDeviceController } from "amazon-chime-sdk-js";
import { useAppState } from "../../../../provider/AppStateProvider";
import { BackgroundBlurLevel, NoiseSuppressionLevel } from "../../../../provider/hooks/useChimeClient";
import { blurStrengthName } from "../../MeetingRoom";

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
        audioInputDeviceId,
        videoInputDeviceId,
        audioOutputDeviceId,
        setAudioInputDevice,
        setVideoInputDevice,
        setAudioOutputDevice,
        startLocalVideoTile,
        stopLocalVideoTile,

        noiseSuppressionLevel,
        backgroundBlurLevel,
        setNoiseSuppressionLevel,
        setBackgroundBlurLevel,
    } = useAppState();

    const onInputVideoChange = async (e: any) => {
        //// for input movie experiment [start]
        const videoElem = document.getElementById("for-input-movie")! as HTMLVideoElement;
        videoElem.pause();
        videoElem.srcObject = null;
        videoElem.src = "";
        //// for input movie experiment [end]

        if (e.target.value === "None") {
            await setVideoInputDevice(null);
            stopLocalVideoTile();
        } else if (e.target.value === "File") {
            // fileInputRef.current!.click()
        } else {
            await setVideoInputDevice(e.target.value);
            startLocalVideoTile();
        }
    };

    const onInputAudioChange = async (e: any) => {
        if (e.target.value === "None") {
            await setAudioInputDevice(null);
        } else {
            await setAudioInputDevice(e.target.value);
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

    const onBackgroundBlurLevelChange = async (e: any) => {
        setBackgroundBlurLevel(e.target.value);
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
                            <Select onChange={onInputVideoChange} value={videoInputDeviceId}>
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

                        <FormControl className={classes.formControl}>
                            <InputLabel>Microhpone</InputLabel>
                            <Select onChange={onInputAudioChange} value={audioInputDeviceId}>
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

                        <FormControl className={classes.formControl}>
                            <InputLabel>Speaker</InputLabel>
                            <Select onChange={onOutputAudioChange} value={audioOutputDeviceId}>
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
                            <InputLabel>Background Blur</InputLabel>
                            <Select onChange={onBackgroundBlurLevelChange} value={backgroundBlurLevel}>
                                <MenuItem disabled value="Video">
                                    <em>Background Blur</em>
                                </MenuItem>
                                {(() => {
                                    return Object.values(BackgroundBlurLevel).map((val) => {
                                        return (
                                            <MenuItem value={val} key={val}>
                                                {blurStrengthName[val]}
                                            </MenuItem>
                                        );
                                    });
                                })()}
                            </Select>
                        </FormControl>

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
