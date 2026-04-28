import fs from 'fs/promises';
import Project from '../models/Project.js';
import Report from '../models/Report.js';
import Issue from '../models/Issue.js';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { isSafeGithubUrl, sanitizeText } from '../utils/security.js';
import { createProjectWorkspace, extractZipToWorkspace, readFileContent, saveUploadedFileToWorkspace, traverseProject } from '../services/fileService.js';
import { cloneRepository } from '../services/gitService.js';
import { analyzeFile } from '../services/analysisService.js';
import { buildTree } from '../utils/fileTree.js';

export const uploadProject = asyncHandler(async (req, res) => {
  const { githubUrl, name } = req.body;
  const projectName = sanitizeText(name || 'Uploaded Project');
  let rootPath = '';
  let sourceType = 'upload';

  if (githubUrl) {
    if (!isSafeGithubUrl(githubUrl)) {
      throw new ApiError(400, 'Only valid GitHub repository URLs are allowed');
    }
    sourceType = 'github';
    rootPath = await cloneRepository(githubUrl, projectName);
  } else {
    if (!req.file) {
      throw new ApiError(400, 'Provide a file or a GitHub repository URL');
    }
    const workspace = await createProjectWorkspace(projectName);
    const extension = path.extname(req.file.originalname).toLowerCase();
    rootPath =
      extension === '.zip'
        ? await extractZipToWorkspace(req.file.path, workspace)
        : await saveUploadedFileToWorkspace(req.file.path, req.file.originalname, workspace);
    await fs.unlink(req.file.path).catch(() => {});
  }

  const files = await traverseProject(rootPath);

  const project = await Project.create({
    name: projectName,
    user: req.user._id,
    sourceType,
    githubUrl: githubUrl || '',
    rootPath,
    status: 'ready',
    fileCount: files.length
  });

  res.status(201).json({
    project: {
      id: project._id,
      name: project.name,
      sourceType: project.sourceType,
      githubUrl: project.githubUrl,
      status: project.status,
      fileCount: project.fileCount,
      createdAt: project.createdAt
    }
  });
});

export const triggerAnalysis = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.body.projectId, user: req.user._id });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  analyzeProject({ project, userId: req.user._id, io: req.app.get('io') }).catch(() => {});

  res.status(202).json({ message: 'Analysis started', projectId: project._id });
});

export const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ projects });
});

export const getProjectFiles = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const files = await traverseProject(project.rootPath);
  res.json({
    tree: buildTree(files.map((file) => file.relativePath)),
    files
  });
});

export const getProjectFileContent = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const relativePath = String(req.query.path || '');
  if (!relativePath) {
    throw new ApiError(400, 'File path is required');
  }

  const content = await readFileContent(project.rootPath, relativePath);
  const latestReport = await Report.findById(project.latestReport);
  const issues = latestReport
    ? await Issue.find({ report: latestReport._id, file: relativePath }).sort({ line: 1 }).lean()
    : [];

  res.json({
    file: relativePath,
    content,
    issues
  });
});

export const analyzePastedCode = asyncHandler(async (req, res) => {
  const { code, language = 'javascript' } = req.body;

  if (!code) {
    throw new ApiError(400, 'Code is required');
  }

  let issues = [];

  if (language === 'javascript' || language === 'jsx' || language === 'typescript' || language === 'tsx') {
    issues = analyzeFile(code, 'pasted-code.' + (language.startsWith('java') ? 'js' : 'ts'));
  }

  // For now, only syntax analysis for pasted code. Could extend to ESLint etc. later.

  res.json({ issues });
});
