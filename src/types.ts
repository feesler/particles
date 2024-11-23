import { DropDownMenuItemProps } from '@jezvejs/react';

/**
 * Coordinates point
 */
export interface Point {
    x: number;
    y: number;
}

export type PlanePoint = {
    left: number;
    right: number;
};

export type Axis = "x" | "y" | "z";

export type MenuItemProps = DropDownMenuItemProps;

export interface MenuItemCallback<T extends MenuItemProps = MenuItemProps, R = boolean> {
    (item: T, index?: number, arr?: T[]): R;
}

/**
 * shouldIncludeParentItem() function params
 */
export interface IncludeGroupItemsParam {
    includeGroupItems?: boolean;
    includeChildItems?: boolean;
}

/**
 * toFlatList() function params
 */
export interface ToFlatListParam extends IncludeGroupItemsParam {
    disabled?: boolean;
}

/**
 * forItems() function params
 */
export interface MenuLoopParam<
    T extends MenuItemProps = MenuItemProps,
> extends IncludeGroupItemsParam {
    group?: T | null;
}
