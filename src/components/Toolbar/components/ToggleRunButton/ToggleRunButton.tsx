import { Button, useStore, ButtonProps } from '@jezvejs/react';

import { AppState } from 'shared/types.ts';

import PlayIcon from './assets/play.svg';
import PauseIcon from './assets/pause.svg';

export type ToggleRunButtonProps = Partial<ButtonProps>;

export const ToggleRunButton = (props: ToggleRunButtonProps) => {
    const { getState } = useStore<AppState>();
    const state = getState();

    return (
        <Button
            {...props}
            id="toggleRunBtn"
            icon={(state.paused) ? PlayIcon : PauseIcon}
        />
    );
};
