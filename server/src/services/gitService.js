import simpleGit from 'simple-git';
import { createProjectWorkspace } from './fileService.js';

export const cloneRepository = async (githubUrl, projectName) => {
  const workspace = await createProjectWorkspace(projectName);
  await simpleGit().clone(githubUrl, workspace, ['--depth', '1']);
  return workspace;
};
