const TreeNode = ({ node, onSelect, activePath }) => {
  if (node.type === 'file') {
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
          activePath === node.path ? 'bg-accent/20 text-accent' : 'text-soft hover:bg-white/5'
        }`}
      >
        {node.name}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="px-3 text-xs uppercase tracking-[0.25em] text-soft/50">{node.name}</p>
      <div className="space-y-1 border-l border-white/10 pl-3">
        {node.children?.map((child) => (
          <TreeNode key={child.path} node={child} onSelect={onSelect} activePath={activePath} />
        ))}
      </div>
    </div>
  );
};

const FileExplorer = ({ tree, onSelect, activePath }) => (
  <div className="glass-panel h-[32rem] overflow-auto p-4">
    <p className="mb-4 text-xs uppercase tracking-[0.3em] text-soft/70">File Explorer</p>
    <div className="space-y-3">
      {tree?.map((node) => (
        <TreeNode key={node.path} node={node} onSelect={onSelect} activePath={activePath} />
      ))}
    </div>
  </div>
);

export default FileExplorer;
