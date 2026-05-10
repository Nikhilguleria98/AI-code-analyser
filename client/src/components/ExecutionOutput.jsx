import { CheckCircle2, Terminal, XCircle } from 'lucide-react';

const ExecutionOutput = ({ execution }) => {
  if (!execution) return null;

  const isSuccess = execution.status === 'success';
  const isError = execution.status === 'error';
  const title = isSuccess ? 'Output Result' : isError ? 'Execution Error' : 'Execution Skipped';
  const Icon = isSuccess ? CheckCircle2 : isError ? XCircle : Terminal;

  return (
    <section
      className={`glass-panel p-4 ${
        isSuccess ? 'border-emerald-400/20 bg-emerald-500/5' : isError ? 'border-rose-400/20 bg-rose-500/5' : ''
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon size={18} className={isSuccess ? 'text-emerald-300' : isError ? 'text-rose-300' : 'text-soft'} />
        <p className="text-xs uppercase tracking-[0.3em] text-soft/70">{title}</p>
      </div>

      {isSuccess ? (
        <div className="space-y-3">
          {execution.output?.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-soft/70">Console</p>
              <pre className="overflow-auto rounded-md bg-slate-950/70 p-3 text-sm text-emerald-100">
                {execution.output.join('\n')}
              </pre>
            </div>
          )}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-soft/70">Result</p>
            <pre className="overflow-auto rounded-md bg-slate-950/70 p-3 text-sm text-emerald-100">
              {execution.result || 'undefined'}
            </pre>
          </div>
        </div>
      ) : (
        <p className="rounded-md bg-slate-950/70 p-3 text-sm text-soft/90">
          {execution.error || 'Run pasted JavaScript with no analysis errors to see output.'}
        </p>
      )}
    </section>
  );
};

export default ExecutionOutput;
