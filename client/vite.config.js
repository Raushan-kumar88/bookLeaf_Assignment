import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server runs on 5173 and proxies /api + /socket.io directly to the
// deployed Render backend, so the frontend can call the API with relative
// URLs. `changeOrigin` is required because the target is a remote HTTPS host.
const BACKEND = 'https://bookleaf-assignment-82uf.onrender.com';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true, secure: true },
      '/socket.io': { target: BACKEND, changeOrigin: true, secure: true, ws: true },
    },
  },
});
