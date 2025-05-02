import { Collapsible } from '@jezvejs/react';
import { CollapsibleProps } from '@jezvejs/react/src/Components/Collapsible/types.ts';
import { memo, useMemo } from 'react';
import classNames from 'classnames';

import { SettingsPanelCollapsibleHeader } from '../SettingsPanelCollapsibleHeader/SettingsPanelCollapsibleHeader.tsx';

import './SettingsPanelCollapsible.css';

export interface SettingsPanelCollapsibleProps extends CollapsibleProps {
    title: string;
}

export const SettingsPanelCollapsible = memo(
    ({ title, ...props }: SettingsPanelCollapsibleProps) => {
        const header = useMemo(() => (
            <SettingsPanelCollapsibleHeader title={title} expanded={props.expanded} />
        ), [title, props.expanded]);

        return (
            <Collapsible
                {...props}
                className={classNames('settings-panel-collapsible', props.className)}
                header={header}
            />
        );
    },
);

SettingsPanelCollapsible.displayName = 'SettingsPanelCollapsible';
