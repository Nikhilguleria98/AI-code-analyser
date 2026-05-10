import { severityColors } from '../utils/format';
import { CheckCircle, Lightbulb, MapPin, ShieldAlert } from 'lucide-react';

const sourceLabels = {
  syntax: 'Syntax',
  runtime: 'Runtime',
  eslint: 'ESLint',
  semgrep: 'Security',
  ai: 'AI Review'
};

const IssueList = ({ issues }) => (
  <div className="glass-panel max-h-[32rem] overflow-auto p-4">
    <p className="mb-4 text-xs uppercase tracking-[0.3em] text-soft/70">
      Issues
    </p>

    {!issues || issues.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="mb-3 text-green-400" size={40} />
        <p className="text-lg font-semibold text-green-400">
          No Issues Found
        </p>
        <p className="mt-2 text-sm text-soft/80">
          Your code looks clean, optimized, and production-ready.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {issues.map((issue) => (
          <div
            key={`${issue.file}-${issue.line}-${issue.issue}`}
            className="rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-wide text-soft">
                    {sourceLabels[issue.source] || issue.source || 'Analyzer'}
                  </span>
                  {issue.errorType && (
                    <span className="rounded-md border border-white/10 bg-slate-950/40 px-2 py-1 text-[11px] text-soft/80">
                      {issue.errorType}
                    </span>
                  )}
                </div>
                <p className="font-medium text-white">{issue.issue}</p>
              </div>
              <span
                className={`shrink-0 text-sm font-semibold ${severityColors[issue.severity]}`}
              >
                {issue.severity}
              </span>
            </div>

            <div className="mt-3 flex items-start gap-2 text-xs text-soft/80">
              <MapPin size={14} className="mt-0.5 shrink-0 text-accent" />
              <p className="font-mono">
                <span className="text-accent">{issue.file}</span>:
                <span className="text-amber-300">{issue.line || 1}</span>:
                <span className="text-amber-300">{issue.column || 1}</span>
              </p>
            </div>

            <div className="mt-3 rounded-md border border-rose-400/15 bg-rose-500/10 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-200">
                <ShieldAlert size={14} />
                Error
              </div>
              <p className="text-sm text-soft/90">{issue.issue}</p>
            </div>

            <div className="mt-3 rounded-md border border-emerald-400/15 bg-emerald-500/10 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                <Lightbulb size={14} />
                Solution
              </div>
              <p className="text-sm text-soft/90">
                {issue.fixSuggestion || 'Review the highlighted code and apply the safer corrected pattern.'}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default IssueList;
