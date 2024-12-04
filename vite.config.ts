import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
    base: '/particles',
    plugins: [react(), svgr({ include: '**/*.svg' })],
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
