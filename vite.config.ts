import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
    base: '/particles',
    plugins: [react(), svgr({ include: '**/*.svg' })],
    resolve: {
        alias: {
            "src": path.resolve(__dirname, "./src"),
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
