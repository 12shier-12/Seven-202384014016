import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { seedIfEmpty } from './db/seed';

const container = document.getElementById('root');

if (container) {
  seedIfEmpty()
    .catch((error) => {
      console.error('初始化示例数据失败', error);
    })
    .finally(() => {
      createRoot(container).render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    });
}
