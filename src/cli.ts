#!/usr/bin/env node

/**
 * HarmonyOS Engineering Agent - Unified MCP Server
 * 
 * Usage:
 *   harmony-mcp              # Start the unified MCP server
 *   harmony-mcp list          # List all available tools
 *   harmony-mcp help          # Show help
 * 
 * MCP Client Config (one-liner):
 *   Command: npx
 *   Args: ["-y", "@itlili/harmony-plugin"]
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function printHelp(): void {
  console.log(`
HarmonyOS Engineering Agent - Unified MCP Server
==================================================

Usage: harmony-mcp

  Start the unified MCP server with all 170+ tools.
  No sub-commands needed - it's now a single server.

Commands: list, help
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0]?.toLowerCase() || '';

  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    printHelp();
    process.exit(0);
  }

  if (cmd === 'list') {
    console.log('HarmonyOS Engineering Agent - Unified MCP Server');
    console.log('All 170+ tools are available in a single server.');
    console.log('Categories: project, docs, dep, migration, build, device, verify,');
    console.log('  test, visual, perf, security, release, enterprise, doctor,');
    console.log('  orchestrator, dashboard, evaluation, creator, skills');
    process.exit(0);
  }

  // Start the unified MCP server
  const serverPath = resolve(__dirname, '..', 'harmony-mcp', 'dist', 'index.js');

  try {
    const { fork } = await import('node:child_process');
    const child = fork(serverPath, [], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    });

    child.on('error', (err) => {
      console.error('Failed to start harmony-mcp:', err.message);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  } catch (err: any) {
    console.error('Failed to load harmony-mcp:', err.message);
    process.exit(1);
  }
}

main();