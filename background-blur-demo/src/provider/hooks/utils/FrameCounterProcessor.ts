import { CanvasVideoFrameBuffer, VideoFrameBuffer, VideoFrameProcessor } from "amazon-chime-sdk-js";

export class FrameCounterProcessor implements VideoFrameProcessor {
    timestamps: number[] = [];
    timestampNum = 30;
    timestampIndex = 0;
    frameNotifier = (timestamps: number[]) => {};
    drawTimestamp = false;

    ////////////////////////////
    // constructor & destory ///
    ////////////////////////////
    constructor(frameNotifier?: (timestamps: number[]) => void, drawTimestamp?: boolean) {
        console.log(`[VirtualBackground][constructor] initializing.`);
        if (frameNotifier) {
            this.frameNotifier = frameNotifier;
        }
        if (drawTimestamp) {
            this.drawTimestamp = drawTimestamp;
        }
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
        this.timestampIndex += 1;
        this.timestampIndex = this.timestampIndex % this.timestampNum;
        if (this.timestampIndex === 0) {
            this.timestamps = [];
        }
        this.timestamps[this.timestampIndex] = performance.now();
        this.frameNotifier(this.timestamps);

        if (this.drawTimestamp) {
            if (buffers.length === 0) {
                return Promise.resolve(buffers);
            }

            // @ts-ignore
            const canvas = buffers[0].asCanvasElement();
            const frameWidth = canvas!.width;
            const frameHeight = canvas!.height;
            if (frameWidth === 0 || frameHeight === 0) {
                return Promise.resolve(buffers);
            }

            for (const f of buffers) {
                this.targetCanvas.width = canvas!.width;
                this.targetCanvas.height = canvas!.height;

                this.targetCanvasCtx.drawImage(canvas!, 0, 0, canvas!.width, canvas!.height);
                this.targetCanvasCtx.fillStyle = "#00ffff";

                this.targetCanvasCtx.fillText(`${canvas!.width}, ${canvas!.height}, ${performance.now()}`, 100, 100);
            }

            buffers[0] = this.canvasVideoFrameBuffer;
        }
        return Promise.resolve(buffers);
    }
}
