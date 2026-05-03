import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import UploadPanel from '../components/UploadPanel';
import FileExplorer from '../components/FileExplorer';
import CodeViewer from '../components/CodeViewer';
import IssueList from '../components/IssueList';
import { useAuth } from '../hooks/useAuth';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false
});

const ProjectsPage = () => {
  const { refreshUserStats } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectFiles, setProjectFiles] = useState([]);
  const [tree, setTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [content, setContent] = useState('');
  const [issues, setIssues] = useState([]);
  const [pastedIssues, setPastedIssues] = useState([]);
  const [progress, setProgress] = useState(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === selectedProjectId || project.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  useEffect(() => {
    api.get('/projects').then((response) => {
      setProjects(response.data.projects);
      if (response.data.projects[0]) {
        setSelectedProjectId(response.data.projects[0]._id);
      }
    });
    refreshUserStats(); // Refresh stats when component mounts
  }, [refreshUserStats]);

  useEffect(() => {
    socket.connect();

    socket.on('analysis:progress', setProgress);
    socket.on('analysis:completed', () => {
      if (selectedProjectId) {
        fetchFiles(selectedProjectId);
      }
      refreshUserStats(); // Refresh stats after analysis completion
    });

    return () => {
      socket.off('analysis:progress', setProgress);
      socket.off('analysis:completed');
      socket.disconnect();
    };
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      socket.emit('project:join', selectedProjectId);
      fetchFiles(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchFiles = async (projectId) => {
    const response = await api.get(`/projects/${projectId}/files`);
    setProjectFiles(response.data.files);
    setTree(response.data.tree);
    if (response.data.files[0]) {
      selectFile(projectId, response.data.files[0].relativePath);
    }
  };

  const selectFile = async (projectId, filePath) => {
  setSelectedFile(filePath);

  try {
    const response = await api.get(`/projects/${projectId}/file`, {
      params: { path: filePath }
    });

    console.log("📂 Selected File:", filePath);
    console.log("🔥 API Issues:", response.data.issues);

    setContent(response.data.content);
    setIssues(response.data.issues);
  } catch (error) {
    console.error("❌ File fetch error:", error.response?.data || error.message);
  }
};

  const triggerAnalysis = async () => {
    if (!selectedProjectId) return;
    await api.post('/projects/analyze', { projectId: selectedProjectId });
  };

  return (
    <div className="space-y-6">
      <UploadPanel
        onUploaded={(uploaded) => {
          if (uploaded.mode === 'paste') {
            setPastedIssues(uploaded.issues);
            setSelectedFile('pasted-code.js');
            setContent(uploaded.code);
            setIssues(uploaded.issues);
          } else {
            setProjects((current) => [{ ...uploaded, _id: uploaded.id }, ...current]);
            setSelectedProjectId(uploaded.id);
            refreshUserStats(); // Refresh stats after project creation
          }
        }}
      />

      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 p-4">
        <select
          value={selectedProjectId}
          onChange={(event) => setSelectedProjectId(event.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3"
        >
          <option value="">Select project</option>
          {projects.map((project) => (
            <option key={project._id || project.id} value={project._id || project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <button onClick={triggerAnalysis} className="rounded-xl bg-accent px-5 py-3 font-medium text-slate-950">
          Run Analysis
        </button>

        <p className="text-sm text-soft">
          {progress && progress.projectId === selectedProjectId
            ? `${progress.step} · ${progress.progress}%`
            : selectedProject
              ? `${selectedProject.fileCount || projectFiles.length} files indexed`
              : 'Choose a project to inspect'}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr_340px]">
        <FileExplorer tree={tree} activePath={selectedFile} onSelect={(file) => selectFile(selectedProjectId, file)} />
        <CodeViewer filePath={selectedFile} content={content} issues={issues} />
        <IssueList issues={issues} />
      </div>
    </div>
  );
};

export default ProjectsPage;
