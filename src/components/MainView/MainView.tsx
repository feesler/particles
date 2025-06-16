import {
    DropDownSelectionParam,
    Offcanvas,
    useStore,
} from '@jezvejs/react';
import {
    useCallback,
    useEffect,
    useRef,
} from 'react';

import { changeZoom, pause, run } from 'src/store/actions.ts';
import { actions } from 'src/store/reducer.ts';

import {
    INITIAL_SCENE_MARGIN_RATIO,
} from 'src/constants.ts';
import { Field } from 'src/engine/Field/Field.ts';
import {
    AppState,
    Canvas,
    View,
} from 'src/types.ts';

import { useAppContext } from 'src/context/AppContextProvider.tsx';

import {
    DemoClass,
    DemoItemFunc,
    demosList,
    findDemoById,
    initialDemoItem,
} from 'src/demos/index.ts';

import { SceneCanvas } from '../SceneCanvas/SceneCanvas.tsx';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel.tsx';
import { Toolbar } from '../Toolbar/Toolbar.tsx';

import { defaultProps } from './initialState.ts';

export const MainView = () => {
    const { state, getState, dispatch } = useStore<AppState>();
    const context = useAppContext();
    const { fieldRef, getCanvas, processRotation } = context;

    const initDemo = (demo: DemoClass | DemoItemFunc, demoId: string) => {
        dispatch(actions.initDemo({
            props: (typeof demo === 'function') ? defaultProps : demo.getProps(),
            demo,
            demoId,
        }));
    };

    const setScaleStep = (scaleStep: number) => {
        dispatch(actions.setScaleStep(scaleStep));
    };

    const start = () => {
        const st = getState();
        const { demo } = st;

        const canvas = getCanvas() as Canvas;
        if (!fieldRef || !canvas) {
            return;
        }

        if (st.useField) {
            const fieldProps = {
                canvas,
                useWebGL: st.useWebGL,
                width: st.width,
                height: st.height,
                depth: st.depth,
                drawPath: st.drawPath,
                pathLength: st.pathLength,
                scaleFactor: st.initialScale,
                timeStep: st.timeStep,
            };

            fieldRef.current = new Field(fieldProps);
        }

        const view: View = {
            field: fieldRef.current,
            canvas,
            setScaleStep,
        };

        if (demo) {
            if (('init' in demo) && demo.init) {
                demo.init(view);
            } else if (typeof demo === 'function') {
                demo(view);
            }
        }

        if (st.useField) {
            fieldRef.current?.drawFrame();
        }

        if (st.useField && st.autoStart) {
            dispatch(run(context));
        }
    };

    const clearDemo = () => {
        const st = getState();
        if (st.demo && ('clear' in st.demo) && st.demo.clear) {
            st.demo.clear();
        }
    };

    const onChangeDemo = (selected: DropDownSelectionParam) => {
        if (Array.isArray(selected) || selected === null) {
            return;
        }

        const id = selected?.id;
        const demoItem = findDemoById(id);
        if (!demoItem) {
            return;
        }

        dispatch(pause());

        clearDemo();

        let demo;
        if (demoItem.type === 'canvas') {
            const DemoItemClass = demoItem.demo;
            if (!DemoItemClass) {
                return;
            }

            demo = new DemoItemClass();
        } else if (demoItem.type === 'field') {
            demo = demoItem.init;
        }
        if (!demo) {
            return;
        }

        dispatch(actions.resetDemo());

        fitToScreen();

        initDemo(demo, id);

        requestAnimationFrame(() => {
            start();
        });
    };

    const onToggleRun = () => {
        if (state.paused) {
            dispatch(run(context));
        } else {
            dispatch(pause());
        }
    };

    const onReset = () => {
        const st = getState();
        if (!st.demoId) {
            return;
        }

        const demoItem = findDemoById(st.demoId);
        if (!demoItem) {
            return;
        }

        onChangeDemo({
            id: demoItem.id,
            value: demoItem.title ?? '',
        });
    };

    const mainRef = useRef<HTMLElement | null>(null);

    /**
     * Changes zoom to fit the entire scene on the screen
     */
    const fitToScreen = () => {
        const st = getState();
        const canvasSize = Math.min(st.canvasWidth, st.canvasHeight);
        const sceneSize = Math.max(st.width, st.height, st.depth);

        const notResized = canvasSize === 0;
        dispatch(actions.requestFitToScreen(notResized));

        if (notResized) {
            return;
        }

        const sceneMargin = sceneSize * INITIAL_SCENE_MARGIN_RATIO;
        const newZoom = canvasSize / (sceneSize + sceneMargin);
        dispatch(changeZoom(newZoom, context));
    };

    const resizeHandler = () => {
        const st = getState();
        const rect = mainRef.current?.getBoundingClientRect() ?? null;
        if (!rect) {
            return;
        }

        const canvasWidth = rect.width;
        let canvasHeight = rect.height;
        if (
            canvasWidth === 0
            || canvasHeight === 0
            || (st.canvasWidth === canvasWidth && st.canvasHeight === canvasHeight)
        ) {
            return;
        }

        const pausedBefore = st.paused;
        dispatch(pause());

        if (canvasHeight > 0) {
            canvasHeight -= 1;
        }

        dispatch(actions.setCanvasSize({ canvasWidth, canvasHeight }));

        if (st.fitToScreenRequested) {
            fitToScreen();
        }

        setTimeout(() => {
            fieldRef?.current?.drawFrame();
        }, 10);

        processRotation(0, 0, 0);

        if (!pausedBefore) {
            dispatch(run(context));
        }
    };

    // ResizeObserver
    useEffect(() => {
        if (!mainRef.current) {
            return undefined;
        }

        const observer = new ResizeObserver(resizeHandler);
        observer.observe(mainRef.current);

        return () => {
            observer.disconnect();
        };
    }, [mainRef.current]);

    useEffect(() => {
        start();

        if (!initialDemoItem?.id) {
            return;
        }

        onChangeDemo({
            id: initialDemoItem.id,
            value: initialDemoItem.title ?? '',
        });
    }, []);

    const onClose = useCallback(() => {
        dispatch(actions.showOffcanvas(false));
    }, []);

    return (
        <div id="maincontainer" className="container">
            <main className="main-container" ref={mainRef}>
                <SceneCanvas />
            </main>

            <Toolbar onToggleRun={onToggleRun} onReset={onReset} onClose={onClose} />

            <Offcanvas
                className="settings"
                placement="right"
                closed={!state.settingsVisible}
                onClosed={onClose}
                usePortal={false}
            >
                <SettingsPanel
                    demosList={demosList}
                    onChangeDemo={onChangeDemo}
                    onClose={onClose}
                    onToggleRun={onToggleRun}
                />
            </Offcanvas>
        </div>
    );
};
