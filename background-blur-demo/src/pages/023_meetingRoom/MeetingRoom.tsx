import { AppBar, Button, createTheme, CssBaseline, Drawer, Menu, MenuItem, ThemeProvider, Toolbar } from "@material-ui/core";
import React, { useEffect, useMemo } from "react";
import clsx from "clsx";
import { useState } from "react";
import { useAppState } from "../../provider/AppStateProvider";
import { DeviceEnabler } from "./components/appbars/DeviceEnabler";
import { DialogOpener } from "./components/appbars/DialogOpener";
import { DrawerOpener } from "./components/appbars/DrawerOpener";
import { ScreenType, SwitchButtons } from "./components/appbars/SwitchButtons";
import { Title } from "./components/appbars/Title";
import { bufferHeight, useStyles } from "./css";
import { FullScreenView } from "./components/ScreenView/FullScreenView";
import { SettingDialog } from "./components/dialog/SettingDialog";
import { LeaveMeetingDialog } from "./components/dialog/LeaveMeetingDialog";
import { CustomAccordion } from "./components/sidebars/CustomAccordion";
import { AttendeesTable } from "./components/sidebars/AttendeesTable";
import { CreditPanel } from "./components/sidebars/CreditPanel";
import { GridView } from "./components/ScreenView/GridView";
import { BackgroundBlurLevel, NoiseSuppressionLevel } from "../../provider/hooks/useChimeClient";
import { FeatureView } from "./components/ScreenView/FeatureView";
const toolbarHeight = 20;
const drawerWidth = 240;

export const blurStrengthName = {
    30: "HIGH",
    15: "MID",
    7: "LOW",
    0: "NONE",
}


const theme = createTheme({
    mixins: {
        toolbar: {
            minHeight: toolbarHeight,
        },
    },
});

export const MeetingRoom = () => {
    // console.log("meeting room !!!!!!");
    const classes = useStyles();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const {
        setMessage,
        userName,
        meetingName,
        meetingStated,
        setAudioInputDevice,
        setVideoInputDevice,
        setAudioOutputDevice,
        setAudioOutputElement,
        screenWidth,
        screenHeight,
        setAudioInputEnable,
        setVideoInputEnable,
        setAudioOutputEnable,
        audioInputEnable,
        videoInputEnable,
        audioOutputEnable,
        activeSpeakerId,
        getUserNameByAttendeeId,

        setBackgroundBlurLevel,
        backgroundBlurLevel,
        setNoiseSuppressionLevel,
        noiseSuppressionLevel,
        performance,
        performance2,
    } = useAppState();

    const [settingDialogOpen, setSettingDialogOpen] = useState(false);
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
    const [screenType, setScreenType] = useState<ScreenType>("FeatureView");
    // const [screenType, setScreenType] = useState<ScreenType>("GridView");

    const [backgroundBlurLevelAnchorEl, setBackgroundBlurLevelAnchorEl] = useState(null);
    const [noiseSuppressionLevelAnchorEl, setNoiseSuppressionLevelAnchorEl] = useState(null);

    const handleSelectBackgroundBlurLevelClick = async (val: BackgroundBlurLevel) => {
        setBackgroundBlurLevelAnchorEl(null);
        try {
            await setBackgroundBlurLevel(val);
        } catch (exception) {
            console.log(exception);
            setMessage("Exception", `${exception}`, ["failed to setBackgroundBlur"]);
        }
    };

    const handleOpenBackgroundBlurLevelClick = (event: any) => {
        setBackgroundBlurLevelAnchorEl(event.currentTarget);
    };

    const handleSelectNoiseSuppressionLevelClick = async (val: NoiseSuppressionLevel) => {
        setNoiseSuppressionLevelAnchorEl(null);
        try {
            await setNoiseSuppressionLevel(val);
        } catch (exception) {
            console.log(exception);
            setMessage("Exception", `${exception}`, ["failed to setNoiseSuppression"]);
        }
    };

    const handleOpenNoiseSuppressionLevelClick = (event: any) => {
        setNoiseSuppressionLevelAnchorEl(event.currentTarget);
    };

    const appBar = useMemo(() => {
        let speakerName = "no user";
        if (activeSpeakerId) {
            speakerName = getUserNameByAttendeeId(activeSpeakerId, false);
        }
        return (
            <AppBar position="absolute" className={clsx(classes.appBar)}>
                <Toolbar className={classes.toolbar}>
                    <div className={classes.toolbarInnnerBox}>
                        <DrawerOpener open={drawerOpen} setOpen={setDrawerOpen} />
                    </div>
                    <div className={classes.toolbarInnnerBox}>
                        <Title title={`${userName || ""}@${meetingName || ""}`} />
                    </div>
                    <div className={classes.toolbarInnnerBox}>
                        <div className={classes.toolbarInnnerBox}>
                            {speakerName} is speaking, PERF:Int{performance[0]}ms/{performance[1]}fps, P.Time:{performance2}ms
                        </div>
                        <span className={clsx(classes.menuSpacer)}> </span>
                        <span className={clsx(classes.menuSpacer)}> </span>

                        <div className={classes.toolbarInnnerBox}>
                            <DeviceEnabler type="Mic" enable={audioInputEnable} setEnable={setAudioInputEnable} />
                            <DeviceEnabler type="Camera" enable={videoInputEnable} setEnable={setVideoInputEnable} />
                            <DeviceEnabler type="Speaker" enable={audioOutputEnable} setEnable={setAudioOutputEnable} />
                            <DialogOpener type="Setting" onClick={() => setSettingDialogOpen(true)} />
                            <span className={clsx(classes.menuSpacer)}> </span>
                            {/* <FeatureEnabler
                                type="ShareScreen"
                                enable={chimeClient!.isShareContent}
                                setEnable={(val: boolean) => {
                                    enableShareScreen(val);
                                }}
                            /> */}
                        </div>
                        <div className={classes.toolbarInnnerBox}>
                            <span className={clsx(classes.menuSpacer)}> </span>
                        </div>

                        <div>
                            <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleOpenNoiseSuppressionLevelClick} className={classes.toolbarInnnerBox} style={{ color: "white" }}>
                                {`N.C.(${noiseSuppressionLevel}})`}
                            </Button>

                            <Menu id="simple-menu" anchorEl={noiseSuppressionLevelAnchorEl} keepMounted open={Boolean(noiseSuppressionLevelAnchorEl)}>
                                {(() => {
                                    return Object.values(NoiseSuppressionLevel).map((val) => {
                                        return (
                                            <MenuItem
                                                value={val}
                                                key={val}
                                                onClick={() => {
                                                    handleSelectNoiseSuppressionLevelClick(val);
                                                }}
                                            >
                                                {val}
                                            </MenuItem>
                                        );
                                    });
                                })()}
                            </Menu>
                        </div>

                        <div>
                            <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleOpenBackgroundBlurLevelClick} className={classes.toolbarInnnerBox} style={{ color: "white" }}>
                                {`Blur(${blurStrengthName[backgroundBlurLevel]})`}
                            </Button>

                            <Menu id="simple-menu" anchorEl={backgroundBlurLevelAnchorEl} keepMounted open={Boolean(backgroundBlurLevelAnchorEl)}>
                                {(() => {
                                    return Object.values(BackgroundBlurLevel).map((val) => {
                                        return (
                                            <MenuItem
                                                value={val}
                                                key={val}
                                                onClick={() => {
                                                    handleSelectBackgroundBlurLevelClick(val);
                                                }}
                                            >
                                                {blurStrengthName[val]}
                                            </MenuItem>
                                        );
                                    });
                                })()}
                            </Menu>
                        </div>

                        <div className={classes.toolbarInnnerBox}>
                            <span className={clsx(classes.menuSpacer)}> </span>
                        </div>

                        <div className={classes.toolbarInnnerBox}>
                            <SwitchButtons
                                type="ScreenView"
                                selected={screenType}
                                onClick={(val) => {
                                    setScreenType(val as ScreenType);
                                }}
                            />
                        </div>
                        <div className={classes.toolbarInnnerBox}>
                            <span className={clsx(classes.menuSpacer)}> </span>
                            <span className={clsx(classes.menuSpacer)}> </span>
                        </div>
                        <div className={classes.toolbarInnnerBox}>
                            <DialogOpener type="LeaveMeeting" onClick={() => setLeaveDialogOpen(true)} />
                        </div>
                    </div>
                </Toolbar>
            </AppBar>
        );
    }, [
        drawerOpen,
        audioInputEnable,
        videoInputEnable,
        audioOutputEnable,
        screenType,
        activeSpeakerId,
        noiseSuppressionLevelAnchorEl,
        backgroundBlurLevelAnchorEl,
        backgroundBlurLevel,
        noiseSuppressionLevel,
        setNoiseSuppressionLevel,
        setBackgroundBlurLevel,
        meetingStated,
        performance,
        performance2,
    ]);

    const mainView = useMemo(() => {
        switch (screenType) {
            case "FullView":
                return (
                    <FullScreenView
                        height={screenHeight - toolbarHeight - bufferHeight}
                        width={drawerOpen ? screenWidth - drawerWidth : screenWidth}
                        pictureInPicture={"None"}
                        focusTarget={"SharedContent"}
                    />
                );
            case "FeatureView":
                return (
                    <FeatureView
                        height={screenHeight - toolbarHeight - bufferHeight}
                        width={drawerOpen ? screenWidth - drawerWidth : screenWidth}
                        pictureInPicture={"None"}
                        focusTarget={"SharedContent"}
                    />
                );
            case "GridView":
                return <GridView height={screenHeight - toolbarHeight - bufferHeight} width={drawerOpen ? screenWidth - drawerWidth : screenWidth} excludeSharedContent={false} />;
            default:
                return <>Not found screen type:{screenType}</>;
        }
    }, [screenType, screenHeight, screenWidth]); // eslint-disable-line

    useEffect(() => {
        const audioElement = document.getElementById("for-speaker")! as HTMLAudioElement;
        setAudioOutputElement(audioElement);
    }, []); // eslint-disable-line

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={classes.root}>
                {appBar}
                <SettingDialog open={settingDialogOpen} onClose={() => setSettingDialogOpen(false)} />
                <LeaveMeetingDialog open={leaveDialogOpen} onClose={() => setLeaveDialogOpen(false)} />

                <div style={{ marginTop: toolbarHeight, position: "absolute", display: "flex" }}>
                    <Drawer
                        variant="permanent"
                        classes={{
                            paper: clsx(classes.drawerPaper, !drawerOpen && classes.drawerPaperClose),
                        }}
                        open={drawerOpen}
                    >
                        <CustomAccordion title="Member">
                            <AttendeesTable />
                        </CustomAccordion>

                        <CustomAccordion title="About">
                            <CreditPanel />
                        </CustomAccordion>
                    </Drawer>

                    <main style={{ height: `${screenHeight - toolbarHeight - bufferHeight}px` }}>{mainView}</main>
                </div>
            </div>
            {/* ************************************** */}
            {/* *****   Hidden Elements          ***** */}
            {/* ************************************** */}
            <div>
                <audio id="for-speaker" style={{ display: "none" }} />
            </div>
        </ThemeProvider>
    );
};
