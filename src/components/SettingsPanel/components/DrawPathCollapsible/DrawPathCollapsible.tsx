import { Switch, useStore } from '@jezvejs/react';
import { useCallback } from 'react';
import { RangeInputField } from 'src/components/RangeInputField/RangeInputField.tsx';
import { AppState } from 'src/types.ts';

export interface DrawPathCollapsibleProps {
    onChangeDrawPath: (drawPath: boolean) => void;
    onChangePathLength: (pathLength: number) => void;
}

export const DrawPathCollapsible = (props: DrawPathCollapsibleProps) => {
    const {
        onChangeDrawPath,
        onChangePathLength,
    } = props;

    const { getState } = useStore<AppState>();
    const state = getState();

    const onChangeDrawPathSwitch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const drawPath = e.target?.checked ?? false;
        onChangeDrawPath?.(drawPath);
    }, []);

    const onChangePathLengthInput = useCallback((pathLength: number) => {
        onChangePathLength?.(pathLength);
    }, []);

    return (
        <div>
            <Switch
                label="Draw particle path"
                checked={state.drawPath}
                onChange={onChangeDrawPathSwitch}
            />
            <RangeInputField
                id="pathLengthInp"
                title="Path length"
                min={1}
                max={100}
                step={1}
                value={state.pathLength}
                disabled={!state.drawPath}
                onChange={onChangePathLengthInput}
            />
        </div>
    );
};

DrawPathCollapsible.displayName = 'DrawPathCollapsible';
