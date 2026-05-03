import fsSync from 'fs';
import fs from 'fs/promises';
import path from 'path';
import unzipper from 'unzipper';
import sanitizeFilename from 'sanitize-filename';
import { BINARY_EXTENSIONS, FILE_CLASSIFICATIONS, IGNORED_DIRECTORIES } from '../constants/analysis.js';

const isTextFile = (entryPath) => !BINARY_EXTENSIONS.has(path.extname(entryPath).toLowerCase());

export const createProjectWorkspace = async (projectName) => {
  const safeName = sanitizeFilename(projectName.toLowerCase().replace(/\s+/g, '-')) || 'project';
  const folder = path.join(process.cwd(), 'workspaces', `${Date.now()}-${safeName}`);
  await fs.mkdir(folder, { recursive: true });
  return folder;
};

export const extractZipToWorkspace = async (zipPath, workspace) => {
  await fsSync.createReadStream(zipPath).pipe(unzipper.Extract({ path: workspace })).promise();
  return workspace;
};

export const saveUploadedFileToWorkspace = async (filePath, originalName, workspace) => {
  const safeName = sanitizeFilename(originalName) || 'uploaded-file';
  const destination = path.join(workspace, safeName);
  await fs.copyFile(filePath, destination);
  return workspace;
};

export const traverseProject = async (rootDir) => {
  const files = [];

  const walk = async (currentDir) => {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolute = path.join(currentDir, entry.name);
      const relative = path.relative(rootDir, absolute);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          await walk(absolute);
        }
        continue;
      }

      if (!isTextFile(entry.name)) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      files.push({
        name: entry.name,
        absolutePath: absolute,
        relativePath: relative.split(path.sep).join('/'),
        extension,
        classification: FILE_CLASSIFICATIONS[extension] || 'other'
      });
    }
  };

  await walk(rootDir);
  return files;
};

export const readFileContent = async (rootDir, relativePath) => {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.resolve(rootDir, normalized);

  if (!fullPath.startsWith(path.resolve(rootDir))) {
    throw new Error('Invalid file path');
  }

  return fs.readFile(fullPath, 'utf8');
};
