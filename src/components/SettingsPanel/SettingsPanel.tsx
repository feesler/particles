import {
    DropDownSelectionParam,
    MenuItemProps,
    useStore,
} from '@jezvejs/react';

import { MAX_ZOOM, MIN_ZOOM } from '../../constants.ts';

import { RangeInputField } from '../RangeInputField/RangeInputField.tsx';
import { ReadOnlyField } from '../ReadOnlyField/ReadOnlyField.tsx';
import { SelectField } from '../SelectField/SelectField.tsx';

import { Field } from 'src/engine/Field.ts';
import { AppState } from 'src/types.ts';

import './SettingsPanel.css';

type Props = {
    fieldRef: Field | null;

    demosList: MenuItemProps[];

    onChangeDemo: (selected: DropDownSelectionParam) => void;
    onScale: (value: number) => void;
    onChangeScaleStep: (value: number) => void;
    onChangeTimeStep: (value: number) => void;
    onXRotate: (value: number) => void;
    onYRotate: (value: number) => void;
    onZRotate: (value: number) => void;
    onChangeXRotationStep: (value: number) => void;
    onChangeYRotationStep: (value: number) => void;
    onChangeZRotationStep: (value: number) => void;
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
        onChangeScaleStep,
        onChangeTimeStep,
        onXRotate,
        onYRotate,
        onZRotate,
        onChangeXRotationStep,
        onChangeYRotationStep,
        onChangeZRotationStep,
        onZoom,
        onChangeGScale,
        onChangeKScale,
    } = props;

    const { getState } = useStore<AppState>();
    const state = getState();

    return (
        <section className="data-section">
            <SelectField
                id="demoSelect"
                title="Demo"
                items={demosList}
                onChange={onChangeDemo}
            />

            <RangeInputField
                id="scaleFactorInp"
                title="Scale factor"
                min={0.001}
                max={20}
                step={0.01}
                value={state.scaleFactor}
                onChange={onScale}
            />

            <RangeInputField
                id="scaleStepInp"
                title="Scale step"
                min={-1}
                max={1}
                step={0.00001}
                value={state.scaleStep}
                additional={state.scaleStep.toFixed(5)}
                onChange={onChangeScaleStep}
            />

            <RangeInputField
                id="timeStepInp"
                title="Time step"
                min={-5}
                max={5}
                step={0.00001}
                value={state.timeStep}
                additional={Math.pow(10, state.timeStep).toFixed(5)}
                onChange={onChangeTimeStep}
            />

            <ReadOnlyField
                id="particlescount"
                title="Particles"
                value={fieldRef?.particles.length ?? 0}
            />
            <ReadOnlyField
                id="perfvalue"
                title="Performance"
                value={state.perfValue}
            />

            <RangeInputField
                id="xRotationInp"
                title="Rotate X"
                min={-3}
                max={3}
                step={0.01}
                value={state.rotation.alpha}
                onChange={onXRotate}
            />

            <RangeInputField
                id="yRotationInp"
                title="Rotate Y"
                min={-3}
                max={3}
                step={0.01}
                value={state.rotation.beta}
                onChange={onYRotate}
            />

            <RangeInputField
                id="zRotationInp"
                title="Rotate Z"
                min={-3}
                max={3}
                step={0.01}
                value={state.rotation.gamma}
                onChange={onZRotate}
            />

            <RangeInputField
                id="xRotationStepInp"
                title="Rotate X step"
                min={-1}
                max={1}
                step={0.00001}
                value={state.rotationStep.alpha}
                onChange={onChangeXRotationStep}
            />

            <RangeInputField
                id="yRotationStepInp"
                title="Rotate Y step"
                min={-1}
                max={1}
                step={0.00001}
                value={state.rotationStep.beta}
                onChange={onChangeYRotationStep}
            />

            <RangeInputField
                id="zRotationStepInp"
                title="Rotate Z step"
                min={-1}
                max={1}
                step={0.00001}
                value={state.rotationStep.gamma}
                onChange={onChangeZRotationStep}
            />

            <RangeInputField
                id="zoomInp"
                title="Zoom"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.0001}
                value={state.zoom}
                onChange={onZoom}
            />

            <RangeInputField
                id="gInp"
                title="G"
                min={-10}
                max={10}
                step={1}
                value={state.gScale}
                additional={Math.pow(10, state.gScale).toExponential(0)}
                onChange={onChangeGScale}
            />

            <RangeInputField
                id="kInp"
                title="K"
                min={-10}
                max={10}
                step={1}
                value={state.kScale}
                additional={Math.pow(10, state.kScale).toExponential(0)}
                onChange={onChangeKScale}
            />

            <div className="data-footer">
            </div>
        </section>
    );
};