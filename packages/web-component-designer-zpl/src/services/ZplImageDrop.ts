import { DesignItem, IDesignerCanvas, IExternalDragDropService, InsertAction } from "@node-projects/web-component-designer";
import { ZplImage } from "../widgets/zpl-image.js";

export class ZplImageDrop implements IExternalDragDropService {

    public dragOver(event: DragEvent): 'none' | 'copy' | 'link' | 'move' {
        if (event.dataTransfer.items[0].type.startsWith('image/'))
            return 'copy';
        return 'none';
    }

    drop(designerView: IDesignerCanvas, event: DragEvent) {
        if (event.dataTransfer.files[0].type.startsWith('image/')) {
            let name = event.dataTransfer.files[0].name;
            let reader = new FileReader();
            reader.onloadend = () => {
                const img = document.createElement('img');
                img.src = <string>reader.result;
                img.onload = () => {
                    let zplImage = new ZplImage();
                    let zpl = this._convertImage(img, name);
                    const targetRect = (<HTMLElement>event.target).getBoundingClientRect();
                    let x = event.offsetX + targetRect.left - designerView.containerBoundingRect.x + 'px'
                    let y = event.offsetY + targetRect.top - designerView.containerBoundingRect.y + 'px';
                    zplImage.style.position = "absolute";
                    zplImage.style.left = x;
                    zplImage.style.top = y;
                    zplImage.setAttribute("total-bytes", zpl.totalBytes.toString());
                    zplImage.setAttribute("bytes-per-row", zpl.bytesPerRow.toString());
                    zplImage.setAttribute("image-name", zpl.name);
                    zplImage.setAttribute("hex-image", zpl.hexData);
                    zplImage.setAttribute("scale-x", "1");
                    zplImage.setAttribute("scale-y", "1");
                    const di = DesignItem.createDesignItemFromInstance(zplImage, designerView.serviceContainer, designerView.instanceServiceContainer);
                    let grp = di.openGroup("Insert of &lt;img&gt;");
                    designerView.instanceServiceContainer.undoService.execute(new InsertAction(designerView.rootDesignItem, designerView.rootDesignItem.childCount, di));
                    grp.commit();
                    requestAnimationFrame(() => designerView.instanceServiceContainer.selectionService.setSelectedElements([di]));

                }
            }
            reader.readAsDataURL(event.dataTransfer.files[0]);
        }
    }

    private _convertImage(img: any, name: string) {
        let black = 50;
        let rot = 'N';
        let notrim = true;

        // Get the image and convert to Z64
        let res;


        res = this._imageToACS(img, { black: black, rotate: rot, notrim: notrim });
        let imgName = name.split('.')[0].substring(0, 8);
        let bytesPerRow = res.rowlen;
        let totalBytes = res.length;

        return {
            name: imgName,
            totalBytes,
            bytesPerRow,
            hexData: res.acs
        }
    }

    private _imageToACS(img, opts) {
        // Draw the image to a temp canvas so we can access its RGBA data
        let cvs = document.createElement('canvas');
        let ctx = cvs.getContext('2d');

        cvs.width = +img.width || img.offsetWidth;
        cvs.height = +img.height || img.offsetHeight;
        ctx.imageSmoothingQuality = 'high'; // in case canvas needs to scale image
        ctx.drawImage(img, 0, 0, cvs.width, cvs.height);

        let pixels = ctx.getImageData(0, 0, cvs.width, cvs.height);
        return this._rgbaToACS(pixels.data, pixels.width, opts);
    }

    private _rgbaToACS(rgba, width, opts) {
        const hexmap = (() => {
            let arr = Array(256);
            for (let i = 0; i < 16; i++) {
                arr[i] = '0' + i.toString(16);
            }
            for (let i = 16; i < 256; i++) {
                arr[i] = i.toString(16);
            }
            return arr;
        })();


        opts = opts || {};
        width = width | 0;
        if (!width || width < 0) {
            throw new Error('Invalid width');
        }
        let height = ~~(rgba.length / width / 4);

        // Create a monochome image, cropped to remove padding.
        // The return is a Uint8Array with extra properties width and height.
        let mono = this._monochrome(rgba, width, height, +opts.black || 50, opts.notrim);

        let buf = this._normal(mono);

        // Encode in hex and apply the "Alternative Data Compression Scheme"
        //
        //      G   H   I   J   K   L   M   N   O   P   Q   R   S   T   U   V   W   X   Y
        //      1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19
        //
        //      g   h   i   j   k   l   m   n   o   p   q   r   s   t   u   v   w   x   y   z   
        //     20  40  60  80 100 120 140 160 180 200 220 240 260 280 300 320 340 360 380 400
        //
        let imgw = buf.width;
        let imgh = buf.height;
        let rowl = ~~((imgw + 7) / 8);

        let hex = '';
        for (let i = 0, l = buf.length; i < l; i++) {
            hex += hexmap[buf[i]];
        }
        let acs = '';
        let re = /([0-9a-fA-F])\1{2,}/g;
        let match = re.exec(hex);
        let offset = 0;
        while (match) {
            acs += hex.substring(offset, match.index);
            let l = match[0].length;
            while (l >= 400) {
                acs += 'z';
                l -= 400;
            }
            if (l >= 20) {
                acs += '_ghijklmnopqrstuvwxy'[((l / 20) | 0)];
                l = l % 20;
            }
            if (l) {
                acs += '_GHIJKLMNOPQRSTUVWXY'[l];
            }
            acs += match[1];
            offset = re.lastIndex;
            match = re.exec(hex);
        }
        acs += hex.substr(offset);

        // Example usage of the return value `rv`:
        //		'^GFA,' + rv.length + ',' + rv.length + ',' + rv.rowlen + ',' + rv.acs
        return {
            length: buf.length,	// uncompressed number of bytes
            rowlen: rowl,		// number of packed bytes per row
            width: imgw,		// rotated image width in pixels
            height: imgh,		// rotated image height in pixels
            acs: acs,
        };
    }

    private _monochrome(rgba, width, height, black, notrim) {
        // Convert black from percent to 0..255 value
        black = 255 * black / 100;

        let minx, maxx, miny, maxy;
        if (notrim) {
            minx = miny = 0;
            maxx = width - 1;
            maxy = height - 1;
        } else {
            // Run through the image and determine bounding box
            maxx = maxy = 0;
            minx = width;
            miny = height;
            let x = 0, y = 0;
            for (let i = 0, n = width * height * 4; i < n; i += 4) {
                // Alpha blend with white.
                let a = rgba[i + 3] / 255;
                let r = rgba[i] * .3 * a + 255 * (1 - a);
                let g = rgba[i + 1] * .59 * a + 255 * (1 - a);
                let b = rgba[i + 2] * .11 * a + 255 * (1 - a);
                let gray = r + g + b;

                if (gray <= black) {
                    if (minx > x) minx = x;
                    if (miny > y) miny = y;
                    if (maxx < x) maxx = x;
                    if (maxy < y) maxy = y;
                }
                if (++x == width) {
                    x = 0;
                    y++;
                }
            }
        }

        // One more time through the data, this time we create the cropped image.
        let cx = maxx - minx + 1;
        let cy = maxy - miny + 1;
        let buf: Uint8Array & { width?: number, height?: number } = new Uint8Array(cx * cy);
        let idx = 0;
        for (let y = miny; y <= maxy; y++) {
            let i = (y * width + minx) * 4;
            for (let x = minx; x <= maxx; x++) {
                // Alpha blend with white.
                let a = rgba[i + 3] / 255;
                let r = rgba[i] * .3 * a + 255 * (1 - a);
                let g = rgba[i + 1] * .59 * a + 255 * (1 - a);
                let b = rgba[i + 2] * .11 * a + 255 * (1 - a);
                let gray = r + g + b;

                buf[idx++] = gray <= black ? 1 : 0;
                i += 4;
            }
        }

        // Return the monochrome image
        buf.width = cx;
        buf.height = cy;
        return buf;
    }

    private _normal(mono) {
        let width = mono.width;
        let height = mono.height;

        let buf: Uint8Array & { width?: number, height?: number } = new Uint8Array(~~((width + 7) / 8) * height);
        let idx = 0;	// index into buf
        let byte = 0;	// current byte of image data
        let bitx = 0;	// bit index
        for (let i = 0, n = mono.length; i < n; i++) {
            byte |= mono[i] << (7 - (bitx++ & 7));

            if (bitx == width || !(bitx & 7)) {
                buf[idx++] = byte;
                byte = 0;
                if (bitx == width) {
                    bitx = 0;
                }
            }
        }
        buf.width = width;
        buf.height = height;
        return buf;
    }
}