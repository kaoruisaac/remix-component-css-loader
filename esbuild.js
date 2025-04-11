// @ts-nocheck
import * as esbuild from 'esbuild';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function buildPlugin() {
  try {
    await esbuild.build({
      entryPoints: [resolve(__dirname, 'index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node16',
      format: 'esm',
      outfile: 'dist/index.js',
      external: ['react', 'vite', 'fast-glob', 'fs', 'path'],
      sourcemap: true,
      minify: true,
      metafile: true,
    });
    
    console.log('構建成功！輸出文件位於 dist/index.js');
  } catch (error) {
    console.error('構建失敗:', error);
    process.exit(1);
  }
}

buildPlugin(); 