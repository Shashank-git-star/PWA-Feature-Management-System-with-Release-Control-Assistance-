import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../api';
import { useLanguage } from '../i18n.jsx';

const COLORS = ['#2563eb', '#16a34a', '#f97316', '#9333ea', '#dc2626', '#0891b2'];
const indiaDateTime = (value, locale) => new Date(value).toLocaleString(locale, {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
});

const AnalyticsOverview = () => {
    const { t, locale } = useLanguage();
    const [metrics, setMetrics] = useState(null);
    const [flagData, setFlagData] = useState([]);
    const [usageData, setUsageData] = useState([]);
    const [recentAuditLogs, setRecentAuditLogs] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const loadAnalytics = async (selectedStartDate = startDate, selectedEndDate = endDate) => {
        const params = {};
        if (selectedStartDate) params.start_date = selectedStartDate;
        if (selectedEndDate) params.end_date = selectedEndDate;
        const [metricsResponse, flagsResponse, usageResponse] = await Promise.all([
            api.get('/analytics/metrics'),
            api.get('/analytics/flags', { params }),
            api.get('/analytics/usage', { params })
        ]);
        setMetrics(metricsResponse.data);
        setFlagData(flagsResponse.data.flags);
        setUsageData(usageResponse.data.environments);
    };

    useEffect(() => {
        const loadInitialAnalytics = async () => {
            try {
                const [metricsResponse, flagsResponse, usageResponse] = await Promise.all([
                    api.get('/analytics/metrics'),
                    api.get('/analytics/flags'),
                    api.get('/analytics/usage')
                ]);
                const auditResponse = await api.get('/audit-logs/');
                setMetrics(metricsResponse.data);
                setFlagData(flagsResponse.data.flags);
                setUsageData(usageResponse.data.environments);
                setRecentAuditLogs(auditResponse.data.slice(0, 6));
            } catch (error) {
                console.error('Analytics sync failed', error);
            }
        };
        loadInitialAnalytics();
    }, []);

    return (
        <section className="space-y-8">
            <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-blue-600">{t('Analytics')}</p>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">{t('Usage overview')}</h2>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                    <label className="text-xs font-bold text-slate-500">
                        {t('From')}
                        <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block rounded-xl border border-slate-200 p-2 text-sm" />
                    </label>
                    <label className="text-xs font-bold text-slate-500">
                        {t('To')}
                        <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block rounded-xl border border-slate-200 p-2 text-sm" />
                    </label>
                    <button type="button" onClick={() => loadAnalytics().catch((error) => console.error('Analytics sync failed', error))} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white">
                        {t('APPLY')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                    [t('Total Flags'), metrics?.total_flags ?? 0, 'text-blue-600'],
                    [t('Active Flags'), metrics?.active_flags ?? 0, 'text-green-600'],
                    [t("Today's Evaluations"), metrics?.todays_evaluations ?? 0, 'text-orange-600'],
                    [t('Audit Logs Today'), metrics?.audit_logs_today ?? 0, 'text-purple-600']
                ].map(([label, value, color]) => (
                    <div key={label} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
                        <p className={`mt-3 text-4xl font-black ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                    <h3 className="mb-4 text-lg font-black text-slate-800">{t('Feature Evaluation Counts')}</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={flagData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="flag_key" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="evaluation_count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                    <h3 className="mb-4 text-lg font-black text-slate-800">{t('Environment Usage')}</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={usageData} dataKey="evaluation_count" nameKey="environment" outerRadius={100} label>
                                {usageData.map((entry, index) => <Cell key={entry.environment_id} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm" aria-labelledby="recent-audit-logs-heading">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-blue-600">{t('Audit Logs')}</p>
                        <h3 id="recent-audit-logs-heading" className="text-xl font-black text-slate-900">{t('Recent Audit Logs')}</h3>
                    </div>
                    <Link to="/audit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-600">
                        {t('View all audit logs')}
                    </Link>
                </div>
                {recentAuditLogs.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-5 text-sm font-medium text-slate-500">{t('No recent audit logs')}</p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {recentAuditLogs.map((log) => (
                            <article key={log.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 first:pt-0 last:pb-0">
                                <div className="min-w-0">
                                    <p className="font-black text-slate-800">{t(log.action)}</p>
                                    <p className="truncate text-sm text-slate-500">{log.details || t('No details available')}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-400">
                                    <span>{t('User ID')}: {log.user_id ?? t('Not assigned')}</span>
                                    <time dateTime={log.created_at}>{indiaDateTime(log.created_at, locale)}</time>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </section>
    );
};

export default AnalyticsOverview;
