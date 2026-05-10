import fs from 'fs/promises';
import path from 'path';
import { ESLint } from 'eslint';
import { execFile } from 'child_process';

const eslintSolutions = {
  'no-unused-vars': 'Remove the unused variable/import, or use it where the value is needed. If it is intentionally unused, rename it with an underscore prefix and adjust the lint rule.',
  'no-eval': 'Replace eval with a safer parser or a direct function call. Never execute user-controlled strings as code.',
  'no-implied-eval': 'Pass a function reference instead of a string to timers such as setTimeout or setInterval.',
  'no-alert': 'Use an app-level toast, modal, or inline validation message instead of blocking browser alert dialogs.'
};

const mapEslintSeverity = (value) => {
  if (value >= 2) return 'High';
  return 'Medium';
};

const mapSemgrepSeverity = (severity = '') => {
  const normalized = severity.toLowerCase();
  if (normalized === 'error') return 'Critical';
  if (normalized === 'warning') return 'High';
  if (normalized === 'info') return 'Medium';
  return 'Low';
};

export const runEslintAnalysis = async (rootPath, files) => {
  const jsFiles = files
    .filter((file) => ['.js', '.jsx', '.ts', '.tsx'].includes(file.extension))
    .map((file) => file.absolutePath);

  if (!jsFiles.length) {
    return [];
  }

  const eslint = new ESLint({
    cwd: rootPath,
    overrideConfig: {
      languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      rules: {
        'no-unused-vars': 'warn',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-alert': 'warn'
      }
    },
    overrideConfigFile: true,
    ignore: true
  });

  const results = await eslint.lintFiles(jsFiles);

  return results.flatMap((result) =>
    result.messages.map((message) => ({
      file: path.relative(rootPath, result.filePath).split(path.sep).join('/'),
      line: message.line || 1,
      column: message.column || 1,
      endLine: message.endLine || message.line || 1,
      endColumn: message.endColumn || message.column || 120,
      issue: message.message,
      errorType: message.ruleId || 'ESLint rule violation',
      severity: mapEslintSeverity(message.severity),
      fixSuggestion:
        eslintSolutions[message.ruleId] ||
        `Fix the ${message.ruleId || 'reported'} rule by changing the highlighted code to match the expected JavaScript pattern.`,
      source: 'eslint',
      ruleId: message.ruleId || ''
    }))
  );
};

export const runSemgrepAnalysis = async (rootPath) =>
  new Promise((resolve, reject) => {
    execFile(
      'semgrep',
      ['scan', '--config', 'auto', '--json', rootPath],
      { cwd: rootPath, maxBuffer: 1024 * 1024 * 20 },
      (error, stdout, stderr) => {
        if (error) {
          if (stderr?.includes('command not found') || error.code === 'ENOENT') {
            resolve([]);
            return;
          }

          if ((stdout || '').trim()) {
            try {
              const parsed = JSON.parse(stdout);
              const issues = (parsed.results || []).map((result) => ({
                file: path.relative(rootPath, result.path).split(path.sep).join('/'),
                line: result.start?.line || 1,
                column: result.start?.col || 1,
                endLine: result.end?.line || result.start?.line || 1,
                endColumn: result.end?.col || result.start?.col || 120,
                issue: result.extra?.message || 'Semgrep detected a security issue.',
                errorType: result.check_id || 'Semgrep security finding',
                severity: mapSemgrepSeverity(result.extra?.severity),
                fixSuggestion:
                  result.extra?.metadata?.fix ||
                  result.extra?.fix ||
                  'Review the highlighted vulnerable pattern, validate all external input, and replace it with the safer API recommended by the rule.',
                source: 'semgrep',
                ruleId: result.check_id || ''
              }));

              resolve(issues);
              return;
            } catch (_parseError) {
              reject(new Error(stderr || error.message));
              return;
            }
          }

          reject(new Error(stderr || error.message));
          return;
        }

        try {
          const parsed = JSON.parse(stdout || '{}');
          const issues = (parsed.results || []).map((result) => ({
            file: path.relative(rootPath, result.path).split(path.sep).join('/'),
            line: result.start?.line || 1,
            column: result.start?.col || 1,
            endLine: result.end?.line || result.start?.line || 1,
            endColumn: result.end?.col || result.start?.col || 120,
            issue: result.extra?.message || 'Semgrep detected a security issue.',
            errorType: result.check_id || 'Semgrep security finding',
            severity: mapSemgrepSeverity(result.extra?.severity),
            fixSuggestion:
              result.extra?.metadata?.fix ||
              result.extra?.fix ||
              'Review the highlighted vulnerable pattern, validate all external input, and replace it with the safer API recommended by the rule.',
            source: 'semgrep',
            ruleId: result.check_id || ''
          }));

          resolve(issues);
        } catch (parseError) {
          if ((stdout || '').trim() === '') {
            resolve([]);
            return;
          }

          reject(parseError);
        }
      }
    );
  });

export const collectSnippetsForAi = async (rootPath, files, staticIssues) => {
  const targetFiles = files.filter((file) => ['.js', '.jsx', '.ts', '.tsx'].includes(file.extension)).slice(0, 8);

  const snippets = await Promise.all(
    targetFiles.map(async (file) => ({
      file: file.relativePath,
      content: (await fs.readFile(file.absolutePath, 'utf8')).slice(0, 5000),
      existingIssues: staticIssues.filter((issue) => issue.file === file.relativePath).slice(0, 10)
    }))
  );

  return snippets;
};
