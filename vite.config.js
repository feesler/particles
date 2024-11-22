import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
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
