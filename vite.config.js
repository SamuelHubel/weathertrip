import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    setEnv(mode);
    return {
        plugins: [
            react(),
            envPlugin(),
            devServerPlugin(),
            sourcemapPlugin(),
            buildPathPlugin(),
            basePlugin(),
            importPrefixPlugin(),
            htmlPlugin(mode),
        ],
        // tests — only scan src/, never the server/ directory
        test: {
            globals: true,
            environment: "jsdom",
            setupFiles: "./src/setupTests.js",
            css: true,
            include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
        },
    };
});
function setEnv(mode) {
    Object.assign(process.env, loadEnv(mode, ".", ["REACT_APP_", "NODE_ENV", "PUBLIC_URL"]));
    process.env.NODE_ENV ||= mode;
    const { homepage } = JSON.parse(readFileSync("package.json", "utf-8"));
    process.env.PUBLIC_URL ||= homepage
        ? `${homepage.startsWith("http") || homepage.startsWith("/")
            ? homepage
            : `/${homepage}`}`.replace(/\/$/, "")
        : "";
}
function envPlugin() {
    return {
        name: "env-plugin",
        config(_, { mode }) {
            const env = loadEnv(mode, ".", ["REACT_APP_", "NODE_ENV", "PUBLIC_URL"]);
            return {
                define: Object.fromEntries(Object.entries(env).map(([key, value]) => [
                    `process.env.${key}`,
                    JSON.stringify(value),
                ])),
            };
        },
    };
}
function devServerPlugin() {
    return {
        name: "dev-server-plugin",
        config(_, { mode }) {
            const { HOST, PORT, HTTPS, SSL_CRT_FILE, SSL_KEY_FILE } = loadEnv(mode, ".", ["HOST", "PORT", "HTTPS", "SSL_CRT_FILE", "SSL_KEY_FILE"]);
            const https = HTTPS === "true";
            return {
                server: {
                    host: HOST || "0.0.0.0",
                    port: parseInt(PORT || "3000", 10),
                    open: true,
                    ...(https &&
                        SSL_CRT_FILE &&
                        SSL_KEY_FILE && {
                        https: {
                            cert: readFileSync(resolve(SSL_CRT_FILE)),
                            key: readFileSync(resolve(SSL_KEY_FILE)),
                        },
                    }),
                },
            };
        },
    };
}
function sourcemapPlugin() {
    return {
        name: "sourcemap-plugin",
        config(_, { mode }) {
            const { GENERATE_SOURCEMAP } = loadEnv(mode, ".", [
                "GENERATE_SOURCEMAP",
            ]);
            return {
                build: {
                    sourcemap: GENERATE_SOURCEMAP === "true",
                },
            };
        },
    };
}
function buildPathPlugin() {
    return {
        name: "build-path-plugin",
        config(_, { mode }) {
            const { BUILD_PATH } = loadEnv(mode, ".", [
                "BUILD_PATH",
            ]);
            return {
                build: {
                    outDir: BUILD_PATH || "build",
                },
            };
        },
    };
}
function basePlugin() {
    return {
        name: "base-plugin",
        config(_, { mode }) {
            const { PUBLIC_URL } = loadEnv(mode, ".", ["PUBLIC_URL"]);
            return {
                base: PUBLIC_URL || "",
            };
        },
    };
}
function importPrefixPlugin() {
    return {
        name: "import-prefix-plugin",
        config() {
            return {
                resolve: {
                    alias: [{ find: /^~([^/])/, replacement: "$1" }],
                },
            };
        },
    };
}
function htmlPlugin(mode) {
    const env = loadEnv(mode, ".", ["REACT_APP_", "NODE_ENV", "PUBLIC_URL"]);
    return {
        name: "html-plugin",
        transformIndexHtml: {
            order: "pre",
            handler(html) {
                return html.replace(/%(.*?)%/g, (match, p1) => env[p1] ?? match);
            },
        },
    };
}