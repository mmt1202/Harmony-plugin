import * as esbuild from 'esbuild';
import { writeFileSync } from 'fs';

const result = await esbuild.build({
  entryPoints: ['harmony-mcp/src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'harmony-mcp/dist/index.js',
  resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: [
    // Don't bundle native modules
    '@deveco-codegenie/mcp-win32-x64',
  ],
  sourcemap: false,
  minify: false,
  logLevel: 'info',
});

if (result.errors.length > 0) {
  console.error('Build errors:', result.errors);
  process.exit(1);
}

if (result.warnings.length > 0) {
  console.warn('Build warnings:', result.warnings);
}

console.log('Bundle complete: harmony-mcp/dist/index.js');