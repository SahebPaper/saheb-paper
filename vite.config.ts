import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function electronCspPlugin() {
  return {
    name: 'electron-csp-meta',
    transformIndexHtml(html: string, context: any) {
      // Apply only for production builds (preserves Vite dev server HMR)
      if (context.server) {
        return html;
      }
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://znyvmlwggwckjxxsxiwq.supabase.co wss://znyvmlwggwckjxxsxiwq.supabase.co https://scyiwfqkknuphzhvklok.supabase.co wss://scyiwfqkknuphzhvklok.supabase.co https://sahebpaper.github.io https://*.supabase.co wss://*.supabase.co",
        "img-src 'self' data: blob: https:",
        "worker-src 'self' blob:",
        "media-src 'self' blob: data: mediastream:",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-src 'none'",
      ].join('; ');

      const metaTag = `\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`;
      return html.replace('</head>', `${metaTag}\n  </head>`);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), electronCspPlugin()],
  server: {
    host: true,
    port: 5176,
  },
  preview: {
    host: true,
    port: 5176,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'xlsx-js-style': path.resolve(__dirname, './src/utils/xlsx-shim.ts'),
    },
  },
  build: {
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx') || id.includes('docx')) {
              return 'vendor-export-docs';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
})
