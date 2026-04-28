export const severityColors = {
  Low: 'text-emerald-300',
  Medium: 'text-amber-300',
  High: 'text-orange-300',
  Critical: 'text-rose-300'
};

export const chartDataFromSummary = (summary) =>
  Object.entries(summary?.bySeverity || {}).map(([name, value]) => ({ name, value }));
