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
import { Message } from 'primereact/message';
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
            const startStr = startDate
                ? new Date(startDate.getFullYear(), startDate.getMonth(), 1).toISOString()
                : new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1).toISOString();

            let endStr = new Date().toISOString();
            if (endDate) {
                const endMonthLastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0, 23, 59, 59);
                endStr = endMonthLastDay.toISOString();
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

    if (loading) {
        return (
            <div className="w-full">
                <div className="flex items-center justify-center gap-3 mb-5">
                    <Button
                        icon="pi pi-arrow-left"
                        onClick={onBack}
                        severity="secondary"
                        outlined
                        size="small"
                        className="fixed left-4 z-10 border border-[var(--color-glass-border)]"
                    />
                    <h2 className="text-main text-xl font-bold flex items-center gap-2">
                        Productivity Report
                    </h2>
                </div>
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-light">
                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-5">
                <Button
                    icon="pi pi-arrow-left"
                    onClick={onBack}
                    severity="secondary"
                    outlined
                    size="small"
                    className="fixed left-4 z-10 border border-[var(--color-glass-border)]"
                />
                <h2 className="text-main text-xl font-bold flex items-center gap-2">
                    Productivity Report
                </h2>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-center gap-4 card-bg border border-[var(--color-glass-border)] rounded-xl p-3 mb-5 flex-wrap">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-light font-medium">
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
                    <label className="flex items-center gap-2 text-sm text-light font-medium">
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
                        <Card className="shadow-none border border-[var(--color-glass-border)]" style={{ background: 'var(--color-card-bg)', borderRadius: '14px' }}>
                            <div className="flex items-center gap-3.5 m-2">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg shrink-0 bg-sky-500/15 text-sky-500">
                                    <i className="pi pi-list"></i>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[0.6rem] text-light font-medium uppercase tracking-wide">Tổng số công việc</span>
                                    <span className="text-2xl font-bold text-main leading-tight">{stats.kpi.total_tasks}</span>
                                </div>
                            </div>
                        </Card>
                        <Card className="shadow-none border border-[var(--color-glass-border)]" style={{ background: 'var(--color-card-bg)', borderRadius: '14px' }}>
                            <div className="flex items-center gap-3.5 m-2">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg shrink-0 bg-emerald-500/15 text-emerald-500">
                                    <i className="pi pi-check-circle"></i>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[0.6rem] text-light font-medium uppercase tracking-wide">Đã hoàn thành</span>
                                    <span className="text-2xl font-bold text-main leading-tight">{stats.kpi.completed_tasks}</span>
                                </div>
                            </div>
                        </Card>
                        <Card className="shadow-none border border-[var(--color-glass-border)]" style={{ background: 'var(--color-card-bg)', borderRadius: '14px' }}>
                            <div className="flex items-center gap-3.5 m-2">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg shrink-0 bg-blue-500/15 text-blue-500">
                                    <i className="pi pi-star"></i>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[0.6rem] text-light font-medium uppercase tracking-wide">Điểm trung bình</span>
                                    <span className="text-2xl font-bold text-main leading-tight">{stats.kpi.avg_score}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Chart Row 1 */}
                    <div className="grid grid-cols-[6fr_4fr] gap-4 mb-4 max-md:grid-cols-1">
                        <Card className="shadow-none border border-[var(--color-glass-border)] p-2" style={{ background: 'var(--color-card-bg)', borderRadius: '14px' }}>
                            <h3 className="text-main text-sm font-semibold mb-3">Xu hướng công việc</h3>
                            <div className="relative w-full h-[260px]">
                                <Line data={charts.workload.data} options={charts.workload.options} />
                            </div>
                        </Card>
                        <Card className="shadow-none border border-[var(--color-glass-border)] p-2" style={{ background: 'var(--color-card-bg)', borderRadius: '14px' }}>
                            <h3 className="text-main text-sm font-semibold mb-3">Cơ cấu theo độ ưu tiên</h3>
                            <div className="relative w-full h-[260px]">
                                <Doughnut data={charts.priority.data} options={charts.priority.options} />
                            </div>
                        </Card>
                    </div>

                    {/* Chart Row 2 */}
                    <div className="grid grid-cols-2 gap-4 mb-4 max-md:grid-cols-1">
                        <Card className="shadow-none border border-[var(--color-glass-border)] p-2" style={{ background: 'var(--color-card-bg)', borderRadius: '14px' }}>
                            <h3 className="text-main text-sm font-semibold mb-3">Đúng hạn / Trễ hạn</h3>
                            <div className="relative w-full h-[260px]">
                                <Bar data={charts.punctuality.data} options={charts.punctuality.options} />
                            </div>
                        </Card>
                        <Card className="shadow-none border border-[var(--color-glass-border)] p-2" style={{ background: 'var(--color-card-bg)', borderRadius: '14px' }}>
                            <h3 className="text-main text-sm font-semibold mb-3">Biến động điểm số</h3>
                            <div className="relative w-full h-[260px]">
                                <Line data={charts.score.data} options={charts.score.options} />
                            </div>
                        </Card>
                    </div>

                    {/* Chart Row 3 */}
                    <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                        <Card className="shadow-none border border-[var(--color-glass-border)] p-2" style={{ background: 'var(--color-card-bg)', borderRadius: '14px' }}>
                            <h3 className="text-main text-sm font-semibold mb-3">Thứ trong tuần</h3>
                            <div className="relative w-full h-[260px]">
                                <Bar data={charts.weekday.data} options={charts.weekday.options} />
                            </div>
                        </Card>
                        <Card className="shadow-none border border-[var(--color-glass-border)] p-2" style={{ background: 'var(--color-card-bg)', borderRadius: '14px' }}>
                            <h3 className="text-main text-sm font-semibold mb-3">Thời gian xử lý trung bình</h3>
                            <div className="relative w-full h-[260px]">
                                <Bar data={charts.leadTime.data} options={charts.leadTime.options} />
                            </div>
                        </Card>
                        <Card className="shadow-none border border-[var(--color-glass-border)] p-2" style={{ background: 'var(--color-card-bg)', borderRadius: '14px' }}>
                            <h3 className="text-main text-sm font-semibold mb-3">Thời gian chờ</h3>
                            <div className="relative w-full h-[260px]">
                                <Line data={charts.backlog.data} options={charts.backlog.options} />
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
