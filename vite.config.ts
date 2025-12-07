import {defineConfig} from "vite";

export default defineConfig({
  base: './',
  server: {
    open: true,
  },
  resolve: {
    alias: {
      phaser: "phaser/dist/phaser.js",
    },
  },
  build: {
    assetsDir: 'assets', // Folder na zasoby
  },
});