import { Button, ButtonProps } from '@jezvejs/react';

import ResetIcon from './assets/reset.svg';

export type ResetButtonProps = Partial<ButtonProps>;

export const ResetButton = (props: ResetButtonProps) => (
    <Button
        {...props}
        id="resetBtn"
        icon={ResetIcon}
    />
);
