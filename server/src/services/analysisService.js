import Project from '../models/Project.js';
import Report from '../models/Report.js';
import { traverseProject } from './fileService.js';
import { collectSnippetsForAi, runEslintAnalysis, runSemgrepAnalysis } from './staticAnalysisService.js';
import { runAiAnalysis } from './aiService.js';
import { deduplicateIssues, persistReport } from './reportService.js';
import { parse } from "@babel/parser";
import { readFileContent } from "./fileService.js";

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

    const issues = deduplicateIssues([...allIssues, ...eslintIssues, ...semgrepIssues, ...aiIssues]);
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
  const issues = [];

  try {
    parse(code, {
      sourceType: "module",
      plugins: ["jsx"]
    });
  } catch (err) {
    issues.push({
      file: filePath,
      issue: err.message,
      line: err.loc?.line || 0,
      severity: "High",
      source: "syntax",
      fixSuggestion: "Check syntax error and fix the code accordingly."
    });
  }

  return issues;
};

