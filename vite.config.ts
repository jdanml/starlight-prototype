import { defineConfig } from 'vite';

// GitHub Pages serves this project at https://jdanml.github.io/starlight-prototype/
// so every built asset URL must be prefixed with the repository name.
export default defineConfig({
  base: '/starlight-prototype/',
});
