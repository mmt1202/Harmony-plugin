import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const base = 'mcp-servers';
const dirs = readdirSync(base).filter(d => d.startsWith('harmony-'));
const prefixes = {
  'harmony-project-mcp': 'project',
  'harmony-docs-mcp': 'docs',
  'harmony-dependency-mcp': 'dep',
  'harmony-migration-mcp': 'migration',
  'harmony-build-mcp': 'build',
  'harmony-device-mcp': 'device',
  'harmony-verify-mcp': 'verify',
  'harmony-test-mcp': 'test',
  'harmony-visual-mcp': 'visual',
  'harmony-performance-mcp': 'perf',
  'harmony-security-mcp': 'security',
  'harmony-release-mcp': 'release',
  'harmony-enterprise-mcp': 'enterprise',
  'harmony-code-doctor-mcp': 'doctor',
  'harmony-orchestrator-mcp': 'orchestrator',
  'harmony-dashboard-mcp': 'dashboard',
  'harmony-evaluation-mcp': 'evaluation',
  'harmony-creator-mcp': 'creator',
  'harmony-skills-mcp': 'skills',
  'harmony-kit-mcp': 'kit',
};

/**
 * Extract registerTool calls from index.ts content using a robust line-by-line scanner.
 * Tracks parenthesis depth to find complete registerTool blocks.
 */
function extractRegisterToolBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Match server.registerTool( or just registerTool(
    const match = line.match(/(?:server\.)?registerTool\s*\(\s*$/);
    if (match) {
      // Find the start of the registerTool call
      // The first line is the registerTool( line
      // Next lines contain: "name", schema, async handler
      let blockLines = [];
      let parenDepth = 0;
      let inString = false;
      let stringChar = '';

      // Start from the current line, find the opening paren
      let j = i;
      let found = false;
      for (; j < lines.length; j++) {
        const l = lines[j];
        blockLines.push(l);
        for (let k = 0; k < l.length; k++) {
          const ch = l[k];
          if (inString) {
            if (ch === '\\') { k++; continue; }
            if (ch === stringChar) { inString = false; }
            continue;
          }
          if (ch === '"' || ch === "'" || ch === '`') {
            inString = true;
            stringChar = ch;
            continue;
          }
          if (ch === '(') { parenDepth++; }
          if (ch === ')') {
            parenDepth--;
            if (parenDepth === 0) {
              // Check if this is followed by ); or ,
              const rest = l.substring(k + 1).trim();
              if (rest === ';' || rest.startsWith(');')) {
                found = true;
                break;
              }
            }
          }
        }
        if (found) break;
      }

      if (found && blockLines.length > 0) {
        // Extract tool name from the first lines after registerTool(
        const fullBlock = blockLines.join('\n');
        const nameMatch = fullBlock.match(/registerTool\s*\(\s*\n?\s*["'](\w+)["']/);
        if (nameMatch) {
          blocks.push({
            name: nameMatch[1],
            code: fullBlock
          });
        }
      }
      i = j + 1;
    } else {
      i++;
    }
  }
  return blocks;
}

/**
 * Extract imports from tools/ directory
 */
function extractToolImports(content) {
  const lines = content.split('\n');
  const imports = [];
  for (const line of lines) {
    const match = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]\.\/tools\/([^'"]+)['"]/);
    if (match) {
      imports.push({
        names: match[1].split(',').map(n => n.trim()).filter(n => n),
        path: match[2]
      });
    }
  }
  return imports;
}

// ============================================================
// Generate unified index.ts
// ============================================================

let output = [];
output.push('import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";');
output.push('import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";');
output.push('import { z } from "zod";');
output.push('import type { BehaviorRecording } from "../../shared/types/dist/index.js";');
output.push('');

// Collect all tool imports
for (const dir of dirs) {
  const indexPath = join(base, dir, 'src', 'index.ts');
  if (!existsSync(indexPath)) continue;
  const content = readFileSync(indexPath, 'utf-8');
  const imports = extractToolImports(content);
  for (const imp of imports) {
    const names = imp.names.join(', ');
    // Use compiled dist/ files (outDir: ./dist, rootDir: ./src)
    const jsPath = imp.path.replace(/\.ts$/, '.js');
    output.push(`import { ${names} } from "${'../'.repeat(2)}mcp-servers/${dir}/dist/tools/${jsPath}";`);
  }
}

output.push('');
output.push('');
output.push('// ---- Visual tool schemas ----');
output.push('const BehaviorStepInputSchema = z.object({');
output.push('  action: z.enum(["TAP", "SWIPE", "TYPE", "LONG_PRESS", "SCROLL", "WAIT", "ASSERT", "NAVIGATE"]),');
output.push('  target: z.string().optional(),');
output.push('  value: z.string().optional(),');
output.push('  duration: z.number().optional(),');
output.push('  description: z.string(),');
output.push('});');
output.push('const BehaviorStepSchema = BehaviorStepInputSchema.extend({ id: z.string() });');
output.push('const BehaviorRecordingSchema = z.object({');
output.push('  id: z.string(),');
output.push('  name: z.string(),');
output.push('  platform: z.string(),');
output.push('  steps: z.array(BehaviorStepSchema),');
output.push('  duration: z.number(),');
output.push('  timestamp: z.string(),');
output.push('});');
output.push('const DeviceSizeSchema = z.object({');
output.push('  name: z.string(),');
output.push('  width: z.number(),');
output.push('  height: z.number(),');
output.push('  category: z.enum(["SMALL_PHONE", "PHONE", "LARGE_PHONE", "TABLET", "LARGE_TABLET"]),');
output.push('});');
output.push('');
output.push('function toContent(result: unknown) {');
output.push('  return {');
output.push('    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],');
output.push('  };');
output.push('}');
output.push('');
output.push('const server = new McpServer({ name: "harmony-mcp", version: "0.2.0" });');
output.push('');

// Collect all registerTool blocks
let totalTools = 0;
for (const dir of dirs) {
  const indexPath = join(base, dir, 'src', 'index.ts');
  if (!existsSync(indexPath)) continue;
  const content = readFileSync(indexPath, 'utf-8');
  const prefix = prefixes[dir] || dir;
  const blocks = extractRegisterToolBlocks(content);

  for (const block of blocks) {
    const prefixedName = prefix + '_' + block.name;
    // Replace the tool name in the registerTool call, keeping it as a quoted string
    let code = block.code;
    // Replace the first occurrence of the tool name in quotes
    code = code.replace(new RegExp(`(["'])${block.name}\\1`), `"${prefixedName}"`);
    // Replace server.registerTool with just server.registerTool
    code = code.replace(/server\.registerTool/, 'server.registerTool');
    // Ensure proper indentation (code already ends with ');')
    output.push(code);
    output.push('');
    totalTools++;
  }
}

output.push(`console.error("harmony-mcp running on stdio with ${totalTools} tools");`);
output.push('');
output.push('const transport = new StdioServerTransport();');
output.push('await server.connect(transport);');

// Ensure output directory exists
mkdirSync('harmony-mcp/src', { recursive: true });
const result = output.join('\n');
writeFileSync('harmony-mcp/src/index.ts', result);
console.log(`Generated harmony-mcp/src/index.ts: ${result.length} chars, ${totalTools} tools`);