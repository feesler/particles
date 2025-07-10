import { RangeInputField, RangeInputFieldProps } from 'components/SettingsPanel/components/RangeInputField/RangeInputField.tsx';

export interface RangeInputFieldsListProps {
    fields: RangeInputFieldProps[];
}

export const RangeInputFieldsList = ({ fields }: RangeInputFieldsListProps) => (
    <div>
        {fields.map(((field) => (
            <RangeInputField {...field} key={field.id} />
        )))}
    </div>
);

RangeInputFieldsList.displayName = 'RangeInputFieldsList';
