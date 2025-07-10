import './ReadOnlyField.css';

export type ReadOnlyFieldProps = {
    id?: string;
    title?: string;
    value?: string | number;
};

export const ReadOnlyField = ({ id, title, value }: ReadOnlyFieldProps) => (
    <div id={id} className="read-only-field">
        <label>{title}</label>
        <span>{value}</span>
    </div>
);
