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
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { todoApi } from '../api/todoApi';
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

const unitOptions = [
    { label: 'Tuần', value: 'week' },
    { label: 'Tháng', value: 'month' },
];

// ── Reusable Chart Card ──
const ChartCard = ({ title, children }) => (
    <Card className="chart-card shadow-none border border-[var(--color-glass-border)] p-3">
        <h3 className="text-sm font-semibold text-main mb-3">{title}</h3>
        <div className="relative w-full h-[260px]">
            {children}
        </div>
    </Card>
);

// ── Reusable KPI Card ──
const KpiCard = ({ icon, iconClass, label, value }) => (
    <Card className="chart-card shadow-none border border-[var(--color-glass-border)]">
        <div className="flex items-center gap-3.5 m-2">
            <div className={`flex shrink-0 items-center justify-center w-12 h-12 rounded-xl text-lg ${iconClass}`}>
                <i className={icon}></i>
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-[0.6rem] font-medium uppercase tracking-wide text-light">{label}</span>
                <span className="text-2xl font-bold leading-tight text-main">{value}</span>
            </div>
        </div>
    </Card>
);

const Dashboard = ({ onBack }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [startDate, setStartDate] = useState(sixMonthsAgo);
    const [endDate, setEndDate] = useState(now);
    const [unit, setUnit] = useState('month');

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const startRaw = startDate
                ? new Date(startDate.getFullYear(), startDate.getMonth(), 1)
                : new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1);
            const startStr = formatDate(startRaw);

            let endStr = formatDate(new Date());
            if (endDate) {
                const endMonthLastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
                endStr = formatDate(endMonthLastDay);
            }

            const params = { start_date: startStr, end_date: endStr, unit };
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

    // ── Shared header with back button ──
    const DashboardHeader = () => (
        <div className="flex items-center justify-center gap-3 mb-5">
            <Button
                icon="pi pi-arrow-left"
                onClick={onBack}
                severity="secondary"
                outlined
                size="small"
                className="absolute left-4 z-10 border border-[var(--color-glass-border)]"
            />
            <h2 className="text-xl font-bold text-main flex items-center gap-2">
                Productivity Report
            </h2>
        </div>
    );

    if (loading) {
        return (
            <div className="w-full">
                <DashboardHeader />
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-light">
                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <DashboardHeader />

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-center gap-4 p-3 mb-5 card-bg rounded-xl max-sm:gap-2">
                <div className="flex flex-wrap items-center gap-4 max-sm:gap-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-light">
                        Từ tháng:
                        <Calendar
                            view="month"
                            dateFormat="mm-yy"
                            value={startDate}
                            onChange={(e) => setStartDate(e.value)}
                            readOnlyInput
                            maxDate={endDate || new Date()}
                        />
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-light">
                        Đến tháng:
                        <Calendar
                            view="month"
                            dateFormat="mm-yy"
                            value={endDate}
                            onChange={(e) => setEndDate(e.value)}
                            readOnlyInput
                            minDate={startDate}
                        />
                    </label>
                </div>
                <SelectButton
                    value={unit}
                    options={unitOptions}
                    onChange={(e) => e.value && setUnit(e.value)}
                />
            </div>

            {error && (
                <div className="p-message p-message-error w-full mb-3">
                    <div className="p-message-wrapper">
                        <div className="p-message-text">
                            {error}
                        </div>
                    </div>
                </div>
            )}

            {stats && charts && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-5 max-md:grid-cols-1">
                        <KpiCard icon="pi pi-list" iconClass="bg-sky-500/15 text-sky-500" label="Tổng số công việc" value={stats.kpi.total_tasks} />
                        <KpiCard icon="pi pi-check-circle" iconClass="bg-emerald-500/15 text-emerald-500" label="Đã hoàn thành" value={stats.kpi.completed_tasks} />
                        <KpiCard icon="pi pi-star" iconClass="bg-blue-500/15 text-blue-500" label="Điểm trung bình" value={stats.kpi.avg_score} />
                    </div>

                    {/* Chart Row 1 */}
                    <div className="grid grid-cols-[6fr_4fr] gap-4 mb-4 max-md:grid-cols-1">
                        <ChartCard title="Xu hướng công việc">
                            <Line data={charts.workload.data} options={charts.workload.options} />
                        </ChartCard>
                        <ChartCard title="Cơ cấu theo độ ưu tiên">
                            <Doughnut data={charts.priority.data} options={charts.priority.options} />
                        </ChartCard>
                    </div>

                    {/* Chart Row 2 */}
                    <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
                        <ChartCard title="Đúng hạn / Trễ hạn">
                            <Bar data={charts.punctuality.data} options={charts.punctuality.options} />
                        </ChartCard>
                        <ChartCard title="Biến động điểm số">
                            <Line data={charts.score.data} options={charts.score.options} />
                        </ChartCard>
                    </div>

                    {/* Chart Row 3 */}
                    <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1 dashboard-grid-3">
                        <ChartCard title="Thứ trong tuần">
                            <Bar data={charts.weekday.data} options={charts.weekday.options} />
                        </ChartCard>
                        <ChartCard title="Thời gian xử lý trung bình">
                            <Bar data={charts.leadTime.data} options={charts.leadTime.options} />
                        </ChartCard>
                        <ChartCard title="Thời gian chờ">
                            <Line data={charts.backlog.data} options={charts.backlog.options} />
                        </ChartCard>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
