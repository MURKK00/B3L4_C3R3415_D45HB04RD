import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

function uploadDemonstracaoPlugin() {
  return {
    name: 'upload-demonstracao-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/save-dashboard', (req: any, res: any) => {
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          req.on('end', () => {
            try {
              const buffer = Buffer.concat(chunks);
              const targetPath = path.resolve('public/DASHBOARD.xlsx');
              fs.writeFileSync(targetPath, buffer);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, size: buffer.length }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
      server.middlewares.use('/api/save-demonstracao', (req: any, res: any) => {
        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          req.on('end', () => {
            try {
              const buffer = Buffer.concat(chunks);
              const targetPath = path.resolve('public/Demonstracao_2026_EXEMPLO.xlsx');
              fs.writeFileSync(targetPath, buffer);
              const targetPathSrc = path.resolve('src/data/Demonstracao_2026_EXEMPLO.xlsx');
              try { fs.writeFileSync(targetPathSrc, buffer); } catch {}
              const targetPathRoot = path.resolve('Demonstracao_2026_EXEMPLO.xlsx');
              try { fs.writeFileSync(targetPathRoot, buffer); } catch {}
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, size: buffer.length, path: '/Demonstracao_2026_EXEMPLO.xlsx' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), uploadDemonstracaoPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
