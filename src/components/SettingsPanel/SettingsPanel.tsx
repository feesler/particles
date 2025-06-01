import {
    DropDownSelectionParam,
    MenuItemProps,
    useStore,
} from '@jezvejs/react';
import { useCallback, useMemo } from 'react';

import {
    changeDrawPath,
    changeDrawPathLength,
    changeGScale,
    changeKScale,
    changeZoom,
    MainViewActionsAPI,
    rotateAroundXAxis,
    rotateAroundYAxis,
    rotateAroundZAxis,
} from 'src/store/actions.ts';
import { actions } from 'src/store/reducer.ts';

import { Field } from 'src/engine/Field/Field.ts';
import { AppState } from 'src/types.ts';
import {
    MAX_ZOOM,
    MIN_ZOOM,
    ROTATION_FIELD_MAX_VALUE,
    ROTATION_FIELD_MIN_VALUE,
    ROTATION_FIELD_VALUE_STEP,
} from '../../constants.ts';

import { RangeInputField } from '../RangeInputField/RangeInputField.tsx';
import { ReadOnlyField } from '../ReadOnlyField/ReadOnlyField.tsx';
import { SelectField } from '../SelectField/SelectField.tsx';

import { DrawPathCollapsible } from './components/DrawPathCollapsible/DrawPathCollapsible.tsx';
import { RangeInputFieldsList } from './components/RangeInputFieldsList/RangeInputFieldsList.tsx';
import { SettingsPanelCollapsible } from './components/SettingsPanelCollapsible/SettingsPanelCollapsible.tsx';

import './SettingsPanel.css';

type Props = {
    fieldRef: Field | null;

    demosList: MenuItemProps[];

    viewAPI: MainViewActionsAPI;

    onChangeDemo: (selected: DropDownSelectionParam) => void;
    onToggleRun: () => void;
    onClose: () => void;
};

const rotationFieldsCommon = {
    min: ROTATION_FIELD_MIN_VALUE,
    max: ROTATION_FIELD_MAX_VALUE,
    step: ROTATION_FIELD_VALUE_STEP,
};

const rotationStepFieldsCommon = {
    min: -1,
    max: 1,
    step: 0.00001,
};

export const SettingsPanel = (props: Props) => {
    const {
        fieldRef,
        demosList,
        onChangeDemo,
        viewAPI,
    } = props;

    const { getState, dispatch } = useStore<AppState>();
    const state = getState();

    // Scale
    const onScale = useCallback((value: number) => {
        dispatch(actions.setScaleFactor(value));
    }, []);

    // Scale step
    const onChangeScaleStep = useCallback((scaleStep: number) => {
        dispatch(actions.setScaleStep(scaleStep));
    }, []);

    // Time step
    const onChangeTimeStep = useCallback((value: number) => {
        dispatch(actions.setTimeStep(value));
    }, []);

    // Scene zoom
    const onZoom = useCallback((value: number) => {
        dispatch(changeZoom(value, viewAPI));
    }, []);

    // Draw path
    const onChangeDrawPath = useCallback((value: boolean) => {
        dispatch(changeDrawPath(value, viewAPI));
    }, []);

    // Draw path length
    const onChangePathLength = useCallback((value: number) => {
        dispatch(changeDrawPathLength(value, viewAPI));
    }, []);

    // Scene rotation collapsible block
    const onToggleRotationCollapsible = useCallback(() => {
        dispatch(actions.toggleRotationCollapsible());
    }, []);

    // Scene rotation step collapsible block
    const onToggleRotationStepCollapsible = useCallback(() => {
        dispatch(actions.toggleRotationStepCollapsible());
    }, []);

    // 'Draw paths' option collapsible block
    const onToggleDrawPathCollapsible = useCallback(() => {
        dispatch(actions.toggleDragPathCollapsible());
    }, []);

    // Rotation
    const onXRotate = useCallback((value: number) => {
        dispatch(rotateAroundXAxis(value, viewAPI));
    }, []);

    const onYRotate = useCallback((value: number) => {
        dispatch(rotateAroundYAxis(value, viewAPI));
    }, []);

    const onZRotate = useCallback((value: number) => {
        dispatch(rotateAroundZAxis(value, viewAPI));
    }, []);

    const rotationRangeInputFields = useMemo(() => ([{
        ...rotationFieldsCommon,
        id: 'xRotationInp',
        title: 'Rotate X',
        value: state.rotation.alpha,
        onChange: onXRotate,
    }, {
        ...rotationFieldsCommon,
        id: 'yRotationInp',
        title: 'Rotate Y',
        value: state.rotation.beta,
        onChange: onYRotate,
    }, {
        ...rotationFieldsCommon,
        id: 'zRotationInp',
        title: 'Rotate Z',
        value: state.rotation.gamma,
        onChange: onZRotate,
    }]), [state.rotation.alpha, state.rotation.beta, state.rotation.gamma]);

    // Rotation step
    const onChangeXRotationStep = useCallback((alpha: number) => {
        dispatch(actions.setRotationStepAlpha(alpha));
    }, []);

    const onChangeYRotationStep = useCallback((beta: number) => {
        dispatch(actions.setRotationStepBeta(beta));
    }, []);

    const onChangeZRotationStep = useCallback((gamma: number) => {
        dispatch(actions.setRotationStepGamme(gamma));
    }, []);

    const rotationStepRangeInputFields = useMemo(() => ([{
        ...rotationStepFieldsCommon,
        id: 'xRotationStepInp',
        title: 'Rotate X step',
        value: state.rotationStep.alpha,
        onChange: onChangeXRotationStep,
    }, {
        ...rotationStepFieldsCommon,
        id: 'yRotationStepInp',
        title: 'Rotate Y step',
        value: state.rotationStep.beta,
        onChange: onChangeYRotationStep,
    }, {
        ...rotationStepFieldsCommon,
        id: 'zRotationStepInp',
        title: 'Rotate Z step',
        value: state.rotationStep.gamma,
        onChange: onChangeZRotationStep,
    }]), [state.rotationStep.alpha, state.rotationStep.beta, state.rotationStep.gamma]);

    // Order of magnitude of the gravitational constant
    const onChangeGScale = useCallback((value: number) => {
        dispatch(changeGScale(value, viewAPI));
    }, []);

    // Order of magnitude of the Coulomb constant
    const onChangeKScale = useCallback((value: number) => {
        dispatch(changeKScale(value, viewAPI));
    }, []);

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
                additional={(10 ** state.timeStep).toFixed(5)}
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

            <SettingsPanelCollapsible
                title="Rotation"
                onStateChange={onToggleRotationCollapsible}
                expanded={state.rotationSettingsExpanded}
                animated
            >
                <RangeInputFieldsList fields={rotationRangeInputFields} />
            </SettingsPanelCollapsible>

            <SettingsPanelCollapsible
                title="Rotation step"
                onStateChange={onToggleRotationStepCollapsible}
                expanded={state.rotationStepSettingsExpanded}
                animated
            >
                <RangeInputFieldsList fields={rotationStepRangeInputFields} />
            </SettingsPanelCollapsible>

            <SettingsPanelCollapsible
                className="settings-panel-paths-collapsible"
                title="Paths"
                onStateChange={onToggleDrawPathCollapsible}
                expanded={state.drawPathSettingsExpanded}
                animated
            >
                <DrawPathCollapsible
                    onChangeDrawPath={onChangeDrawPath}
                    onChangePathLength={onChangePathLength}
                />
            </SettingsPanelCollapsible>

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
                additional={(10 ** state.gScale).toExponential(0)}
                onChange={onChangeGScale}
            />

            <RangeInputField
                id="kInp"
                title="K"
                min={-10}
                max={10}
                step={1}
                value={state.kScale}
                additional={(10 ** state.kScale).toExponential(0)}
                onChange={onChangeKScale}
            />

            <div className="data-footer">
            </div>
        </section>
    );
};
