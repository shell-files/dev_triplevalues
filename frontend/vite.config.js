import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'url'

// [https://vite.dev/config/](https://vite.dev/config/)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  server: {
    host: '0.0.0.0',
    port: 80,
    allowedHosts: ['react', 'tv.weareithero.cloud', 'tv.myapp.com'],
    // proxy: {
    //   '/api': {
    //     target: 'http://tval.weareithero.cloud',
    //     // target: 'http://192.168.0.107:8000',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ''),
    //     headers: {
    //       'Origin': 'http://tval.weareithero.cloud'
    //       //'Origin': 'http://192.168.0.107:8000'
    //     }
    //   }
    // }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@errors': fileURLToPath(new URL('./src/homes/errors', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@homes': fileURLToPath(new URL('./src/homes', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      '@gates': fileURLToPath(new URL('./src/homes/gates', import.meta.url)),
      '@logins': fileURLToPath(new URL('./src/homes/logins', import.meta.url)),
      '@mains': fileURLToPath(new URL('./src/homes/mains', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@admin': fileURLToPath(new URL('./src/homes/admin', import.meta.url)),
      '@partners': fileURLToPath(new URL('./src/homes/partners', import.meta.url)),
    }
  }
})
