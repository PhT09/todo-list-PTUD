import { useState, useEffect, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Calendar } from 'primereact/calendar';
import { todoApi } from '../api/todoApi';
import {
    FaArrowLeft,
    FaChartLine,
    FaTasks,
    FaCheckCircle,
    FaStar,
    FaArrowUp,
    FaArrowDown,
} from 'react-icons/fa';
import {
    buildWorkloadTrendData,
    buildPriorityMixData,
    buildPunctualityData,
    buildScoreTrendData,
    buildWeekdayActivityData,
    buildLeadTimeData,
    buildBacklogData,
} from '../helpers/chartDataHelpers';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

// ── Month Picker Helpers ──
function getMonthOptions() {
    const options = [];
    const now = new Date();
    for (let i = 24; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = d.toISOString().slice(0, 7); // YYYY-MM
        const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        options.push({ value, label });
    }
    return options;
}

function monthToStartDate(ym) {
    return new Date(ym + '-01').toISOString();
}

function monthToEndDate(ym) {
    const [y, m] = ym.split('-').map(Number);
    const last = new Date(y, m, 0); // last day of month
    last.setHours(23, 59, 59);
    return last.toISOString();
}

// ══════════════════════════════════════════════
// Dashboard Component
// ══════════════════════════════════════════════
const Dashboard = ({ onBack }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [startDate, setStartDate] = useState(sixMonthsAgo);
    const [endDate, setEndDate] = useState(now);
    const [unit, setUnit] = useState('month');

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const startStr = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), 1).toISOString() : new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1).toISOString();

            let endStr = new Date().toISOString();
            if (endDate) {
                const endMonthLastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0, 23, 59, 59);
                endStr = endMonthLastDay.toISOString();
            }

            const params = {
                start_date: startStr,
                end_date: endStr,
                unit,
            };
            const res = await todoApi.getAnalyticsStats(params);
            setStats(res.data);
        } catch (err) {
            setError('Failed to load analytics: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [startDate, endDate, unit]);


    // ── Build chart configs ──
    const charts = useMemo(() => {
        if (!stats) return null;
        return {
            workload: buildWorkloadTrendData(stats.workload_trend || []),
            priority: buildPriorityMixData(stats.priority_mix || {}),
            punctuality: buildPunctualityData(stats.punctuality || []),
            score: buildScoreTrendData(stats.score_trend || []),
            weekday: buildWeekdayActivityData(stats.weekday_activity || {}),
            leadTime: buildLeadTimeData(stats.lead_time || []),
            backlog: buildBacklogData(stats.cumulative_backlog || []),
        };
    }, [stats]);

    // ── Loading State ──
    if (loading) {
        return (
            <div className="report-container">
                <div className="report-header">
                    <button className="back-btn" onClick={onBack}><FaArrowLeft /> Back</button>
                    <h2><FaChartLine /> Productivity Report</h2>
                </div>
                <div className="dashboard-loading">
                    <div className="spinner"></div>
                    <p>Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="report-container">
            {/* ── Header & Filters ── */}
            <div className="report-header">
                <button className="back-btn" onClick={onBack}><FaArrowLeft />Trở lại</button>
                <h2><FaChartLine /> Productivity Report</h2>
            </div>

            <div className="report-filters">
                <div className="month-pickers">
                    <label>
                        Từ tháng:
                        <Calendar
                            view="month"
                            dateFormat="mm/yy"
                            value={startDate}
                            onChange={(e) => setStartDate(e.value)}
                            readOnlyInput
                            maxDate={endDate || new Date()}
                        />
                    </label>
                    <label>
                        Đến tháng:
                        <Calendar
                            view="month"
                            dateFormat="mm/yy"
                            value={endDate}
                            onChange={(e) => setEndDate(e.value)}
                            readOnlyInput
                            minDate={startDate}
                        />
                    </label>
                </div>
                <div className="unit-toggle">
                    <button
                        className={`toggle-btn ${unit === 'week' ? 'active' : ''}`}
                        onClick={() => setUnit('week')}
                    >
                        Tuần
                    </button>
                    <button
                        className={`toggle-btn ${unit === 'month' ? 'active' : ''}`}
                        onClick={() => setUnit('month')}
                    >
                        Tháng
                    </button>
                </div>
            </div>

            {error && <div className="report-error">{error}</div>}

            {stats && charts && (
                <>
                    {/* ── KPI Cards ── */}
                    <div className="kpi-row">
                        <div className="kpi-card">
                            <div className="kpi-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
                                <FaTasks />
                            </div>
                            <div className="kpi-body">
                                <span className="kpi-label">Tổng số công việc</span>
                                <span className="kpi-value">{stats.kpi.total_tasks}</span>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                                <FaCheckCircle />
                            </div>
                            <div className="kpi-body">
                                <span className="kpi-label">Đã hoàn thành</span>
                                <span className="kpi-value">{stats.kpi.completed_tasks}</span>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                                <FaStar />
                            </div>
                            <div className="kpi-body">
                                <span className="kpi-label">Điểm trung bình</span>
                                <span className="kpi-value">{stats.kpi.avg_score}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Chart Row 1: Workload (60%) + Priority (40%) ── */}
                    <div className="chart-row chart-row-64">
                        <div className="chart-panel panel-60">
                            <h3>Xu hướng công việc</h3>
                            <div className="chart-canvas">
                                <Line data={charts.workload.data} options={charts.workload.options} />
                            </div>
                        </div>
                        <div className="chart-panel panel-40">
                            <h3>Cơ cấu theo độ ưu tiên</h3>
                            <div className="chart-canvas">
                                <Doughnut data={charts.priority.data} options={charts.priority.options} />
                            </div>
                        </div>
                    </div>

                    {/* ── Chart Row 2: Punctuality (50%) + Score Trend (50%) ── */}
                    <div className="chart-row chart-row-50">
                        <div className="chart-panel">
                            <h3>Đúng hạn / Trễ hạn</h3>
                            <div className="chart-canvas">
                                <Bar data={charts.punctuality.data} options={charts.punctuality.options} />
                            </div>
                        </div>
                        <div className="chart-panel">
                            <h3>Biến động điểm số</h3>
                            <div className="chart-canvas">
                                <Line data={charts.score.data} options={charts.score.options} />
                            </div>
                        </div>
                    </div>

                    {/* ── Chart Row 3: Weekday / Lead Time / Backlog (1/3 each) ── */}
                    <div className="chart-row chart-row-33">
                        <div className="chart-panel">
                            <h3>Thứ trong tuần</h3>
                            <div className="chart-canvas">
                                <Bar data={charts.weekday.data} options={charts.weekday.options} />
                            </div>
                        </div>
                        <div className="chart-panel">
                            <h3>Thời gian xử lý trung bình</h3>
                            <div className="chart-canvas">
                                <Bar data={charts.leadTime.data} options={charts.leadTime.options} />
                            </div>
                        </div>
                        <div className="chart-panel">
                            <h3>Thời gian chờ</h3>
                            <div className="chart-canvas">
                                <Line data={charts.backlog.data} options={charts.backlog.options} />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
