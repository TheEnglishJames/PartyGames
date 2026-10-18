import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// HTTPS in dev so the phone's motion sensor (Heads Up) works over WLAN.
// Relative base so the build runs from any GitHub Pages sub-path.
export default defineConfig({
  base: './',
  plugins: [basicSsl()],
});
