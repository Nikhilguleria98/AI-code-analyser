import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { chartDataFromSummary } from '../utils/format';

const palette = ['#37d0a7', '#ffb703', '#fb8500', '#ef476f'];

const SeverityChart = ({ summary }) => {
  const data = chartDataFromSummary(summary);

  return (
    <div className="glass-panel h-80 p-5 shadow-glow">
      <p className="mb-4 text-sm uppercase tracking-[0.3em] text-soft/80">Severity Distribution</p>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0d2233',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SeverityChart;
