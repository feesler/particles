import '@jezvejs/react/style.scss';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from 'app/App/App.tsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
