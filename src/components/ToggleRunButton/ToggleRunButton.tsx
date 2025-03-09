import { Button, useStore, ButtonProps } from '@jezvejs/react';

import { AppState } from 'src/types.ts';

import PlayIcon from './assets/play.svg';
import PauseIcon from './assets/pause.svg';
import './ToggleRunButton.css';

export type ToggleRunButtonProps = Partial<ButtonProps>;

export const ToggleRunButton = (props: ToggleRunButtonProps) => {
    const { getState } = useStore<AppState>();
    const state = getState();

    return (
        <Button
            {...props}
            id="toggleRunBtn"
            className="toggle-run-btn"
            icon={(state.paused) ? PlayIcon : PauseIcon}
        />
    );
};