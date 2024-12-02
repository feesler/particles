declare module '*.css';

declare module '*.scss';

declare module '*.svg' {
    const content: React.FC<React.SVGProps<SVGElement>>;
    export default content;
}

/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />