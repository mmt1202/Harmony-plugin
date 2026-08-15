import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { manage_roles } from './tools/manage-roles.js';
import { query_audit_log } from './tools/audit-log.js';
import { manage_rules } from './tools/manage-rules.js';
import { manage_private_capability_graph } from './tools/manage-private-capability-graph.js';
import { manage_custom_recipes } from './tools/manage-custom-recipes.js';
import { record_knowledge } from './tools/record-knowledge.js';
import { get_knowledge } from './tools/get-knowledge.js';

function toContent(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

const server = new McpServer({
  name: 'harmony-enterprise-mcp',
  version: '0.1.0',
});

// ---- Team & Role Management ----

server.registerTool(
  'manage_roles',
  {
    description: 'Manage team roles and permissions (list, add, remove, update)',
    inputSchema: {
      action: z.enum(['list', 'add', 'remove', 'update']).describe('Action to perform on roles'),
      role: z.string().optional().describe('Role name (e.g. Developer, Reviewer, QA, TechLead, Admin, Security, ReleaseManager)'),
      userId: z.string().optional().describe('User ID to assign the role to'),
      permissions: z.array(z.string()).optional().describe('List of permissions for the role'),
    },
  },
  async ({ action, role, userId, permissions }) => {
    return toContent(await manage_roles({ action, role, userId, permissions }));
  },
);

// ---- Audit Log ----

server.registerTool(
  'query_audit_log',
  {
    description: 'Query audit log entries for a project',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
      userId: z.string().optional().describe('Filter by user ID'),
      action: z.string().optional().describe('Filter by action type'),
      fromDate: z.string().optional().describe('Filter from this date (ISO 8601)'),
      toDate: z.string().optional().describe('Filter to this date (ISO 8601)'),
      limit: z.number().int().min(1).max(100).optional().describe('Maximum number of entries to return'),
    },
  },
  async ({ projectPath, userId, action, fromDate, toDate, limit }) => {
    return toContent(await query_audit_log({ projectPath, userId, action, fromDate, toDate, limit }));
  },
);

// ---- Enterprise Rules ----

server.registerTool(
  'manage_rules',
  {
    description: 'Manage enterprise rule packs (list, add, remove, check)',
    inputSchema: {
      action: z.enum(['list', 'add', 'remove', 'check']).describe('Action to perform on rules'),
      projectPath: z.string().optional().describe('Path to the HarmonyOS project'),
      ruleType: z.enum(['MUST_USE_SDK', 'BAN_PACKAGE', 'BAN_API', 'MUST_USE_COMPONENT', 'MUST_USE_LOGGER', 'ENCRYPT_DATABASE', 'CUSTOM']).optional().describe('Type of rule'),
      ruleConfig: z.string().optional().describe('JSON configuration for the rule'),
    },
  },
  async ({ action, projectPath, ruleType, ruleConfig }) => {
    return toContent(await manage_rules({ action, projectPath, ruleType, ruleConfig }));
  },
);

// ---- Private Capability Graph ----

server.registerTool(
  'manage_private_capability_graph',
  {
    description: 'Manage private SDK capability mappings (list, add, remove, search)',
    inputSchema: {
      action: z.enum(['list', 'add', 'remove', 'search']).describe('Action to perform on capability graph'),
      sourceSDK: z.string().optional().describe('Source SDK API name'),
      targetSDK: z.string().optional().describe('Target HarmonyOS SDK API name'),
      description: z.string().optional().describe('Description of the capability mapping'),
    },
  },
  async ({ action, sourceSDK, targetSDK, description }) => {
    return toContent(await manage_private_capability_graph({ action, sourceSDK, targetSDK, description }));
  },
);

// ---- Custom Recipes ----

server.registerTool(
  'manage_custom_recipes',
  {
    description: 'Manage custom migration recipes (list, add, remove, execute)',
    inputSchema: {
      action: z.enum(['list', 'add', 'remove', 'execute']).describe('Action to perform on recipes'),
      recipeName: z.string().optional().describe('Recipe name'),
      sourceCode: z.string().optional().describe('Source code pattern for the recipe'),
      targetCode: z.string().optional().describe('Target HarmonyOS code for the recipe'),
      description: z.string().optional().describe('Description of the recipe'),
    },
  },
  async ({ action, recipeName, sourceCode, targetCode, description }) => {
    return toContent(await manage_custom_recipes({ action, recipeName, sourceCode, targetCode, description }));
  },
);

// ---- Knowledge Management ----

server.registerTool(
  'record_knowledge',
  {
    description: 'Record migration knowledge from completed projects',
    inputSchema: {
      projectPath: z.string().describe('Path to the project'),
      sourceFramework: z.string().describe('Source framework name'),
      targetFramework: z.string().describe('Target HarmonyOS framework'),
      successfulMappings: z.string().optional().describe('JSON array of successful API mappings'),
      failedMappings: z.string().optional().describe('JSON array of failed API mappings'),
      issuesFound: z.string().optional().describe('JSON array of issues encountered'),
      notes: z.string().optional().describe('Additional notes about the migration'),
    },
  },
  async ({ projectPath, sourceFramework, targetFramework, successfulMappings, failedMappings, issuesFound, notes }) => {
    return toContent(await record_knowledge({ projectPath, sourceFramework, targetFramework, successfulMappings, failedMappings, issuesFound, notes }));
  },
);

server.registerTool(
  'get_knowledge',
  {
    description: 'Retrieve accumulated migration knowledge',
    inputSchema: {
      sourceFramework: z.string().optional().describe('Filter by source framework'),
      targetFramework: z.string().optional().describe('Filter by target framework'),
      query: z.string().optional().describe('Search query for matching knowledge entries'),
      limit: z.number().int().min(1).max(100).optional().describe('Maximum number of entries to return'),
    },
  },
  async ({ sourceFramework, targetFramework, query, limit }) => {
    return toContent(await get_knowledge({ sourceFramework, targetFramework, query, limit }));
  },
);

// ---- Start Server ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[harmony-enterprise-mcp] Server started');
}

main().catch((err) => {
  console.error('[harmony-enterprise-mcp] Fatal error:', err);
  process.exit(1);
});