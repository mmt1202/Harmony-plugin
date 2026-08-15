import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { scanSecret } from "./tools/scan-secret.js";
import { scanPermission } from "./tools/scan-permission.js";
import { scanSecurity } from "./tools/scan-security.js";
import { auditPrivacy } from "./tools/audit-privacy.js";
import { checkEncryption } from "./tools/check-encryption.js";
import { generateSBOM } from "./tools/generate-sbom.js";
import { configureDataBoundary, checkDataBoundary } from "./tools/data-boundary.js";
import { auditSupplyChain } from "./tools/supply-chain-security.js";

const server = new McpServer({
  name: "harmony-security-mcp",
  version: "0.1.0",
});

/**
 * 将 ToolResult 包装为 MCP CallToolResult 格式
 */
function toContent(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

// ---- 工具注册 ----

server.registerTool(
  "scan_secret",
  {
    description: "Scan source code for hardcoded secrets including API keys, passwords, tokens, private keys, and certificates. Returns a SecretScanResult with location, pattern, and masked value of each finding.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      excludePatterns: z.array(z.string()).optional().describe("Glob patterns to exclude from scanning"),
    },
  },
  async ({ projectPath, excludePatterns }) => {
    return toContent(await scanSecret(projectPath, { excludePatterns }));
  },
);

server.registerTool(
  "scan_permission",
  {
    description: "Audit permissions declared in module.json5 against actual usage in code. Identifies unused permissions, missing declarations, and high-risk permissions. Returns a PermissionAudit with score and recommendations.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await scanPermission(projectPath));
  },
);

server.registerTool(
  "scan_security",
  {
    description: "General security vulnerability scan. Checks for insecure HTTP, cleartext traffic, debug mode, WebView risks, SQL injection, command injection, XSS, and more. Returns SecurityScanResult[] with findings and CWE references.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      categories: z.array(z.enum(["SECRET", "PERMISSION", "VULNERABILITY", "PRIVACY", "ENCRYPTION", "NETWORK", "STORAGE"])).optional().describe("Filter by specific security categories"),
    },
  },
  async ({ projectPath, categories }) => {
    return toContent(await scanSecurity(projectPath, { categories }));
  },
);

server.registerTool(
  "audit_privacy",
  {
    description: "Audit privacy compliance. Checks for personal data collection (phone, email, location, biometrics, etc.), data encryption, privacy policy references, and user consent mechanisms. Returns privacy audit with overall score.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await auditPrivacy(projectPath));
  },
);

server.registerTool(
  "check_encryption",
  {
    description: "Verify encryption algorithm usage. Identifies weak algorithms (MD5, DES, RC4, SHA-1, ECB mode), checks for hardcoded keys, static IVs, and weak random generators. Also audits Huks key management. Returns encryption audit with score.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await checkEncryption(projectPath));
  },
);

server.registerTool(
  "generate_sbom",
  {
    description: "Generate a Software Bill of Materials (SBOM). Scans dependencies from oh-package.json5 and package.json, includes license information, known vulnerabilities, and supplier details. Supports CycloneDX and SPDX formats.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      format: z.enum(["CycloneDX", "SPDX"]).optional().describe("SBOM output format (default: CycloneDX)"),
      includeDevDependencies: z.boolean().optional().describe("Include devDependencies (default: true)"),
    },
  },
  async ({ projectPath, format, includeDevDependencies }) => {
    return toContent(await generateSBOM(projectPath, { format, includeDevDependencies }));
  },
);

server.registerTool(
  "configure_data_boundary",
  {
    description: "Configure data boundary rules for local-only mode. Define which types of data can or cannot be sent to cloud services, with enforcement levels (STRICT/WARN/AUDIT).",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      localOnly: z.boolean().optional().describe("Enable local-only data boundary mode"),
      enforcementLevel: z.enum(["STRICT", "WARN", "AUDIT"]).optional().describe("Enforcement level: STRICT (block), WARN (warn), AUDIT (log only)"),
      allowCloud: z.array(z.string()).optional().describe("Data types explicitly allowed to cloud"),
      denyCloud: z.array(z.string()).optional().describe("Data types explicitly denied to cloud"),
    },
  },
  async ({ projectPath, localOnly, enforcementLevel, allowCloud, denyCloud }) => {
    const config: Record<string, unknown> = {};
    if (localOnly !== undefined) config.localOnly = localOnly;
    if (enforcementLevel !== undefined) config.enforcementLevel = enforcementLevel;
    if (allowCloud !== undefined) config.allowCloud = allowCloud;
    if (denyCloud !== undefined) config.denyCloud = denyCloud;
    return toContent(await configureDataBoundary(projectPath, config));
  },
);

server.registerTool(
  "check_data_boundary",
  {
    description: "Check whether a specific data type/category can be sent to cloud based on configured data boundary rules.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      dataType: z.string().describe("The data type to check"),
      category: z.enum(["DOCS", "PACKAGE_META", "MAPPING", "SOURCE", "LOGS", "CUSTOMER_DATA", "CREDENTIALS"]).describe("Category of the data to check"),
    },
  },
  async ({ projectPath, dataType, category }) => {
    return toContent(await checkDataBoundary(projectPath, dataType, category));
  },
);

server.registerTool(
  "audit_supply_chain",
  {
    description: "Supply chain security audit: checks package trust, maintenance status, license compliance, known vulnerabilities, and typosquatting risks for all dependencies.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await auditSupplyChain(projectPath));
  },
);

// ---- 启动服务器 ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-security-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting harmony-security-mcp:", err);
  process.exit(1);
});