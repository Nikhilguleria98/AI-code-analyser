import { useState } from 'react';
import api from '../api/axios';

const UploadPanel = ({ onUploaded }) => {
  const [githubUrl, setGithubUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [file, setFile] = useState(null);
  const [pastedCode, setPastedCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('upload'); // 'upload' or 'paste'

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (mode === 'paste') {
        const response = await api.post('/projects/analyze-code', { code: pastedCode, language: 'javascript' });
        // For paste, we don't create a project, just show issues
        onUploaded({ issues: response.data.issues, mode: 'paste', code: pastedCode });
        setPastedCode('');
      } else {
        const formData = new FormData();
        formData.append('name', projectName || 'New Project');
        if (githubUrl) {
          formData.append('githubUrl', githubUrl);
        }
        if (file) {
          formData.append('archive', file);
        }

        const response = await api.post('/projects/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        onUploaded(response.data.project);
        setFile(null);
        setGithubUrl('');
        setProjectName('');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass-panel space-y-4 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-soft/70">Analyze Codebase</p>
        <h3 className="mt-2 text-2xl font-semibold">Upload files, connect GitHub, or paste code</h3>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            mode === 'upload' ? 'bg-accent text-slate-950' : 'bg-white/10 text-soft'
          }`}
        >
          Upload/Github
        </button>
        <button
          type="button"
          onClick={() => setMode('paste')}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            mode === 'paste' ? 'bg-accent text-slate-950' : 'bg-white/10 text-soft'
          }`}
        >
          Paste Code
        </button>
      </div>

      {mode === 'upload' ? (
        <>
          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none"
            placeholder="Project name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
          />

          <input
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none"
            placeholder="https://github.com/org/repo"
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
          />

          <label className="flex min-h-32 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-5 text-center text-soft">
            <input type="file" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            {file ? file.name : 'Drag a file here or click to choose one'}
          </label>
        </>
      ) : (
        <textarea
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none"
          placeholder="Paste your JavaScript/TypeScript code here"
          value={pastedCode}
          onChange={(event) => setPastedCode(event.target.value)}
          rows={10}
        />
      )}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || (mode === 'upload' && !file && !githubUrl) || (mode === 'paste' && !pastedCode)}
        className="rounded-xl bg-accent px-5 py-3 font-medium text-slate-950 transition hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? (mode === 'paste' ? 'Analyzing...' : 'Uploading...') : mode === 'paste' ? 'Analyze Code' : 'Create Project'}
      </button>
    </form>
  );
};

export default UploadPanel;
