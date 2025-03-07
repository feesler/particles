import {
    Button,
    CloseButton,
    DropDown,
    DropDownSelectionParam,
    MenuItemProps,
    useStore,
} from '@jezvejs/react';

import { Field } from 'src/engine/Field.ts';
import { AppState } from 'src/types.ts';
import { RangeInput } from '../RangeInput/RangeInput.tsx';

import './SettingsPanel.css';

type Props = {
    fieldRef: Field | null;

    demosList: MenuItemProps[];

    onChangeDemo: (selected: DropDownSelectionParam) => void;
    onScale: (value: number) => void;
    onChangeTimeStep: (value: number) => void;
    onXRotate: (value: number) => void;
    onYRotate: (value: number) => void;
    onZRotate: (value: number) => void;
    onZoom: (value: number) => void;
    onChangeGScale: (value: number) => void;
    onChangeKScale: (value: number) => void;
    onToggleRun: () => void;
    onClose: () => void;
};

export const SettingsPanel = (props: Props) => {
    const {
        fieldRef,
        demosList,
        onChangeDemo,
        onScale,
        onChangeTimeStep,
        onXRotate,
        onYRotate,
        onZRotate,
        onZoom,
        onChangeGScale,
        onChangeKScale,
        onToggleRun,
        onClose,
    } = props;

    const { getState } = useStore<AppState>();
    const state = getState();

    return (
        <section className="data-section">
            <div className="data-section__header">
                <CloseButton onClick={onClose} />
            </div>

            <div className="date-value">
                <label>Demo</label>
                <DropDown id="demoSelect" className="fullwidth" items={demosList} onChange={onChangeDemo} />
            </div>

            <div className="date-value">
                <label>Scale factor</label>
                <RangeInput
                    id="scaleFactorInp"
                    min={0.001}
                    max={20}
                    step={0.01}
                    value={state.scaleFactor}
                    onChange={onScale}
                />
            </div>

            <div className="date-value">
                <label>Time step</label>
                <RangeInput
                    id="timeStepInp"
                    min={-5}
                    max={5}
                    step={0.001}
                    value={state.timeStep}
                    onChange={onChangeTimeStep}
                />
                <span id="timeStep">{(Math.pow(10, state.timeStep)).toFixed(5)}</span>
            </div>

            <div className="date-value">
                <label>Particles</label>
                <span id="particlescount">{fieldRef?.particles.length ?? 0}</span>
            </div>
            <div className="date-value">
                <label>Performance</label>
                <span id="perfvalue">{state.perfValue}</span>
            </div>

            <div className="date-value">
                <label>Rotate X</label>
                <RangeInput
                    id="xRotationInp"
                    min={-3}
                    max={3}
                    step={0.01}
                    value={state.rotation.alpha}
                    onChange={onXRotate}
                />
            </div>

            <div className="date-value">
                <label>Rotate Y</label>
                <RangeInput
                    id="yRotationInp"
                    min={-3}
                    max={3}
                    step={0.01}
                    value={state.rotation.beta}
                    onChange={onYRotate}
                />
            </div>

            <div className="date-value">
                <label>Rotate Z</label>
                <RangeInput
                    id="zRotationInp"
                    min={-3}
                    max={3}
                    step={0.01}
                    value={state.rotation.gamma}
                    onChange={onZRotate}
                />
            </div>

            <div className="date-value">
                <label>Zoom</label>
                <RangeInput
                    id="zoomInp"
                    min={0}
                    max={10}
                    step={0.0001}
                    value={state.zoom}
                    onChange={onZoom}
                />
            </div>

            <div className="date-value">
                <label>G</label>
                <RangeInput
                    id="gInp"
                    min={-10}
                    max={10}
                    step={1}
                    value={state.gScale}
                    onChange={onChangeGScale}
                />
                <span id="gScale">{(Math.pow(10, state.gScale)).toExponential(0)}</span>
            </div>

            <div className="date-value">
                <label>K</label>
                <RangeInput
                    id="kInp"
                    min={-10}
                    max={10}
                    step={1}
                    value={state.kScale}
                    onChange={onChangeKScale}
                />
                <span id="kScale">{(Math.pow(10, state.kScale)).toExponential(0)}</span>
            </div>

            <div className="data-footer">
                <Button id="toggleRunBtn" className="submit-btn" onClick={onToggleRun}>
                    {(state.paused) ? 'Run' : 'Pause'}
                </Button>
            </div>
        </section>
    );
};