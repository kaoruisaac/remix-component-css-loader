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
      format: 'esm',
      outfile: 'dist/index.js',
      external: ['react', 'vite', 'fs', 'path', 'typescript'],
      sourcemap: true,
      minify: true,
      metafile: true,
    });

    console.log('Build successful! Output file is at dist/index.js');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildPlugin(); 