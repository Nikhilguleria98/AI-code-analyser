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
    const key = `${issue.file}:${issue.line}:${issue.issue.toLowerCase()}`;
    const existing = seen.get(key);

    if (!existing || SEVERITY_ORDER.indexOf(issue.severity) > SEVERITY_ORDER.indexOf(existing.severity)) {
      seen.set(key, issue);
    }
  });

  return [...seen.values()];
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
  const summary = summarizeIssues(issues);

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

  if (issues.length) {
    await Issue.insertMany(
      issues.map((issue) => ({
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
