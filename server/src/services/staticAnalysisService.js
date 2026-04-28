import fs from 'fs/promises';
import path from 'path';
import { ESLint } from 'eslint';
import { execFile } from 'child_process';

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
      issue: message.message,
      severity: mapEslintSeverity(message.severity),
      fixSuggestion: `Review ESLint rule ${message.ruleId || 'unknown'} and refactor the code accordingly.`,
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
                issue: result.extra?.message || 'Semgrep detected a security issue.',
                severity: mapSemgrepSeverity(result.extra?.severity),
                fixSuggestion:
                  result.extra?.metadata?.fix || 'Review the vulnerable pattern and apply a safer alternative.',
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
            issue: result.extra?.message || 'Semgrep detected a security issue.',
            severity: mapSemgrepSeverity(result.extra?.severity),
            fixSuggestion: result.extra?.metadata?.fix || 'Review the vulnerable pattern and apply a safer alternative.',
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
