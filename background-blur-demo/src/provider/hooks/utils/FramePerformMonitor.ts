import { CanvasVideoFrameBuffer, VideoFrameBuffer, VideoFrameProcessor } from "amazon-chime-sdk-js";
import { MutableRefObject } from "react";

export class FramePerfMonitor implements VideoFrameProcessor {
    data: MutableRefObject<number | undefined>;
    timestampNum = 30;
    timestampIndex = 0;
    frameNotifier = () => {};
    drawTimestamp = false;

    ////////////////////////////
    // constructor & destory ///
    ////////////////////////////
    constructor(data: MutableRefObject<number | undefined>, frameNotifier?: () => void) {
        console.log(`[VirtualBackground][constructor] initializing.`);
        if (frameNotifier) {
            this.frameNotifier = frameNotifier;
        }
        this.data = data;
    }

    async destroy() {
        return;
    }

    targetCanvas = document.createElement("canvas");
    canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.targetCanvas!);
    targetCanvasCtx = this.targetCanvas.getContext("2d")!;

    ////////////////
    // Processor  //
    ////////////////

    async process(buffers: VideoFrameBuffer[]) {
        this.data.current = performance.now();
        this.frameNotifier();
        return Promise.resolve(buffers);
    }
}
