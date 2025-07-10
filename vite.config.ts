import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const customAliasPaths = [
    'app',
    'components',
    'context',
    'demos',
    'engine',
    'particles',
    'shared',
    'store',
];

// https://vite.dev/config/
export default defineConfig({
    base: '/particles',
    plugins: [react(), svgr({ include: '**/*.svg' })],
    resolve: {
        alias: {
            ...Object.fromEntries(customAliasPaths.map((item) => ([
                item, path.resolve(__dirname, `./src/${item}`),
            ]))),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern',
            },
        },
    },
    optimizeDeps: {
        include: ['react-dom', 'classnames'],
    },
    build: {
        commonjsOptions: {
            include: [/node_modules/],
        },
    },
});
