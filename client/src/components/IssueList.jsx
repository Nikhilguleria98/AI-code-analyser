import { severityColors } from '../utils/format';
import { CheckCircle } from 'lucide-react';

const IssueList = ({ issues }) => (
  <div className="glass-panel max-h-[32rem] overflow-auto p-4">
    <p className="mb-4 text-xs uppercase tracking-[0.3em] text-soft/70">
      Issues
    </p>

    {/* ✅ NO ISSUES STATE */}
    {!issues || issues.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="mb-3 text-green-400" size={40} />
        <p className="text-lg font-semibold text-green-400">
          No Issues Found
        </p>
        <p className="mt-2 text-sm text-soft/80">
          Your code looks clean, optimized, and production-ready 🚀
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {issues.map((issue) => (
          <div
            key={`${issue.file}-${issue.line}-${issue.issue}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="font-medium text-white">{issue.issue}</p>
              <span
                className={`text-sm ${severityColors[issue.severity]}`}
              >
                {issue.severity}
              </span>
            </div>

            <p className="mt-2 text-xs text-soft/70 font-mono">
              <span className="text-accent">{issue.file}</span>:
              <span className="text-amber-400">{issue.line}</span>
            </p>

            <p className="mt-2 text-sm text-soft/90">
              <span className="font-semibold text-soft">Error:</span>{" "}
              {issue.source}
            </p>

            <p className="mt-2 text-sm text-soft/90">
              <span className="font-semibold text-soft">Fix:</span>{" "}
              {issue.fixSuggestion}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default IssueList;