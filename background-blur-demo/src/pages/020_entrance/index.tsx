import { Avatar, Box, Button, CircularProgress, Container, CssBaseline, FormControl, Grid, InputLabel, Link, MenuItem, Select, Typography } from "@material-ui/core";
import React, { useState } from "react";
import { Copyright } from "../000_common/Copyright";
import { MeetingRoom } from "@material-ui/icons";
import { useStyles } from "../000_common/Style";
import { CustomTextField } from "../000_common/CustomTextField";
import { useAppState } from "../../provider/AppStateProvider";
import { AVAILABLE_AWS_REGIONS, DEFAULT_REGION } from "../../constants";

export const Entrance = () => {
    const { setMessage, setStage, joinMeeting } = useAppState();
    const [isLoading, setIsLoading] = useState(false);
    const [meetingName, setMeetingName] = useState("");
    const [userName, setUserName] = useState("");
    const [region, setRegion] = useState(DEFAULT_REGION);

    const classes = useStyles();

    const onJoinMeetingClicked = async () => {
        setIsLoading(true);
        try {
            const res = await joinMeeting(meetingName, userName, region);
            setIsLoading(false);
            setStage("WAITING_ROOM");
        } catch (exception: any) {
            setMessage("Exception", "Join Meeting Failed", [`${exception}`]);
            setIsLoading(false);
        }
    };

    return (
        <Container maxWidth="xs" className={classes.root}>
            <CssBaseline />
            <div className={classes.paper}>
                <Avatar className={classes.avatar}>
                    <MeetingRoom />
                </Avatar>

                <Typography variant="h4" className={classes.title}>
                    Join Meeting
                </Typography>
                <form className={classes.form} noValidate>
                    <CustomTextField
                        required
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        id="MeetingName"
                        name="MeetingName"
                        label="MeetingName"
                        autoFocus
                        value={meetingName}
                        onChange={(e) => setMeetingName(e.target.value)}
                        InputProps={{
                            className: classes.input,
                        }}
                    />

                    <CustomTextField
                        required
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        id="UserName"
                        name="UserName"
                        label="UserName"
                        onChange={(e) => setUserName(e.target.value)}
                        InputProps={{
                            className: classes.input,
                        }}
                    />

                    <FormControl className={classes.formControl}>
                        <InputLabel>Region</InputLabel>
                        <Select value={region} onChange={(e: any) => setRegion(e.target.value)}>
                            <MenuItem disabled value="Video">
                                <em>Region</em>
                            </MenuItem>
                            {Object.keys(AVAILABLE_AWS_REGIONS).map((key) => {
                                return (
                                    <MenuItem value={key} key={key}>
                                        {AVAILABLE_AWS_REGIONS[key]}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>

                    <Grid container direction="column" alignItems="center">
                        {isLoading ? (
                            <CircularProgress />
                        ) : (
                            <Button fullWidth variant="contained" color="primary" className={classes.submit} onClick={onJoinMeetingClicked} id="submit">
                                Join Meeting
                            </Button>
                        )}
                    </Grid>

                    <Box mt={8}>
                        <Copyright />
                    </Box>
                </form>
            </div>
        </Container>
    );
};
