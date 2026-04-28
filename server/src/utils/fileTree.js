export const buildTree = (paths = []) => {
  const root = [];

  paths.forEach((filePath) => {
    const parts = filePath.split('/');
    let cursor = root;

    parts.forEach((part, index) => {
      let node = cursor.find((entry) => entry.name === part);
      if (!node) {
        node = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: index === parts.length - 1 ? 'file' : 'directory',
          children: index === parts.length - 1 ? undefined : []
        };
        cursor.push(node);
      }

      if (node.children) {
        cursor = node.children;
      }
    });
  });

  return root;
};
