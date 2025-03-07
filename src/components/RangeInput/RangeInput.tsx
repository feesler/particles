import { RangeSlider, RangeSliderProps, RangeSliderValue, DecimalInput } from '@jezvejs/react';
import { useCallback, useEffect, useState } from 'react';

import './RangeInput.css';
import { fixFloat } from '@jezvejs/number';

export type RangeInputProps = Omit<Partial<RangeSliderProps>, 'value' | 'onChange'> & {
    value?: number;
    precision?: number;
    onChange: (value: number) => void,
};

const PRECISION = 6;

const formatValue = (value: number) => (
    parseFloat(value.toFixed(PRECISION)).toLocaleString()
);

export const RangeInput = (props: RangeInputProps) => {
    const [state, setState] = useState({
        ...props,
        value: props.value ?? 0,
        strValue: formatValue(props.value ?? 0),
    });

    const setValue = (value: number) => {
        setState((prev) => (
            (value === prev.value)
                ? prev
                : {
                    ...prev,
                    value,
                    strValue: formatValue(value),
                }
        ));
    };

    const setStrValue = (strValue: string) => {
        setState((prev) => ({ ...prev, strValue }));
    };

    const onChange = useCallback((value: RangeSliderValue) => {
        if (typeof value !== 'number') {
            return;
        }

        setValue(value);
        props?.onChange?.(value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setValue(props.value ?? 0);
    }, [props.value]);

    const handleInputValue = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e?.target?.value ?? '';
        setStrValue(value);

        const fixed = fixFloat(value);
        if (fixed === null) {
            return;
        }
        const newValue = parseFloat(fixed);
        const floatVal = state.value;
        if (newValue === floatVal) {
            return;
        }

        setValue(newValue);
        onChange?.(newValue);
    }, [state.value, onChange]);


    return (
        <div className="range-input">
            <RangeSlider
                {...props}
                id={props.id ?? ''}
                value={state.value}
                onChange={onChange}
            />

            <DecimalInput
                className="range-input__value"
                value={state.strValue}
                onChange={handleInputValue}
            />
        </div>
    );
};