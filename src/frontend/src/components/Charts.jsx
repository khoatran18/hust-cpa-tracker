import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';

const GRADE_COLORS = {
  'A+': '#34d399', 'A': '#10b981',
  'B+': '#fbbf24', 'B': '#f59e0b',
  'C+': '#fb923c', 'C': '#f97316',
  'D+': '#f87171', 'D': '#ef4444',
  'F':  '#b91c1c',
};

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: GRADE_COLORS[label] || '#fff' }}>
        {label}
      </div>
      <div style={{ color: '#94a3b8' }}>
        {payload[0].value} {unit}
      </div>
    </div>
  );
};

function GradeBarChart({ data, dataKey, title, unit }) {
  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="grade"
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false} tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.grade} fill={GRADE_COLORS[entry.grade] || '#6366f1'} />
            ))}
            <LabelList
              dataKey={dataKey}
              position="top"
              style={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              formatter={(v) => (v > 0 ? v : '')}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Charts({ gradeDistribution }) {
  return (
    <div className="charts-grid">
      <GradeBarChart
        data={gradeDistribution}
        dataKey="courses"
        title="Phân phối theo số môn"
        unit="môn"
      />
      <GradeBarChart
        data={gradeDistribution}
        dataKey="credits"
        title="Phân phối theo số tín chỉ"
        unit="tín"
      />
    </div>
  );
}
