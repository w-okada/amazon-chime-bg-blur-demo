import * as React from "react";
import { useMemo } from "react";
import { MessageDialog } from "./pages/000_common/MessageDialg";
import { Entrance } from "./pages/020_entrance";
import { WaitingRoom } from "./pages/022_waitingRoom/WaitingRoom";
import { MeetingRoom } from "./pages/023_meetingRoom/MeetingRoom";
import { AppStateProvider, useAppState } from "./provider/AppStateProvider";
const Router = () => {
    const { stage } = useAppState();

    const page = useMemo(() => {
        switch (stage) {
            case "ENTRANCE":
                return <Entrance />;
            case "WAITING_ROOM":
                return <WaitingRoom />;
            case "MEETING_ROOM":
                return <MeetingRoom />;
            default:
                return <div>no view</div>;
        }
    }, [stage]);
    return <div>{page}</div>;
};

const App = () => {
    return (
        <div>
            <AppStateProvider>
                <Router />
                <MessageDialog />
            </AppStateProvider>
        </div>
    );
};

export default App;
