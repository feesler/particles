import { DropDownProps, DropDown } from '@jezvejs/react';

import './SelectField.css';

export type SelectFieldProps = Partial<DropDownProps> & {
    id?: string;
    title?: string;
};

export const SelectField = (props: SelectFieldProps) => {
    const { id, title, ...rest } = props;

    return (
        <div id={id} className="select-field">
            <label>{title}</label>
            <DropDown {...rest} />
        </div>
    );
};
