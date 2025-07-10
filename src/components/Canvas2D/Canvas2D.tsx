import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';

import { CanvasFrame } from 'shared/utils/CanvasFrame/CanvasFrame.ts';
import { RGBColor } from 'particles/types.ts';

export type Canvas2DElement = {
    elem: HTMLCanvasElement | null;
    createFrame: () => CanvasFrame | null;
    drawFrame: (frame: CanvasFrame) => void;
    clear: () => void;
    drawCircle: (x: number, y: number, radius: number, color: RGBColor) => void;
};

export type Canvas2DRef = Canvas2DElement | null;

export type CanvasProps = React.CanvasHTMLAttributes<HTMLCanvasElement>;

export const Canvas2D = forwardRef<
    Canvas2DRef,
    CanvasProps
>((props, ref) => {
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    const createFrame = (): CanvasFrame | null => {
        if (!contextRef.current || !props.width || !props.height) {
            return null;
        }

        const image = contextRef.current.createImageData(Number(props.width), Number(props.height));
        return new CanvasFrame(image);
    };

    const drawFrame = (frame: CanvasFrame) => {
        if (!contextRef.current || !frame?.image) {
            return;
        }

        contextRef.current.putImageData(frame.image, 0, 0);
    };

    const clear = () => {
        if (!contextRef.current || !props.width || !props.height) {
            return;
        }

        contextRef.current.clearRect(0, 0, Number(props.width), Number(props.height));
    };

    const drawCircle = (x: number, y: number, radius: number, color: RGBColor) => {
        if (!contextRef.current) {
            return;
        }

        const circleStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        contextRef.current.fillStyle = circleStyle;
        contextRef.current.strokeStyle = circleStyle;

        contextRef.current.beginPath();
        contextRef.current.arc(x, y, radius, 0, Math.PI * 2);
        contextRef.current.stroke();
    };

    const innerRef = useRef<HTMLCanvasElement | null>(null);
    useImperativeHandle<
        Canvas2DElement,
        Canvas2DElement
    >(ref, () => ({
        elem: innerRef.current,
        createFrame,
        drawFrame,
        clear,
        drawCircle,
    }));

    useEffect(() => {
        if (!innerRef.current) {
            return;
        }

        contextRef.current = innerRef.current.getContext('2d');
    }, []);

    return (
        <canvas {...props} ref={innerRef} />
    );
});

Canvas2D.displayName = 'Canvas2D';
