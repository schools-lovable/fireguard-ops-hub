import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import path from "node:path";

export default defineConfig({
  tanstackStart: { srcDirectory: "client/src" },
  plugins: [jsxLocPlugin()],
  vite: {
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(import.meta.dirname),
    publicDir: path.resolve(import.meta.dirname, "client", "public"),
  },
});
