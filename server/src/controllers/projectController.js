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
import { analyzeFile, analyzeProject } from '../services/analysisService.js';
import { runPastedJavaScript } from '../services/executionService.js';
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

 try {
  analyzeProject({
    project,
    userId: req.user._id,
    io: req.app.get('io')
  }).catch((err) => {
    console.error('Async Analysis Error:', err);
  });
} catch (err) {
  console.error('Trigger Error:', err);
  throw new ApiError(500, 'Failed to start analysis');
}

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
  const project = await Project.findOne({
    _id: req.params.projectId,
    user: req.user._id
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const normalizePath = (p) => p.replace(/\\/g, "/").trim();

  const relativePath = normalizePath(String(req.query.path || ''));

  if (!relativePath) {
    throw new ApiError(400, 'File path is required');
  }

  const content = await readFileContent(project.rootPath, relativePath);

  const latestReport = await Report.findById(project.latestReport);

  let issues = [];

  if (latestReport) {
    issues = await Issue.find({
      report: latestReport._id,
      file: relativePath
    })
      .sort({ line: 1 })
      .lean();
  }

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
  let execution = {
    status: 'skipped',
    output: [],
    result: '',
    error: ''
  };

  if (language === 'javascript' || language === 'jsx' || language === 'typescript' || language === 'tsx') {
    const filePath = 'pasted-code.' + (language.startsWith('java') ? 'js' : 'ts');
    issues = analyzeFile(code, filePath);

    if (issues.length === 0 && (language === 'javascript' || language === 'jsx')) {
      execution = runPastedJavaScript(code, filePath);

      if (execution.status === 'error') {
        issues.push({
          file: filePath,
          issue: execution.error,
          line: execution.line || 1,
          column: execution.column || 1,
          endLine: execution.line || 1,
          endColumn: (execution.column || 1) + 1,
          severity: 'High',
          source: 'runtime',
          errorType: 'Runtime error',
          ruleId: 'runtime-error',
          fixSuggestion: 'Fix the runtime exception shown in the output panel, then run the code again.'
        });
      }
    } else if (issues.length > 0) {
      execution = {
        status: 'skipped',
        output: [],
        result: '',
        error: 'Code was not executed because analysis found errors first.'
      };
    } else {
      execution = {
        status: 'skipped',
        output: [],
        result: '',
        error: 'Execution is currently available for pasted JavaScript only.'
      };
    }
  }

  res.json({ issues, execution });
});
