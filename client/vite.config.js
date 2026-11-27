import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000';

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5176,
      strictPort: false,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('error', (error, _request, response) => {
              console.error(`Development API proxy could not reach ${apiTarget}: ${error.code || 'connection failed'}`);
              if (!response || response.headersSent) return;
              response.writeHead(503, { 'Content-Type': 'application/json', Connection: 'close' });
              response.end(JSON.stringify({
                error: 'API server unavailable. Start the Express server and configure MongoDB and JWT settings.'
              }));
            });
          }
        }
      }
    }
  };
});
