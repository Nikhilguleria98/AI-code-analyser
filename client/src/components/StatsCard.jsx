const StatsCard = ({ label, value, tone = 'accent' }) => (
  <div className="glass-panel p-5">
    <p className="text-xs uppercase tracking-[0.3em] text-soft/70">{label}</p>
    <p className={`mt-3 text-3xl font-semibold ${tone === 'danger' ? 'text-rose-300' : 'text-accent'}`}>
      {value}
    </p>
  </div>
);

export default StatsCard;
