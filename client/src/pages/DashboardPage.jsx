import { useContext, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Lightbulb, MapPin, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import SeverityChart from '../components/SeverityChart';
import StatsCard from '../components/StatsCard';

const emptySummary = {
  totalIssues: 0,
  bySeverity: { Low: 0, Medium: 0, High: 0, Critical: 0 },
  securityScore: 100
};

const severityOrder = ['Critical', 'High', 'Medium', 'Low'];

const riskStyles = {
  Critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  High: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  Medium: { color: 'text-yellow-300', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  Low: { color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
};

const sourceLabels = {
  syntax: 'Syntax',
  eslint: 'ESLint',
  semgrep: 'Security',
  ai: 'AI Review'
};

const DashboardPage = () => {
  const { user, userStats, recentActivity, refreshUserStats } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('All');

  const fetchAllUserIssues = async () => {
    setLoadingIssues(true);
    try {
      const response = await api.get('/reports/issues/user');
      setAllIssues(response.data.issues || []);
    } catch (error) {
      console.error('Failed to fetch user issues:', error);
    } finally {
      setLoadingIssues(false);
    }
  };

  useEffect(() => {
    api.get('/reports').then((response) => setReports(response.data.reports || []));
    fetchAllUserIssues();
    refreshUserStats();
  }, [refreshUserStats]);

  const handleRefresh = () => {
    refreshUserStats();
    fetchAllUserIssues();
  };

  const latest = reports[0];
  const summary = latest?.summary || emptySummary;

  const issuesBySeverity = severityOrder.reduce(
    (grouped, severity) => ({
      ...grouped,
      [severity]: allIssues.filter((issue) => issue.severity === severity)
    }),
    {}
  );

  const filteredIssues =
    severityFilter === 'All' ? allIssues : allIssues.filter((issue) => issue.severity === severityFilter);
  const topIssues = filteredIssues.slice(0, 10);

  return (
    <div className="space-y-6">
      <section className="glass-panel p-5">
        <h2 className="mb-4 text-xl font-semibold text-white">Welcome, {user?.name || 'User'}!</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard label="Total Projects" value={userStats.totalProjects} />
          <StatsCard label="Total Issues Found" value={userStats.totalIssuesFound} />
          <StatsCard label="Avg Security Score" value={`${userStats.avgSecurityScore}/100`} />
          <StatsCard label="Critical Issues" value={userStats.criticalIssues} tone="danger" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-soft/70">Issues by Severity</p>
            {loadingIssues && <RefreshCw size={16} className="animate-spin text-accent" />}
          </div>
          <div className="space-y-3">
            {severityOrder.map((severity) => {
              const issues = issuesBySeverity[severity];
              const risk = riskStyles[severity];
              const percentage = allIssues.length > 0 ? Math.round((issues.length / allIssues.length) * 100) : 0;

              return (
                <button
                  key={severity}
                  type="button"
                  onClick={() => setSeverityFilter(severityFilter === severity ? 'All' : severity)}
                  className={`w-full rounded-lg border ${risk.border} ${risk.bg} p-4 text-left transition hover:border-white/30 ${
                    severityFilter === severity ? 'ring-1 ring-white/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${risk.color}`}>{severity} Risk</span>
                    <div className="text-right">
                      <p className={`font-bold ${risk.color}`}>{issues.length}</p>
                      <p className="text-xs text-soft">{percentage}% of total</p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className={`h-full ${risk.bg}`} style={{ width: `${percentage}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <SeverityChart summary={summary} />
      </section>

      <section className="glass-panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-soft/70">Error Dashboard</p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              {severityFilter === 'All' ? 'All detected issues' : `${severityFilter} issues`}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setSeverityFilter('All')}
            className="rounded-md border border-white/10 px-3 py-2 text-xs text-soft transition hover:border-accent hover:text-white"
          >
            Show all
          </button>
        </div>

        {topIssues.length ? (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <div className="grid grid-cols-[1fr_110px_120px] gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-wide text-soft/70 max-md:hidden">
              <span>Error and Location</span>
              <span>Severity</span>
              <span>Source</span>
            </div>
            <div className="divide-y divide-white/10">
              {topIssues.map((issue) => {
                const risk = riskStyles[issue.severity] || riskStyles.Medium;

                return (
                  <div
                    key={`${issue._id || issue.file}-${issue.line}-${issue.issue}`}
                    className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_110px_120px]"
                  >
                    <div>
                      <p className="font-medium text-white">{issue.issue}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-soft/80">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <MapPin size={13} className="text-accent" />
                          {issue.file}:{issue.line || 1}:{issue.column || 1}
                        </span>
                        {issue.errorType && <span>{issue.errorType}</span>}
                      </div>
                      <div className="mt-3 rounded-md border border-emerald-400/15 bg-emerald-500/10 p-3">
                        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                          <Lightbulb size={14} />
                          Solution
                        </p>
                        <p className="text-sm text-soft/90">
                          {issue.fixSuggestion || 'Review the highlighted code and apply the safer corrected pattern.'}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${risk.color}`}>{issue.severity}</p>
                    <p className="text-sm text-soft">{sourceLabels[issue.source] || issue.source || 'Analyzer'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4 text-emerald-200">
            <CheckCircle2 size={20} />
            <p className="text-sm">{loadingIssues ? 'Loading issues...' : 'No issues found for this filter.'}</p>
          </div>
        )}
      </section>

      <section className="glass-panel p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-soft/70">Recent Changes</p>
          <button onClick={handleRefresh} className="text-xs font-medium text-accent hover:text-accent/80">
            Refresh
          </button>
        </div>
        <div className="space-y-3">
          {recentActivity?.length ? (
            recentActivity.map((activity, idx) => (
              <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{activity.action}</p>
                    <p className="text-sm text-soft">{activity.projectName}</p>
                  </div>
                  <p className="text-xs text-soft">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
                {activity.details && <p className="mt-2 text-sm text-soft/80">{activity.details}</p>}
              </div>
            ))
          ) : (
            <p className="text-sm text-soft">No recent activity</p>
          )}
        </div>
      </section>

      {issuesBySeverity.Critical.length > 0 && (
        <section className="glass-panel border-red-500/30 bg-red-500/5 p-5">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-400">
            <AlertTriangle size={16} />
            Critical Issues Requiring Attention
          </p>
          <div className="space-y-2">
            {issuesBySeverity.Critical.slice(0, 5).map((issue) => (
              <div key={`${issue.file}-${issue.line}`} className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-white">{issue.issue}</p>
                  <p className="text-xs text-red-300/70">
                    {issue.file}:{issue.line || 1}:{issue.column || 1}
                  </p>
                  <p className="mt-1 text-xs text-soft/80">{issue.fixSuggestion}</p>
                </div>
              </div>
            ))}
            {issuesBySeverity.Critical.length > 5 && (
              <p className="text-sm text-red-300/70">+{issuesBySeverity.Critical.length - 5} more critical issues</p>
            )}
          </div>
        </section>
      )}

      <section className="glass-panel p-5">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-soft/70">Analysis History</p>
        <div className="space-y-3">
          {reports.length ? (
            reports.map((report) => (
              <div key={report._id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{report.project?.name}</p>
                    <p className="text-sm text-soft">
                      {new Date(report.createdAt).toLocaleString()} - Status: {report.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-accent">{report.summary.totalIssues} issues</p>
                    <p className="text-xs text-soft">Score: {report.summary.securityScore}/100</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="text-red-400">Critical: {report.summary.bySeverity.Critical}</span>
                  <span className="text-orange-400">High: {report.summary.bySeverity.High}</span>
                  <span className="text-yellow-400">Medium: {report.summary.bySeverity.Medium}</span>
                  <span className="text-emerald-300">Low: {report.summary.bySeverity.Low}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-soft">No completed reports yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
