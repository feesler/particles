import { Button, ButtonProps, ButtonRef } from '@jezvejs/react';
import { forwardRef } from 'react';

import MenuIcon from './assets/menu.svg';
import './MenuButton.css';

export const MenuButton = forwardRef<ButtonRef, ButtonProps>((props, ref) => (
    <Button
        className="menu-btn"
        icon={MenuIcon}
        ref={ref}
        {...props}
    />
));

MenuButton.displayName = 'MenuButton';
