import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: { port: 3000, open: true },
    build: { outDir: "build" },
    // tests — only scan src/, never the server/ directory
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./src/setupTests.js",
        css: true,
        include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    },
});
