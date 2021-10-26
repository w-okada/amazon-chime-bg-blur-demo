import { useState } from "react";

type UseStageManagerProps = {
    initialStage?: STAGE | null;
};

export type STAGE = "ENTRANCE" | "WAITING_ROOM" | "MEETING_ROOM";

export const useStageManager = (props: UseStageManagerProps) => {
    const [stage, setStage] = useState<STAGE>(props.initialStage || "ENTRANCE");
    return { stage, setStage };
};
