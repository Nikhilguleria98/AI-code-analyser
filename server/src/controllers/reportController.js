import Report from '../models/Report.js';
import Project from '../models/Project.js';
import Issue from '../models/Issue.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const getReports = asyncHandler(async (req, res) => {
  const projectIds = await Project.find({ user: req.user._id }).distinct('_id');
  const reports = await Report.find({ project: { $in: projectIds } })
    .populate('project', 'name sourceType githubUrl')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ reports });
});

export const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.reportId)
    .populate('project', 'name sourceType githubUrl')
    .lean();

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  const project = await Project.findOne({ _id: report.project._id, user: req.user._id });
  if (!project) {
    throw new ApiError(403, 'Forbidden');
  }

  res.json({ report });
});

export const getIssuesByReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.reportId).lean();
  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  const project = await Project.findOne({ _id: report.project, user: req.user._id });
  if (!project) {
    throw new ApiError(403, 'Forbidden');
  }

  const query = { report: report._id };
  if (req.query.file) {
    query.file = req.query.file;
  }

  const issues = await Issue.find(query).sort({ severity: -1, file: 1, line: 1 }).lean();
  res.json({ issues });
});

export const getUserIssues = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get all projects for the user
  const projects = await Project.find({ user: userId }).select('_id');
  const projectIds = projects.map((p) => p._id);

  // Get all reports for user's projects
  const reports = await Report.find({ project: { $in: projectIds } }).select('_id');
  const reportIds = reports.map((r) => r._id);

  // Get all issues from user's reports, sorted by severity
  const issues = await Issue.find({ report: { $in: reportIds } })
    .populate('report', 'project')
    .sort({ severity: -1, createdAt: -1 })
    .lean();

  res.json({ issues });
});
