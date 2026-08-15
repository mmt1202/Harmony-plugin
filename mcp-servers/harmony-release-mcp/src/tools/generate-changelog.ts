import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';
import * as child_process from 'child_process';

/**
 * 从 Git 历史生成变更日志
 * 分析提交记录，生成结构化的发布说明
 */
export async function generateChangelog(
  projectPath: string,
  fromRef?: string,
  toRef?: string,
): Promise<ToolResult<{
  version: string;
  date: string;
  entries: ChangelogEntry[];
  summary: string;
}>> {
  const timer = createTimer();

  try {
    const refRange = buildRefRange(fromRef, toRef);
    const commits = getGitCommits(projectPath, refRange);

    if (commits.length === 0) {
      return {
        success: true,
        data: {
          version: '未知',
          date: new Date().toISOString().split('T')[0],
          entries: [],
          summary: '未找到任何提交记录。',
        },
        duration: timer(),
      };
    }

    const entries = classifyCommits(commits);
    const version = extractVersionFromCommits(commits);
    const summary = buildSummary(entries);

    return {
      success: true,
      data: {
        version,
        date: new Date().toISOString().split('T')[0],
        entries,
        summary,
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Changelog generation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}

interface ChangelogEntry {
  id: string;
  type: 'feat' | 'fix' | 'refactor' | 'docs' | 'style' | 'test' | 'chore' | 'perf' | 'ci' | 'build' | 'other';
  scope?: string;
  message: string;
  author: string;
  hash: string;
  date: string;
}

interface RawCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

function buildRefRange(fromRef?: string, toRef?: string): string {
  if (fromRef && toRef) return `${fromRef}..${toRef}`;
  if (fromRef) return `${fromRef}..HEAD`;
  return 'HEAD~20..HEAD';
}

function getGitCommits(projectPath: string, refRange: string): RawCommit[] {
  try {
    const output = child_process.execSync(
      `git log ${refRange} --format="%H||%an||%aI||%s" --no-merges`,
      {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 10000,
        windowsHide: true,
      },
    );

    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, author, date, ...messageParts] = line.split('||');
        return {
          hash: hash?.substring(0, 8) || '',
          author: author || '未知',
          date: date || '',
          message: messageParts.join('||') || '',
        };
      });
  } catch {
    return [];
  }
}

function classifyCommits(commits: RawCommit[]): ChangelogEntry[] {
  return commits.map(commit => {
    const { type, scope, message } = parseConventionalCommit(commit.message);

    return {
      id: generateId('changelog'),
      type,
      scope,
      message,
      author: commit.author,
      hash: commit.hash,
      date: commit.date,
    };
  });
}

function parseConventionalCommit(raw: string): {
  type: ChangelogEntry['type'];
  scope?: string;
  message: string;
} {
  // 解析 Conventional Commits 格式: type(scope): message
  const conventionalMatch = raw.match(/^(\w+)(?:\(([^)]+)\))?\s*[:：]\s*(.+)$/);

  if (conventionalMatch) {
    const type = conventionalMatch[1].toLowerCase() as ChangelogEntry['type'];
    const scope = conventionalMatch[2] || undefined;
    const message = conventionalMatch[3].trim();

    const validTypes = new Set(['feat', 'fix', 'refactor', 'docs', 'style', 'test', 'chore', 'perf', 'ci', 'build']);
    return {
      type: validTypes.has(type) ? type : 'other',
      scope,
      message,
    };
  }

  // 尝试按前缀分类
  const lowerRaw = raw.toLowerCase();
  if (lowerRaw.startsWith('fix') || lowerRaw.startsWith('修复')) {
    return { type: 'fix', message: raw };
  }
  if (lowerRaw.startsWith('feat') || lowerRaw.startsWith('add') || lowerRaw.startsWith('新增') || lowerRaw.startsWith('添加')) {
    return { type: 'feat', message: raw };
  }
  if (lowerRaw.startsWith('refactor') || lowerRaw.startsWith('重构')) {
    return { type: 'refactor', message: raw };
  }
  if (lowerRaw.startsWith('perf') || lowerRaw.startsWith('优化') || lowerRaw.startsWith('性能')) {
    return { type: 'perf', message: raw };
  }
  if (lowerRaw.startsWith('docs') || lowerRaw.startsWith('文档')) {
    return { type: 'docs', message: raw };
  }
  if (lowerRaw.startsWith('test') || lowerRaw.startsWith('测试')) {
    return { type: 'test', message: raw };
  }

  return { type: 'other', message: raw };
}

function extractVersionFromCommits(commits: RawCommit[]): string {
  // 尝试从提交信息中查找版本标签
  for (const commit of commits) {
    const versionMatch = commit.message.match(/v?(\d+\.\d+\.\d+)/);
    if (versionMatch) return versionMatch[1];
  }
  return '未知';
}

function buildSummary(entries: ChangelogEntry[]): string {
  const typeLabels: Record<string, string> = {
    feat: '新功能',
    fix: '修复',
    refactor: '重构',
    docs: '文档',
    style: '样式',
    test: '测试',
    chore: '杂项',
    perf: '性能优化',
    ci: 'CI/CD',
    build: '构建',
    other: '其他',
  };

  const grouped = new Map<string, ChangelogEntry[]>();
  for (const entry of entries) {
    const existing = grouped.get(entry.type) || [];
    existing.push(entry);
    grouped.set(entry.type, existing);
  }

  const lines: string[] = [];
  for (const [type, items] of grouped) {
    const label = typeLabels[type] || type;
    lines.push(`## ${label} (${items.length})`);
    for (const item of items) {
      const scopeStr = item.scope ? `(${item.scope}) ` : '';
      lines.push(`- ${scopeStr}${item.message}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim() || '无变更记录';
}