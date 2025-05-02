export class CanvasFrame {
    image: ImageData | null;

    constructor(image: ImageData | null) {
        this.image = image;
    }

    putPixel(x: number, y: number, r: number, g: number, b: number, a: number) {
        const rx = Math.round(x);
        const ry = Math.round(y);
        if (
            !this.image
            || rx < 0
            || rx > this.image.width
            || ry < 0
            || ry > this.image.height
        ) {
            return;
        }

        const ind = ry * (this.image.width * 4) + rx * 4;
        this.image.data[ind] = r;
        this.image.data[ind + 1] = g;
        this.image.data[ind + 2] = b;
        this.image.data[ind + 3] = a;
    }

    drawLine(
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        r: number,
        g: number,
        b: number,
        a: number,
    ) {
        const steep = Math.abs(x0 - x1) < Math.abs(y0 - y1);
        let lx0 = steep ? y0 : x0;
        let ly0 = steep ? x0 : y0;
        let lx1 = steep ? y1 : x1;
        let ly1 = steep ? x1 : y1;

        if (lx0 > lx1) {
            let t = lx0;
            lx0 = lx1;
            lx1 = t;

            t = ly0;
            ly0 = ly1;
            ly1 = t;
        }

        const dx = lx1 - lx0;
        const dy = ly1 - ly0;
        const derror2 = Math.abs(dy) * 2;
        let error2 = 0;
        let y = ly0;
        for (let x = lx0; x <= lx1; x += 1) {
            this.putPixel(steep ? y : x, steep ? x : y, r, g, b, a);

            error2 += derror2;
            if (error2 > dx) {
                y += ly1 > ly0 ? 1 : -1;
                error2 -= dx * 2;
            }
        }
    }
}
