import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { RendererProvider } from './contexts/RendererContext';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <RendererProvider>
      <App />
    </RendererProvider>
  </Provider>
)
