import Issue from '../models/Issue.js';
import Report from '../models/Report.js';
import Project from '../models/Project.js';
import { SEVERITY_ORDER } from '../constants/analysis.js';

const severityWeight = {
  Low: 5,
  Medium: 12,
  High: 20,
  Critical: 30
};

export const deduplicateIssues = (issues) => {
  const seen = new Map();

  issues.forEach((issue) => {
    if (!issue?.file || !issue?.issue) {
      return;
    }

    const key = `${issue.file}:${issue.line || 1}:${issue.issue.toLowerCase()}`;
    const existing = seen.get(key);

    if (!existing || SEVERITY_ORDER.indexOf(issue.severity) > SEVERITY_ORDER.indexOf(existing.severity)) {
      seen.set(key, issue);
    }
  });

  return [...seen.values()];
};

const normalizeIssue = (issue) => {
  const line = Number(issue.line) || 1;
  const column = Number(issue.column) || 1;

  return {
    file: issue.file,
    line,
    column,
    endLine: Number(issue.endLine) || line,
    endColumn: Number(issue.endColumn) || column + 1,
    issue: issue.issue,
    errorType: issue.errorType || issue.ruleId || `${issue.source || 'analysis'} issue`,
    severity: ['Low', 'Medium', 'High', 'Critical'].includes(issue.severity) ? issue.severity : 'Medium',
    fixSuggestion: issue.fixSuggestion || 'Review the highlighted code and apply the recommended safer or cleaner pattern.',
    source: ['syntax', 'runtime', 'eslint', 'semgrep', 'ai'].includes(issue.source) ? issue.source : 'ai',
    ruleId: issue.ruleId || ''
  };
};

export const summarizeIssues = (issues) => {
  const bySeverity = {
    Low: 0,
    Medium: 0,
    High: 0,
    Critical: 0
  };

  issues.forEach((issue) => {
    bySeverity[issue.severity] += 1;
  });

  const penalty = issues.reduce((sum, issue) => sum + severityWeight[issue.severity], 0);
  const securityScore = Math.max(0, 100 - penalty);

  return {
    totalIssues: issues.length,
    bySeverity,
    securityScore
  };
};

export const persistReport = async ({ reportId, projectId, issues }) => {
  const normalizedIssues = deduplicateIssues(issues).map(normalizeIssue);
  const summary = summarizeIssues(normalizedIssues);

  const report = await Report.findByIdAndUpdate(
    reportId,
    {
      summary,
      status: 'completed',
      completedAt: new Date()
    },
    { new: true }
  );

  if (!report) {
    throw new Error('Active report not found');
  }

  await Issue.deleteMany({ report: report._id });

  if (normalizedIssues.length) {
    await Issue.insertMany(
      normalizedIssues.map((issue) => ({
        ...issue,
        report: report._id,
        project: projectId
      })),
      { ordered: false }
    ).catch(() => {});
  }

  await Project.findByIdAndUpdate(projectId, {
    latestReport: report._id,
    lastAnalyzedAt: new Date(),
    status: 'ready'
  });

  return report;
};
