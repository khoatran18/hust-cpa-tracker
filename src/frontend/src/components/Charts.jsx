import { useState, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, LabelList,
} from 'recharts';

const GRADE_COLORS = {
  'A+': '#34d399', 'A': '#10b981',
  'B+': '#fbbf24', 'B': '#f59e0b',
  'C+': '#fb923c', 'C': '#f97316',
  'D+': '#f87171', 'D': '#ef4444',
  'F': '#b91c1c',
};

/* ─── Rounded-top path ──────────────────────────────────────────── */
function roundedTopPath(x, y, w, h, r = 4) {
  if (!h || h <= 0 || !w || w <= 0) return '';
  const rad = Math.min(r, w / 2, h / 2);
  return [
    `M ${x + rad} ${y}`,
    `L ${x + w - rad} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + rad}`,
    `L ${x + w} ${y + h}`,
    `L ${x} ${y + h}`,
    `L ${x} ${y + rad}`,
    `Q ${x} ${y} ${x + rad} ${y}`,
    'Z',
  ].join(' ');
}

/* ─── Speech-bubble tooltip ─────────────────────────────────────── */
function TooltipPanel({ grade, value, unit, courses, anchorX, anchorY, onEnter, onLeave }) {
  if (!grade) return null;
  const color = GRADE_COLORS[grade] || '#fff';
  const TOOLTIP_W = 250;
  const ARROW_H = 9;    // mũi tên cao 9px
  const GAP = 3;        // khoảng cách giữa arrow tip và đỉnh bar

  // Căn giữa theo bar, clamp trong container
  const rawLeft = anchorX - TOOLTIP_W / 2;
  // left tính từ container — không clamp cứng, recharts thường đủ không gian
  const tooltipLeft = rawLeft;

  // Tooltip nằm phía trên bar, transform translateY(-100%) + arrow height
  const tooltipBottom_offset = anchorY - GAP; // khoảng cách từ top container tới mũi tên

  // Arrow left offset tương đối với tooltip box
  const arrowLeftInBox = TOOLTIP_W / 2;

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: tooltipBottom_offset,
        left: tooltipLeft,
        /* đẩy lên trên bằng 100% chiều cao box + arrow */
        transform: `translateY(calc(-100% - ${ARROW_H}px))`,
        zIndex: 300,
        pointerEvents: 'auto',
        width: TOOLTIP_W,
      }}
    >
      {/* Bubble box */}
      <div style={{
        background: 'rgba(11,17,35,0.97)',
        border: `1.5px solid ${color}55`,
        borderRadius: 12,
        padding: '10px 12px',
        fontSize: 12,
        boxShadow: `
          0 8px 28px rgba(0,0,0,0.6),
          0 0 0 1px ${color}18,
          0 0 20px ${color}18
        `,
        backdropFilter: 'blur(12px)',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: courses.length ? 8 : 0 }}>
          <span style={{
            background: `${color}20`, color,
            fontWeight: 800, fontSize: 14,
            padding: '2px 10px', borderRadius: 6,
            boxShadow: `0 0 10px ${color}35`,
          }}>{grade}</span>
          <span style={{ color: '#94a3b8' }}>{value} {unit}</span>
          {courses.length > 5 && (
            <span style={{ marginLeft: 'auto', color: '#374151', fontSize: 10 }}>cuộn ↕</span>
          )}
        </div>

        {/* Course list */}
        {courses.length > 0 && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            paddingTop: 6,
            maxHeight: 190,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: `${color}55 transparent`,
          }}
            onWheel={(e) => e.stopPropagation()}
          >
            {courses.map((c, i) => (
              <div key={c.maHP} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 2px',
                borderBottom: i < courses.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#374151', flexShrink: 0, width: 50 }}>
                  {c.maHP}
                </span>
                <span style={{ color: '#e2e8f0', fontSize: 11, flex: 1, lineHeight: 1.35 }}>
                  {c.tenHP}
                </span>
                <span style={{ color, fontWeight: 700, fontSize: 11, flexShrink: 0, minWidth: 26, textAlign: 'right' }}>
                  {c.tinChi}TC
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mũi tên trỏ xuống bar — 2 lớp để có border */}
      {/* Outer (border color) */}
      <div style={{
        position: 'absolute',
        bottom: -(ARROW_H + 1),
        left: arrowLeftInBox,
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: `${ARROW_H}px solid transparent`,
        borderRight: `${ARROW_H}px solid transparent`,
        borderTop: `${ARROW_H + 1}px solid ${color}55`,
        pointerEvents: 'none',
      }} />
      {/* Inner (fill color) */}
      <div style={{
        position: 'absolute',
        bottom: -ARROW_H,
        left: arrowLeftInBox,
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: `${ARROW_H - 1}px solid transparent`,
        borderRight: `${ARROW_H - 1}px solid transparent`,
        borderTop: `${ARROW_H}px solid rgba(11,17,35,0.97)`,
        pointerEvents: 'none',
      }} />
    </div>
  );
}

/* ─── GradeBarChart ─────────────────────────────────────────────── */
function GradeBarChart({ data, dataKey, title, unit, coursesByGrade }) {
  const [activeGrade, setActiveGrade] = useState(null);
  const [anchor, setAnchor] = useState({ x: 0, y: 0 }); // center-top của bar
  const containerRef = useRef(null);
  const hideTimer = useRef(null);
  const overTooltip = useRef(false);

  const scheduleHide = () => {
    hideTimer.current = setTimeout(() => {
      if (!overTooltip.current) setActiveGrade(null);
    }, 200);
  };
  const cancelHide = () => clearTimeout(hideTimer.current);

  const handleTooltipEnter = () => { overTooltip.current = true; cancelHide(); };
  const handleTooltipLeave = () => { overTooltip.current = false; setActiveGrade(null); };

  // Custom bar shape: bắt được tọa độ SVG
  const customShape = (props) => {
    const { x, y, width, height, payload } = props;
    const grade = payload?.grade;
    const fill = GRADE_COLORS[grade] || '#6366f1';
    const isDimmed = activeGrade && activeGrade !== grade;

    if (!height || height <= 0 || !width || width <= 0) return <g />;

    const handleEnter = () => {
      cancelHide();
      setActiveGrade(grade);

      if (containerRef.current) {
        const titleEl = containerRef.current.querySelector('.chart-title');
        const titleH = titleEl ? titleEl.offsetHeight + 4 : 26;
        // Anchor = center-top của bar (trong tọa độ container)
        setAnchor({
          x: x + width / 2,   // center ngang bar
          y: titleH + y,       // top bar
        });
      }
    };

    return (
      <>
        <path
          d={roundedTopPath(x, y, width, height)}
          fill={fill}
          opacity={isDimmed ? 0.28 : 1}
          style={{ transition: 'opacity 0.18s ease' }}
          onMouseEnter={handleEnter}
          onMouseLeave={scheduleHide}
        />
        {/* Vùng hover mở rộng lên phía trên để chuột trượt sang tooltip */}
        <rect
          x={x}
          y={Math.max(0, y - 12)}
          width={width}
          height={12}
          fill="transparent"
          onMouseEnter={handleEnter}
          onMouseLeave={scheduleHide}
          style={{ cursor: 'default' }}
        />
      </>
    );
  };

  const tooltipValue = activeGrade
    ? (data.find(d => d.grade === activeGrade)?.[dataKey] ?? 0) : 0;
  const tooltipCourses = activeGrade ? (coursesByGrade?.[activeGrade] || []) : [];

  return (
    <div className="chart-card" style={{ position: 'relative', overflow: 'visible' }} ref={containerRef}>
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
          <Bar dataKey={dataKey} shape={customShape} isAnimationActive={false}>
            <LabelList
              dataKey={dataKey}
              position="top"
              style={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
              formatter={(v) => (v > 0 ? v : '')}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Speech-bubble tooltip phía trên bar */}
      {activeGrade && (
        <TooltipPanel
          grade={activeGrade}
          value={tooltipValue}
          unit={unit}
          courses={tooltipCourses}
          anchorX={anchor.x}
          anchorY={anchor.y}
          onEnter={handleTooltipEnter}
          onLeave={handleTooltipLeave}
        />
      )}
    </div>
  );
}

export default function Charts({ gradeDistribution, courses }) {
  const coursesByGrade = {};
  if (courses) {
    for (const c of courses) {
      const g = c.diemChu;
      if (!g) continue;
      if (!coursesByGrade[g]) coursesByGrade[g] = [];
      coursesByGrade[g].push(c);
    }
  }

  return (
    <div className="charts-grid">
      <GradeBarChart
        data={gradeDistribution}
        dataKey="courses"
        title="Phân phối theo số môn"
        unit="môn"
        coursesByGrade={coursesByGrade}
      />
      <GradeBarChart
        data={gradeDistribution}
        dataKey="credits"
        title="Phân phối theo số tín chỉ"
        unit="tín"
        coursesByGrade={coursesByGrade}
      />
    </div>
  );
}
