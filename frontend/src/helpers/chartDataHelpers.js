/**
 * Chart Data Helpers
 * ==================
 * Transforms raw API analytics response into Chart.js-compatible datasets.
 * Each builder returns { data, options } ready to pass to react-chartjs-2 components.
 */

// ── Color Palette ──
const COLORS = {
    indigo: '#6366f1',
    emerald: '#10b981',
    rose: '#f43f5e',
    amber: '#f59e0b',
    sky: '#0ea5e9',
    violet: '#8b5cf6',
    slate: '#64748b',
    orange: '#f97316',
};

const PRIORITY_COLORS = {
    '  Ưu tiên': '#ef4444',
    '  Quan trọng': '#f97316',
    '  Cần thiết': '#3b82f6',
    '  Bình thường': '#94a3b8',
};

const PRIORITY_MAPPING = {
    Priority: '  Ưu tiên',
    Important: '  Quan trọng',
    Necessary: '  Cần thiết',
    Normal: '  Bình thường',
};

// ── Shared tooltip / grid options ──
const sharedTooltip = {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    titleColor: '#f1f5f9',
    bodyColor: '#cbd5e1',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    cornerRadius: 8,
    padding: 10,
    bodyFont: { size: 12 },
    titleFont: { size: 13, weight: '600' },
};

const sharedGrid = {
    color: 'rgba(148, 163, 184, 0.12)',
    drawBorder: false,
};

const sharedTick = {
    color: '#94a3b8',
    font: { size: 11 },
};

const sharedLegend = {
    labels: {
        color: '#94a3b8',
        font: { size: 12 },
        usePointStyle: true,
        boxWidth: 8,
        padding: 16,
    },
};

// ═══════════════════════════════════════════
// 1. Workload Trend — Line Chart (2 lines)
// ═══════════════════════════════════════════
export function buildWorkloadTrendData(workloadTrend) {
    const labels = workloadTrend.map(d => d.period);
    return {
        data: {
            labels,
            datasets: [
                {
                    label: '  Việc mới',
                    data: workloadTrend.map(d => d.new_tasks),
                    borderColor: COLORS.sky,
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointBackgroundColor: COLORS.sky,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                },
                {
                    label: '  Đã hoàn thành',
                    data: workloadTrend.map(d => d.completed_tasks),
                    borderColor: COLORS.emerald,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointBackgroundColor: COLORS.emerald,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: sharedLegend,
                tooltip: sharedTooltip,
            },
            scales: {
                x: { ticks: sharedTick, grid: { ...sharedGrid, display: false } },
                y: {
                    beginAtZero: true,
                    ticks: { ...sharedTick, stepSize: 1 },
                    grid: sharedGrid,
                },
            },
        },
    };
}

// ═══════════════════════════════════════════
// 2. Priority Mix — Doughnut Chart
// ═══════════════════════════════════════════
export function buildPriorityMixData(priorityMix) {
    const entries = Object.entries(priorityMix).filter(([, v]) => v > 0);
    const mappedEntries = entries.map(([k, v]) => [
        PRIORITY_MAPPING[k] || k,
        v,
        PRIORITY_COLORS[PRIORITY_MAPPING[k] || k] || COLORS.slate
    ]);

    return {
        data: {
            labels: mappedEntries.map(([k]) => k),
            datasets: [
                {
                    data: mappedEntries.map(([, v]) => v),
                    backgroundColor: mappedEntries.map(([, , c]) => c),
                    borderWidth: 0,
                    hoverOffset: 8,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { ...sharedLegend, position: 'bottom' },
                tooltip: sharedTooltip,
            },
        },
    };
}

// ═══════════════════════════════════════════
// 3. Punctuality — Grouped Bar Chart
// ═══════════════════════════════════════════
export function buildPunctualityData(punctuality) {
    const labels = punctuality.map(d => d.period);
    return {
        data: {
            labels,
            datasets: [
                {
                    label: '  Sớm/Đúng hạn',
                    data: punctuality.map(d => d.on_time),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderRadius: 4,
                    barPercentage: 0.7,
                    categoryPercentage: 0.6,
                },
                {
                    label: '  Trễ hạn',
                    data: punctuality.map(d => d.overdue),
                    backgroundColor: 'rgba(244, 63, 94, 0.8)',
                    borderRadius: 4,
                    barPercentage: 0.7,
                    categoryPercentage: 0.6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: sharedLegend,
                tooltip: sharedTooltip,
            },
            scales: {
                x: { ticks: sharedTick, grid: { ...sharedGrid, display: false } },
                y: {
                    beginAtZero: true,
                    ticks: { ...sharedTick, stepSize: 1 },
                    grid: sharedGrid,
                },
            },
        },
    };
}

// ═══════════════════════════════════════════
// 4. Score Trend — Area Chart
// ═══════════════════════════════════════════
export function buildScoreTrendData(scoreTrend) {
    const labels = scoreTrend.map(d => d.period);
    return {
        data: {
            labels,
            datasets: [
                {
                    label: '  Điểm trung bình',
                    data: scoreTrend.map(d => d.avg_score),
                    borderColor: COLORS.violet,
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: COLORS.violet,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: sharedLegend,
                tooltip: sharedTooltip,
            },
            scales: {
                x: { ticks: sharedTick, grid: { ...sharedGrid, display: false } },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: sharedTick,
                    grid: sharedGrid,
                },
            },
        },
    };
}

// ═══════════════════════════════════════════
// 5. Weekday Activity — Bar Chart
// ═══════════════════════════════════════════
export function buildWeekdayActivityData(weekdayActivity) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = days.map(d => weekdayActivity[d] || 0);
    const maxVal = Math.max(...values, 1);

    return {
        data: {
            labels: days,
            datasets: [
                {
                    label: '  Đã hoàn thành',
                    data: values,
                    backgroundColor: values.map(v =>
                        `rgba(99, 102, 241, ${0.3 + (v / maxVal) * 0.7})`
                    ),
                    borderRadius: 6,
                    barPercentage: 0.65,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: sharedTooltip,
            },
            scales: {
                x: { ticks: sharedTick, grid: { ...sharedGrid, display: false } },
                y: {
                    beginAtZero: true,
                    ticks: { ...sharedTick, stepSize: 1 },
                    grid: sharedGrid,
                },
            },
        },
    };
}

// ═══════════════════════════════════════════
// 6. Lead Time — Bar Chart
// ═══════════════════════════════════════════
export function buildLeadTimeData(leadTime) {
    const labels = leadTime.map(d => d.period);
    return {
        data: {
            labels,
            datasets: [
                {
                    label: '  Số ngày trung bình',
                    data: leadTime.map(d => d.avg_days),
                    backgroundColor: 'rgba(245, 158, 11, 0.7)',
                    borderRadius: 6,
                    barPercentage: 0.6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: sharedTooltip,
            },
            scales: {
                x: { ticks: sharedTick, grid: { ...sharedGrid, display: false } },
                y: {
                    beginAtZero: true,
                    ticks: sharedTick,
                    grid: sharedGrid,
                    title: { display: true, text: 'Số ngày', color: '#94a3b8', font: { size: 11 } },
                },
            },
        },
    };
}

// ═══════════════════════════════════════════
// 7. Cumulative Backlog — Area Chart
// ═══════════════════════════════════════════
export function buildBacklogData(backlog) {
    const labels = backlog.map(d => d.period);
    return {
        data: {
            labels,
            datasets: [
                {
                    label: '  Số ngày tồn đọng',
                    data: backlog.map(d => d.backlog),
                    borderColor: COLORS.rose,
                    backgroundColor: 'rgba(244, 63, 94, 0.12)',
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: COLORS.rose,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: sharedTooltip,
            },
            scales: {
                x: { ticks: sharedTick, grid: { ...sharedGrid, display: false } },
                y: {
                    beginAtZero: true,
                    ticks: { ...sharedTick, stepSize: 1 },
                    grid: sharedGrid,
                },
            },
        },
    };
}
