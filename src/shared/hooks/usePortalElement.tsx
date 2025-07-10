import { useMemo } from 'react';

/**
 * Returns memoized element for portal
 * @param {string} id
 */
export const usePortalElement = (id = 'custom-root') => (
    useMemo(() => (
        document.getElementById(id)
    ), [id])
);
