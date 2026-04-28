export const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next'
]);

export const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.pdf',
  '.zip',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.class',
  '.jar',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.mp3',
  '.mp4'
]);

export const FILE_CLASSIFICATIONS = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.json': 'json',
  '.css': 'stylesheet',
  '.scss': 'stylesheet',
  '.html': 'markup',
  '.md': 'documentation',
  '.yml': 'config',
  '.yaml': 'config',
  '.env': 'config'
};

export const SEVERITY_ORDER = ['Low', 'Medium', 'High', 'Critical'];
