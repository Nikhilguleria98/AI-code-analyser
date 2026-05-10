import Project from '../models/Project.js';
import Report from '../models/Report.js';
import { traverseProject } from './fileService.js';
import { collectSnippetsForAi, runEslintAnalysis, runSemgrepAnalysis } from './staticAnalysisService.js';
import { runAiAnalysis } from './aiService.js';
import { persistReport } from './reportService.js';
import { parse } from "@babel/parser";
import { readFileContent } from "./fileService.js";

const getSyntaxPlugins = (filePath) => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  const plugins = ['jsx'];

  if (extension === 'ts' || extension === 'tsx') {
    plugins.push('typescript');
  }

  return plugins;
};

const syntaxFixSuggestion = (message = '') => {
  const normalized = message.toLowerCase();

  if (normalized.includes('unterminated string')) {
    return 'Close the string with the matching quote and escape any quote characters that belong inside the text.';
  }

  if (normalized.includes('unexpected token')) {
    return 'Check the highlighted token for a missing comma, bracket, parenthesis, or invalid syntax before this line.';
  }

  if (normalized.includes('missing semicolon')) {
    return 'Add the missing semicolon or fix the statement boundary around the highlighted line.';
  }

  if (normalized.includes('expected corresponding jsx closing tag')) {
    return 'Add the missing JSX closing tag or rename the closing tag so it matches the opening tag.';
  }

  return 'Fix the syntax at the highlighted location, then run the analysis again to reveal any deeper issues.';
};

const keywordTypos = [
  {
    pattern: /\bfunctiom\b/g,
    errorType: 'Misspelled keyword',
    issue: 'Unknown keyword "functiom". Did you mean "function"?',
    fixSuggestion: 'Replace "functiom" with the JavaScript keyword "function".'
  },
  {
    pattern: /\bfuntion\b/g,
    errorType: 'Misspelled keyword',
    issue: 'Unknown keyword "funtion". Did you mean "function"?',
    fixSuggestion: 'Replace "funtion" with the JavaScript keyword "function".'
  },
  {
    pattern: /\bfunctio\b/g,
    errorType: 'Misspelled keyword',
    issue: 'Unknown keyword "functio". Did you mean "function"?',
    fixSuggestion: 'Replace "functio" with the JavaScript keyword "function".'
  },
  {
    pattern: /\bcosnt\b/g,
    errorType: 'Misspelled keyword',
    issue: 'Unknown keyword "cosnt". Did you mean "const"?',
    fixSuggestion: 'Replace "cosnt" with the JavaScript keyword "const".'
  },
  {
    pattern: /\bletst\b/g,
    errorType: 'Misspelled keyword',
    issue: 'Unknown keyword "letst". Did you mean "let"?',
    fixSuggestion: 'Replace "letst" with the JavaScript keyword "let".'
  }
];

const getLineColumn = (code, index) => {
  const before = code.slice(0, index);
  const lines = before.split('\n');

  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
};

const detectKeywordTypos = (code, filePath) =>
  keywordTypos.flatMap((typo) => {
    const issues = [];
    let match;

    typo.pattern.lastIndex = 0;
    while ((match = typo.pattern.exec(code)) !== null) {
      const location = getLineColumn(code, match.index);
      issues.push({
        file: filePath,
        line: location.line,
        column: location.column,
        endLine: location.line,
        endColumn: location.column + match[0].length,
        issue: typo.issue,
        errorType: typo.errorType,
        severity: 'High',
        source: 'syntax',
        ruleId: 'keyword-typo',
        fixSuggestion: typo.fixSuggestion
      });
    }

    return issues;
  });

const detectMissingReturnIssues = (code, filePath) => {
  const issues = [];
  const functionPattern = /\b(function|functio|functiom|funtion)\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{([^{}]*)\}/g;
  let match;

  while ((match = functionPattern.exec(code)) !== null) {
    const body = match[4].trim();

    if (!body || /\breturn\b/.test(body)) {
      continue;
    }

    const statements = body
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean);
    const lastStatement = statements[statements.length - 1] || '';
    const looksLikeComputedValue = /^[\w$.\s()+\-*/%]+$/.test(lastStatement) && /[+\-*/%]/.test(lastStatement);

    if (!looksLikeComputedValue) {
      continue;
    }

    const expressionIndex = code.indexOf(lastStatement, match.index);
    const location = getLineColumn(code, expressionIndex);

    issues.push({
      file: filePath,
      line: location.line,
      column: location.column,
      endLine: location.line,
      endColumn: location.column + lastStatement.length,
      issue: `Function "${match[2]}" calculates "${lastStatement}" but does not return it.`,
      errorType: 'Missing return statement',
      severity: 'Medium',
      source: 'ai',
      ruleId: 'missing-return',
      fixSuggestion: `Add "return ${lastStatement};" inside the function so callers receive the calculated value.`
    });
  }

  return issues;
};

export const analyzeProject = async ({ project, userId, io }) => {
  const report = await Report.create({
    project: project._id,
    createdBy: userId,
    status: 'running',
    startedAt: new Date()
  });

  const channel = `project:${project._id}`;
  const emitProgress = (step, progress) => {
    io.to(channel).emit('analysis:progress', {
      projectId: String(project._id),
      reportId: String(report._id),
      step,
      progress
    });
  };

  const files = await traverseProject(project.rootPath);
  let allIssues = [];

  for (const file of files) {
    // analyze only JS/TS files
    if (!file.relativePath.match(/\.(js|jsx|ts|tsx)$/)) continue;

    const code = await readFileContent(project.rootPath, file.relativePath);

    const issues = analyzeFile(code, file.relativePath);
    allIssues.push(...issues);
  }

  console.log("Detected issues:", allIssues);

  // Save issues to DB if needed

  

  try {
    await Project.findByIdAndUpdate(project._id, { status: 'analyzing' });

    emitProgress('Scanning files', 15);
    const files = await traverseProject(project.rootPath);
    await Project.findByIdAndUpdate(project._id, { fileCount: files.length });

    emitProgress('Running ESLint', 35);
    const eslintIssues = await runEslintAnalysis(project.rootPath, files);

    emitProgress('Running Semgrep', 55);
    const semgrepIssues = await runSemgrepAnalysis(project.rootPath);

    emitProgress('Preparing AI review', 70);
    const snippets = await collectSnippetsForAi(project.rootPath, files, [...eslintIssues, ...semgrepIssues]);

    emitProgress('Running AI analysis', 85);
    const aiIssues = await runAiAnalysis(snippets);

    const issues = [...allIssues, ...eslintIssues, ...semgrepIssues, ...aiIssues];
    const completed = await persistReport({ reportId: report._id, projectId: project._id, issues });

    emitProgress('Completed', 100);
    io.to(channel).emit('analysis:completed', {
      projectId: String(project._id),
      reportId: String(completed._id),
      summary: completed.summary
    });

    return completed;
  } catch (error) {
    await Report.findByIdAndUpdate(report._id, {
      status: 'failed',
      errorMessage: error.message,
      completedAt: new Date()
    });

    await Project.findByIdAndUpdate(project._id, { status: 'failed' });
    io.to(channel).emit('analysis:failed', {
      projectId: String(project._id),
      reportId: String(report._id),
      message: error.message
    });
    throw error;
  }
};

export const analyzeFile = (code, filePath) => {
  const issues = detectKeywordTypos(code, filePath);
  const missingReturnIssues = detectMissingReturnIssues(code, filePath);

  if (issues.length) {
    return [...issues, ...missingReturnIssues];
  }

  try {
    parse(code, {
      sourceType: "module",
      errorRecovery: false,
      plugins: getSyntaxPlugins(filePath)
    });
  } catch (err) {
    issues.push({
      file: filePath,
      issue: err.message,
      line: err.loc?.line || 1,
      column: err.loc?.column ? err.loc.column + 1 : 1,
      endLine: err.loc?.line || 1,
      endColumn: err.loc?.column ? err.loc.column + 2 : 120,
      errorType: err.reasonCode || 'Syntax error',
      severity: "High",
      source: "syntax",
      ruleId: err.reasonCode || 'syntax-error',
      fixSuggestion: syntaxFixSuggestion(err.message)
    });
  }

  return [...issues, ...missingReturnIssues];
};
