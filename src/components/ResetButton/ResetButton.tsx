import { Button, ButtonProps } from '@jezvejs/react';

import ResetIcon from './assets/reset.svg';
import './ResetButton.css';

export type ResetButtonProps = Partial<ButtonProps>;

export const ResetButton = (props: ResetButtonProps) => (
    <Button
        {...props}
        id="resetBtn"
        className="reset-btn"
        icon={ResetIcon}
    />
);
