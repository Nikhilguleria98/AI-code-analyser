import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { signToken } from '../utils/jwt.js';
import { sanitizeText } from '../utils/security.js';
import Project from '../models/Project.js';
import Report from '../models/Report.js';
import Issue from '../models/Issue.js';

const tokenResponse = (user) => ({
  token: signToken({ id: user._id, role: user.role }),
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl
  }
});

export const register = asyncHandler(async (req, res) => {
  const name = sanitizeText(req.body.name);
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const role = req.body.role === 'admin' ? 'admin' : 'developer';

  if (!name || !email || password.length < 6) {
    throw new ApiError(400, 'Name, email, and a password of at least 6 characters are required');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role
  });

  res.status(201).json(tokenResponse(user));
});

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  res.json(tokenResponse(user));
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const githubCallback = asyncHandler(async (req, res) => {
  const token = signToken({ id: req.user._id, role: req.user.role });
  const redirect = `${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth-success?token=${token}`;
  res.redirect(redirect);
});

export const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get user's projects
  const projects = await Project.find({ user: userId });
  const totalProjects = projects.length;
  const projectIds = projects.map((p) => p._id);

  // Get all reports for user's projects
  const reports = await Report.find({ project: { $in: projectIds } });
  const reportIds = reports.map((r) => r._id);

  // Get all issues from user's projects
  const allIssues = await Issue.find({ report: { $in: reportIds } });
  const totalIssues = allIssues.length;
  const criticalIssues = allIssues.filter((i) => i.severity === 'Critical').length;

  // Calculate average security score
  const avgSecurityScore =
    reports.length > 0
      ? Math.round(reports.reduce((sum, r) => sum + r.summary.securityScore, 0) / reports.length)
      : 100;

  // Get recent activity
  const recentReports = await Report.find({ project: { $in: projectIds } })
    .populate('project', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  const activity = recentReports.map((report) => ({
    action: `Analysis completed for ${report.project.name}`,
    projectName: report.project.name,
    timestamp: report.completedAt || report.createdAt,
    details: `Found ${report.summary.totalIssues} issues (Score: ${report.summary.securityScore}/100)`
  }));

  res.json({
    stats: {
      totalProjects,
      totalIssuesFound: totalIssues,
      avgSecurityScore,
      criticalIssues
    },
    activity
  });
});

export const updateUserPreferences = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { theme, emailNotifications, securityAlerts } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      preferences: {
        theme: theme || 'dark',
        emailNotifications: emailNotifications !== false,
        securityAlerts: securityAlerts !== false
      }
    },
    { new: true }
  );

  res.json({ message: 'Preferences updated', user });
});
