import { CloseButton, useStore } from '@jezvejs/react';

import { DemoItem } from 'src/demos.ts';
import { Field } from 'src/engine/Field.ts';
import { AppState } from 'src/types.ts';
import { DemoSelect } from '../DemoSelect/DemoSelect.tsx';

type Props = {
    fieldRef: Field | null;

    demosList: DemoItem[];

    onChangeDemo: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onScale: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onXRotate: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onYRotate: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onZRotate: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onToggleRun: () => void;
    onClose: () => void;
};

export const SettingsPanel = (props: Props) => {
    const {
        fieldRef,
        demosList,
        onChangeDemo,
        onScale,
        onXRotate,
        onYRotate,
        onZRotate,
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
                <DemoSelect id="demoSelect" items={demosList} onChange={onChangeDemo} />
            </div>

            <div className="date-value">
                <label>Scale factor</label>
                <input
                    id="scaleFactorInp"
                    type="range"
                    min="0.001"
                    max="20"
                    step="0.01"
                    value={state.scaleFactor.toFixed(3)}
                    onChange={onScale}
                />
                <span id="scalefactor">{state.scaleFactor.toFixed(3)}</span>
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
                <input
                    id="xRotationInp"
                    type="range"
                    min="-3"
                    max="3"
                    step="0.01"
                    value={state.rotation.alpha.toFixed(2)}
                    onChange={onXRotate}
                />
                <span id="xrotate">{state.rotation.alpha.toFixed(2)}</span>
            </div>

            <div className="date-value">
                <label>Rotate Y</label>
                <input
                    id="yRotationInp"
                    type="range"
                    min="-3"
                    max="3"
                    step="0.01"
                    value={state.rotation.beta.toFixed(2)}
                    onChange={onYRotate}
                />
                <span id="yrotate">{state.rotation.beta.toFixed(2)}</span>
            </div>

            <div className="date-value">
                <label>Rotate Z</label>
                <input
                    id="zRotationInp"
                    type="range"
                    min="-3"
                    max="3"
                    step="0.01"
                    value={state.rotation.gamma.toFixed(2)}
                    onChange={onZRotate}
                />
                <span id="zrotate">{state.rotation.gamma.toFixed(2)}</span>
            </div>

            <div>
                <button id="toggleRunBtn" type="button" onClick={onToggleRun}>
                    {(state.paused) ? 'Run' : 'Pause'}
                </button>
            </div>
        </section>
    );
};