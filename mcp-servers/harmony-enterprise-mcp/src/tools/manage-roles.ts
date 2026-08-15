import type { ToolResult, EnterpriseRole, RoleManagementResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

// In-memory role database with predefined roles
const predefinedRoles: EnterpriseRole[] = [
  {
    id: 'role-dev',
    name: 'Developer',
    permissions: ['read', 'write', 'build', 'test'],
    description: 'Standard developer with code access',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role-reviewer',
    name: 'Reviewer',
    permissions: ['read', 'review', 'approve'],
    description: 'Code reviewer with approval rights',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role-qa',
    name: 'QA',
    permissions: ['read', 'test', 'report', 'block_release'],
    description: 'Quality assurance engineer',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role-techlead',
    name: 'TechLead',
    permissions: ['read', 'write', 'build', 'test', 'review', 'approve', 'merge'],
    description: 'Technical lead with merge authority',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role-admin',
    name: 'Admin',
    permissions: ['read', 'write', 'build', 'test', 'deploy', 'manage_roles', 'manage_rules'],
    description: 'Full system administrator',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role-security',
    name: 'Security',
    permissions: ['read', 'audit', 'scan', 'report', 'block_release'],
    description: 'Security auditor with scanning capabilities',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'role-release',
    name: 'ReleaseManager',
    permissions: ['read', 'build', 'test', 'deploy', 'sign', 'publish'],
    description: 'Release manager with deployment and publishing rights',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

// Dynamic roles added during runtime
const dynamicRoles: EnterpriseRole[] = [];

function getAllRoles(): EnterpriseRole[] {
  return [...predefinedRoles, ...dynamicRoles];
}

export async function manage_roles(params: {
  action: string;
  role?: string;
  userId?: string;
  permissions?: string[];
}): Promise<ToolResult<RoleManagementResult>> {
  const done = createTimer();
  const { action, role, userId, permissions } = params;

  try {
    const allRoles = getAllRoles();

    switch (action) {
      case 'list': {
        const result: RoleManagementResult = {
          action: 'list',
          roles: allRoles,
          message: `Found ${allRoles.length} role(s)`,
        };
        return {
          success: true,
          data: result,
          duration: done(),
        };
      }

      case 'add': {
        if (!role) {
          return {
            success: false,
            error: 'Role name is required for add action',
            duration: done(),
          };
        }

        const existing = allRoles.find(
          (r) => r.name.toLowerCase() === role.toLowerCase()
        );
        if (existing) {
          return {
            success: false,
            error: `Role "${role}" already exists`,
            duration: done(),
          };
        }

        const newRole: EnterpriseRole = {
          id: `role-${role.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          name: role,
          permissions: permissions || [],
          description: `Custom role: ${role}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        dynamicRoles.push(newRole);

        const result: RoleManagementResult = {
          action: 'add',
          role: newRole,
          roles: getAllRoles(),
          message: `Role "${role}" created successfully`,
        };

        return {
          success: true,
          data: result,
          duration: done(),
        };
      }

      case 'remove': {
        if (!role) {
          return {
            success: false,
            error: 'Role name is required for remove action',
            duration: done(),
          };
        }

        const predefined = predefinedRoles.find(
          (r) => r.name.toLowerCase() === role.toLowerCase()
        );
        if (predefined) {
          return {
            success: false,
            error: `Cannot remove predefined role "${role}". Only custom roles can be removed.`,
            duration: done(),
          };
        }

        const idx = dynamicRoles.findIndex(
          (r) => r.name.toLowerCase() === role.toLowerCase()
        );
        if (idx === -1) {
          return {
            success: false,
            error: `Role "${role}" not found`,
            duration: done(),
          };
        }

        const removed = dynamicRoles.splice(idx, 1)[0];

        const result: RoleManagementResult = {
          action: 'remove',
          role: removed,
          roles: getAllRoles(),
          message: `Role "${role}" removed successfully`,
        };

        return {
          success: true,
          data: result,
          duration: done(),
        };
      }

      case 'update': {
        if (!role) {
          return {
            success: false,
            error: 'Role name is required for update action',
            duration: done(),
          };
        }

        if (!permissions || permissions.length === 0) {
          return {
            success: false,
            error: 'Permissions array is required for update action',
            duration: done(),
          };
        }

        // Try to find in predefined first
        const predefined = predefinedRoles.find(
          (r) => r.name.toLowerCase() === role.toLowerCase()
        );
        if (predefined) {
          predefined.permissions = permissions;
          predefined.updatedAt = new Date().toISOString();

          const result: RoleManagementResult = {
            action: 'update',
            role: predefined,
            roles: getAllRoles(),
            message: `Role "${role}" permissions updated to: ${permissions.join(', ')}`,
          };

          return {
            success: true,
            data: result,
            duration: done(),
          };
        }

        // Try dynamic roles
        const dynamic = dynamicRoles.find(
          (r) => r.name.toLowerCase() === role.toLowerCase()
        );
        if (dynamic) {
          dynamic.permissions = permissions;
          dynamic.updatedAt = new Date().toISOString();

          const result: RoleManagementResult = {
            action: 'update',
            role: dynamic,
            roles: getAllRoles(),
            message: `Role "${role}" permissions updated to: ${permissions.join(', ')}`,
          };

          return {
            success: true,
            data: result,
            duration: done(),
          };
        }

        return {
          success: false,
          error: `Role "${role}" not found`,
          duration: done(),
        };
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Valid actions: list, add, remove, update`,
          duration: done(),
        };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      duration: done(),
    };
  }
}