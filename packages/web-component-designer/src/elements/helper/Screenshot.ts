import { getBoundingClientRectAlsoForDisplayContents } from "./ElementHelper.js";

// for screenshots to be genrated properly, you need to select the current tab only in media source selector
export class Screenshot {
  private static _canvas: HTMLCanvasElement;
  private static _context: CanvasRenderingContext2D;
  private static _video: HTMLVideoElement;
  private static _captureStream: MediaStream;

  private static _disableStream() {
    Screenshot._captureStream.getTracks().forEach(track => track.stop());
    Screenshot._canvas = null;
  }

  static get screenshotsEnabled() {
    return Screenshot._captureStream && Screenshot._captureStream.active;
  }

  static async enableScreenshots(elementHostForVideo: Element = document.body) {
    if (Screenshot._captureStream && !Screenshot._captureStream.active) {
      Screenshot._disableStream();
    }
    if (Screenshot._canvas == null) {
      Screenshot._canvas = document.createElement("canvas");
      Screenshot._context = Screenshot._canvas.getContext("2d");
      Screenshot._video = document.createElement("video");
      const gdmOptions = {
        video: {
          cursor: "never",
          displaySurface: 'browser'
        },
        audio: false,
        selfBrowserSurface: "include",
        preferCurrentTab: true
      }
      Screenshot._video.style.display = "none";
      elementHostForVideo.appendChild(Screenshot._video);
      //@ts-ignore
      Screenshot._captureStream = await navigator.mediaDevices.getDisplayMedia(gdmOptions);
      //@ts-ignore
      const captureType = Screenshot._captureStream.getVideoTracks()[0].getSettings().displaySurface
      if (captureType != 'browser') {
        Screenshot._disableStream();
        alert('You need to share the current Tab, for the screenshot API to work');
        throw 'You need to share the current Tab, for the screenshot API to work';
      }
      Screenshot._video.srcObject = Screenshot._captureStream;
      Screenshot._video.play();
      await Screenshot._sleep(150);
    }
  }

  static async takeScreenshot(element: Element, width: number = 100, height: number = 100, elementHostForVideo: Element = document.body): Promise<string> {
    await Screenshot.enableScreenshots(elementHostForVideo);
    const rect = getBoundingClientRectAlsoForDisplayContents(element);
    Screenshot._canvas.width = width;
    Screenshot._canvas.height = height;
    Screenshot._context.drawImage(Screenshot._video, 0, 0, 1, 1, 0, 0, width, height);
    const factorX = Screenshot._video.videoWidth / window.innerWidth;
    const factorY = Screenshot._video.videoHeight / window.innerHeight;
    Screenshot._context.drawImage(Screenshot._video, rect.left * factorX, rect.top * factorY, rect.width * factorX, rect.height * factorY, 0, 0, width, height);
    const frame = Screenshot._canvas.toDataURL("image/png");
    return frame;
  }

  private static _sleep(timeout: number) {
    let resolve = null
    const promise = new Promise(r => resolve = r)
    window.setTimeout(resolve, timeout)
    return promise
  }
}