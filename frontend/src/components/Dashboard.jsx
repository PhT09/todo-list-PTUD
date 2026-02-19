import { useState, useEffect, useMemo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line, ComposedChart, Area,
} from 'recharts';
import { todoApi } from '../api/todoApi';
import { FaChartPie, FaArrowLeft, FaTrophy } from 'react-icons/fa';

const COLORS = {
    early: '#22c55e',
    late: '#ef4444',
    on_time: '#3b82f6',
    no_deadline: '#94a3b8',
};

const PRIORITY_COLORS = {
    Priority: '#ef4444',
    Important: '#f97316',
    Necessary: '#3b82f6',
    Normal: '#94a3b8',
};

const Dashboard = ({ onBack }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Date range defaults: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
    const [unit, setUnit] = useState('week');

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                start_date: new Date(startDate).toISOString(),
                end_date: new Date(endDate + 'T23:59:59').toISOString(),
                unit,
            };
            const res = await todoApi.getAnalyticsStats(params);
            setStats(res.data);
        } catch (err) {
            setError('Không thể tải dữ liệu analytics: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [startDate, endDate, unit]);

    // Prepare pie chart data
    const pieData = useMemo(() => {
        if (!stats?.pie_data) return [];
        const { early, late, on_time, no_deadline } = stats.pie_data;
        return [
            { name: 'Sớm hạn', value: early, color: COLORS.early },
            { name: 'Trễ hạn', value: late, color: COLORS.late },
            { name: 'Đúng hạn', value: on_time, color: COLORS.on_time },
            { name: 'Không deadline', value: no_deadline, color: COLORS.no_deadline },
        ].filter(d => d.value > 0);
    }, [stats]);

    // Score gauge percentage
    const scorePercent = stats?.cumulative_score ? Math.min(stats.cumulative_score, 100) : 0;

    // Score color
    const getScoreColor = (score) => {
        if (score >= 70) return '#22c55e';
        if (score >= 40) return '#f97316';
        return '#ef4444';
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <button className="back-btn" onClick={onBack}><FaArrowLeft /> Quay lại</button>
                    <h2><FaChartPie /> Productivity Dashboard</h2>
                </div>
                <div className="dashboard-loading">
                    <div className="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <button className="back-btn" onClick={onBack}><FaArrowLeft /> Quay lại</button>
                <h2><FaChartPie /> Productivity Dashboard</h2>
            </div>

            {/* Controls */}
            <div className="dashboard-controls">
                <div className="date-range-group">
                    <label>
                        Từ:
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="dashboard-date-input"
                        />
                    </label>
                    <label>
                        Đến:
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="dashboard-date-input"
                        />
                    </label>
                </div>
                <div className="unit-selector">
                    <button
                        className={`unit-btn ${unit === 'week' ? 'active' : ''}`}
                        onClick={() => setUnit('week')}
                    >
                        Tuần
                    </button>
                    <button
                        className={`unit-btn ${unit === 'month' ? 'active' : ''}`}
                        onClick={() => setUnit('month')}
                    >
                        Tháng
                    </button>
                </div>
            </div>

            {error && <div className="dashboard-error">{error}</div>}

            {stats && (
                <>
                    {/* Cumulative Score */}
                    <div className="score-card">
                        <div className="score-icon"><FaTrophy size={28} /></div>
                        <div className="score-info">
                            <span className="score-label">Điểm năng suất trung bình</span>
                            <span
                                className="score-value"
                                style={{ color: getScoreColor(scorePercent) }}
                            >
                                {scorePercent.toFixed(1)} <span className="score-unit">/ 100</span>
                            </span>
                        </div>
                        <div className="score-bar-container">
                            <div
                                className="score-bar-fill"
                                style={{
                                    width: `${scorePercent}%`,
                                    background: `linear-gradient(90deg, ${getScoreColor(scorePercent)}, ${getScoreColor(scorePercent)}cc)`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="charts-grid">
                        {/* Pie Chart */}
                        <div className="chart-card">
                            <h3>Tỉ lệ hoàn thành</h3>
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={90}
                                            paddingAngle={3}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, idx) => (
                                                <Cell key={idx} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: 'rgba(255,255,255,0.95)',
                                                borderRadius: '10px',
                                                border: 'none',
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                                fontSize: '0.85rem',
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '0.8rem' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty">Chưa có dữ liệu</div>
                            )}
                        </div>

                        {/* Stacked Column + Line Chart */}
                        <div className="chart-card chart-wide">
                            <h3>Phân bổ theo mức ưu tiên & điểm trung bình</h3>
                            {stats.stacked_column_data?.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <ComposedChart data={stats.stacked_column_data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                        <XAxis
                                            dataKey="period"
                                            tick={{ fontSize: 11 }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            tick={{ fontSize: 11 }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                            label={{ value: 'Số task', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#94a3b8' } }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            tick={{ fontSize: 11 }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                            domain={[0, 100]}
                                            label={{ value: 'Điểm TB', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#94a3b8' } }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'rgba(255,255,255,0.95)',
                                                borderRadius: '10px',
                                                border: 'none',
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                                fontSize: '0.8rem',
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                                        <Bar yAxisId="left" dataKey="Priority" stackId="a" fill={PRIORITY_COLORS.Priority} radius={[0, 0, 0, 0]} />
                                        <Bar yAxisId="left" dataKey="Important" stackId="a" fill={PRIORITY_COLORS.Important} />
                                        <Bar yAxisId="left" dataKey="Necessary" stackId="a" fill={PRIORITY_COLORS.Necessary} />
                                        <Bar yAxisId="left" dataKey="Normal" stackId="a" fill={PRIORITY_COLORS.Normal} radius={[4, 4, 0, 0]} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty">Chưa có dữ liệu</div>
                            )}
                        </div>

                        {/* Line Chart - Average Scores */}
                        <div className="chart-card chart-wide">
                            <h3>Điểm năng suất trung bình theo {unit === 'week' ? 'tuần' : 'tháng'}</h3>
                            {stats.line_chart_data?.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={stats.line_chart_data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                        <XAxis
                                            dataKey="period"
                                            tick={{ fontSize: 11 }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{ fontSize: 11 }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'rgba(255,255,255,0.95)',
                                                borderRadius: '10px',
                                                border: 'none',
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                                fontSize: '0.85rem',
                                            }}
                                        />
                                        <defs>
                                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area
                                            type="monotone"
                                            dataKey="avg_score"
                                            stroke="none"
                                            fill="url(#scoreGradient)"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="avg_score"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 7, fill: '#4f46e5' }}
                                            name="Điểm TB"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty">Chưa có dữ liệu</div>
                            )}
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="summary-stats">
                        <div className="stat-item">
                            <span className="stat-number" style={{ color: COLORS.early }}>{stats.pie_data?.early || 0}</span>
                            <span className="stat-label">Sớm hạn</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number" style={{ color: COLORS.on_time }}>{stats.pie_data?.on_time || 0}</span>
                            <span className="stat-label">Đúng hạn</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number" style={{ color: COLORS.late }}>{stats.pie_data?.late || 0}</span>
                            <span className="stat-label">Trễ hạn</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number" style={{ color: '#1e293b' }}>{stats.pie_data?.total || 0}</span>
                            <span className="stat-label">Tổng cộng</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
