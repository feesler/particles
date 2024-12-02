import { DemoItem } from 'src/demos.ts';

type DemoSelectProps = React.HTMLAttributes<HTMLSelectElement> & {
    items: DemoItem[];
};

const SelectOption = (item: DemoItem) => (
    <option value={item.id}>{item.id}</option>
);

export const DemoSelect = ({ items, ...props }: DemoSelectProps) => (
    <select {...props}>
        {items?.map((item) => (
            (item.type === 'group')
                ? (
                    <optgroup label={item.title} key={`demogr_${item.id}`}>
                        {item.items?.map((child) => (
                            <SelectOption {...child} key={`demochild_${child.id}`} />
                        ))}
                    </optgroup>
                )
                : <SelectOption {...item} key={`demosel_${item.id}`} />
        ))}
    </select>
);
