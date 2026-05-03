import { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import SeverityChart from '../components/SeverityChart';
import StatsCard from '../components/StatsCard';

const emptySummary = {
  totalIssues: 0,
  bySeverity: { Low: 0, Medium: 0, High: 0, Critical: 0 },
  securityScore: 100
};

const DashboardPage = () => {
  const { user, userStats, recentActivity, refreshUserStats } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

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
    api.get('/reports').then((response) => setReports(response.data.reports));
    fetchAllUserIssues();
    refreshUserStats(); // Refresh user stats when dashboard loads
  }, [refreshUserStats]);

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    refreshUserStats();
    fetchAllUserIssues();
  };

  const latest = reports[0];
  const summary = latest?.summary || emptySummary;

  // Calculate risk levels
  const calculateRiskLevel = (severity) => {
    switch (severity) {
      case 'Critical':
        return { level: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' };
      case 'High':
        return { level: 'High', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
      case 'Medium':
        return { level: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
      case 'Low':
        return { level: 'Low', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' };
      default:
        return { level: 'Unknown', color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30' };
    }
  };

  // Group issues by severity
  const issuesBySeverity = {
    Critical: allIssues.filter((i) => i.severity === 'Critical'),
    High: allIssues.filter((i) => i.severity === 'High'),
    Medium: allIssues.filter((i) => i.severity === 'Medium'),
    Low: allIssues.filter((i) => i.severity === 'Low')
  };

  return (
    <div className="space-y-6">
      {/* User Overview & Stats */}
      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white mb-4">
          Welcome, {user?.name || 'User'}!
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard label="Total Projects" value={userStats.totalProjects} />
          <StatsCard label="Total Issues Found" value={userStats.totalIssuesFound} />
          <StatsCard label="Avg Security Score" value={`${userStats.avgSecurityScore}/100`} />
          <StatsCard label="Critical Issues" value={userStats.criticalIssues} tone="danger" />
        </div>
      </section>

      {/* Quick Stats & Security Score */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-soft/70 mb-4">Issues by Severity</p>
          <div className="space-y-3">
            {Object.entries(issuesBySeverity).map(([severity, issues]) => {
              const risk = calculateRiskLevel(severity);
              const percentage = allIssues.length > 0 ? Math.round((issues.length / allIssues.length) * 100) : 0;
              return (
                <div key={severity} className={`rounded-xl border ${risk.border} ${risk.bg} p-4`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${risk.color}`}>{severity} Risk</span>
                    <div className="text-right">
                      <p className={`font-bold ${risk.color}`}>{issues.length}</p>
                      <p className="text-xs text-soft">{percentage}% of total</p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${risk.bg}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <SeverityChart summary={summary} />
      </section>

      {/* Recent Activity & Changes */}
      <section className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-soft/70">Recent Changes</p>
          <button
            onClick={handleRefresh}
            className="text-xs text-accent hover:text-accent/80 font-medium"
          >
            Refresh
          </button>
        </div>
        <div className="space-y-3">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((activity, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{activity.action}</p>
                    <p className="text-sm text-soft">{activity.projectName}</p>
                  </div>
                  <p className="text-xs text-soft">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
                {activity.details && (
                  <p className="mt-2 text-sm text-soft/80">{activity.details}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-soft">No recent activity</p>
          )}
        </div>
      </section>

      {/* Critical Issues Alert */}
      {issuesBySeverity.Critical.length > 0 && (
        <section className="glass-panel border-red-500/30 bg-red-500/5 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-red-500 font-semibold mb-4">
            ⚠️ Critical Issues Requiring Attention
          </p>
          <div className="space-y-2">
            {issuesBySeverity.Critical.slice(0, 5).map((issue) => (
              <div key={`${issue.file}-${issue.line}`} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="text-red-500 font-bold">•</span>
                <div>
                  <p className="text-sm font-medium text-white">{issue.issue}</p>
                  <p className="text-xs text-red-300/70">
                    {issue.file}:{issue.line}
                  </p>
                </div>
              </div>
            ))}
            {issuesBySeverity.Critical.length > 5 && (
              <p className="text-sm text-red-300/70">
                +{issuesBySeverity.Critical.length - 5} more critical issues
              </p>
            )}
          </div>
        </section>
      )}

      {/* Report History */}
      <section className="glass-panel p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-soft/70 mb-4">Analysis History</p>
        <div className="space-y-3">
          {reports.length ? (
            reports.map((report) => (
              <div key={report._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{report.project?.name}</p>
                    <p className="text-sm text-soft">
                      {new Date(report.createdAt).toLocaleString()} · Status: {report.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-accent font-semibold">{report.summary.totalIssues} issues</p>
                    <p className="text-xs text-soft">Score: {report.summary.securityScore}/100</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="text-red-400">🔴 Critical: {report.summary.bySeverity.Critical}</span>
                  <span className="text-orange-400">🟠 High: {report.summary.bySeverity.High}</span>
                  <span className="text-yellow-400">🟡 Medium: {report.summary.bySeverity.Medium}</span>
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
