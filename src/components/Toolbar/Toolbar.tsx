import { CloseButton, useStore } from '@jezvejs/react';
import { useCallback } from 'react';

import { AppState } from 'src/types.ts';

import { ToggleRunButton } from '../ToggleRunButton/ToggleRunButton.tsx';
import { MenuButton } from '../MenuButton/MenuButton.tsx';
import { ResetButton } from '../ResetButton/ResetButton.tsx';

import './Toolbar.css';

export type ToolbarProps = {
    id?: string;

    onToggleRun: () => void;
    onReset: () => void;
    onClose: () => void;
    onMenu?: () => void;
};

export const Toolbar = (props: ToolbarProps) => {
    const { onToggleRun, onReset, onClose, onMenu, ...rest } = props;

    const { getState, setState } = useStore<AppState>();
    const state = getState();
    const showCloseBtn = !!state.settingsVisible;
    const showMenuBtn = !state.settingsVisible;

    const showOffcanvas = useCallback((settingsVisible: boolean) => {
        setState((prev) => ({ ...prev, settingsVisible }));
    }, []);

    const onMenuBtnClick = useCallback(() => {
        showOffcanvas(true);

        onMenu?.();
    }, [showOffcanvas]);

    return (
        <div {...rest} className="toolbar">
            <ToggleRunButton onClick={onToggleRun} />
            <ResetButton onClick={onReset} />
            {showCloseBtn && <CloseButton className="header-btn" onClick={onClose} />}
            {showMenuBtn && <MenuButton
                className="header-btn"
                onClick={onMenuBtnClick}
            />}
        </div>
    );
};