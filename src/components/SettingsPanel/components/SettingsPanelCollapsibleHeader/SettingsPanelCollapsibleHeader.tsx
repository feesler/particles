import MinusIcon from './assets/minus.svg';
import PlusIcon from './assets/plus.svg';

export interface SettingsPanelCollapsibleHeaderProps {
    title: string;
    expanded?: boolean;
}

export const SettingsPanelCollapsibleHeader = (
    { title, expanded }: SettingsPanelCollapsibleHeaderProps,
) => (
    <div className="settings-panel-collapsible__header">
        <span>
            {title}
        </span>
        {(
            (expanded)
                ? (<MinusIcon className="header__icon" />)
                : (<PlusIcon className="header__icon" />)
        )}
    </div>
);
