import { defineConfig } from 'vite'

export default defineConfig({
  base: '/three-box-editor-demo/',
  build: {
    outDir: 'docs',
    assetsDir: 'assets'
  },
  resolve: {
    alias: {
      'three/addons/': 'three/examples/jsm/'
    }
  }
}) 