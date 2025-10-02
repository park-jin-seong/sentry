// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    define: {
        global: 'window',
    },
    server: {
        port: 5188,
        proxy: {
            "/api": {
                target: "http://10.5.4.13:8080",
                changeOrigin: true,
                secure: false,
                //rewrite: (path) => path.replace(/^\/api/, '')
            },
        },
    },
});
