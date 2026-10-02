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
import { ErrorNotice, LoadingNotice } from '../components/RequestState';
import { getRequestErrorMessage } from '../requestErrors';

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
    const [isLoading, setIsLoading] = useState(true);
    const [isApplying, setIsApplying] = useState(false);
    const [error, setError] = useState('');

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

    const handleApply = async () => {
        setIsApplying(true);
        setError('');
        try {
            const auditResponse = await api.get('/audit-logs/');
            await loadAnalytics();
            setRecentAuditLogs(auditResponse.data.slice(0, 6));
        } catch (requestError) {
            console.error('Analytics filter failed', requestError);
            setError(getRequestErrorMessage(requestError, t('Unable to load analytics.')));
        } finally {
            setIsApplying(false);
        }
    };

    useEffect(() => {
        const loadInitialAnalytics = async () => {
            try {
                const [metricsResponse, flagsResponse, usageResponse, auditResponse] = await Promise.all([
                    api.get('/analytics/metrics'),
                    api.get('/analytics/flags'),
                    api.get('/analytics/usage'),
                    api.get('/audit-logs/')
                ]);
                setMetrics(metricsResponse.data);
                setFlagData(flagsResponse.data.flags);
                setUsageData(usageResponse.data.environments);
                setRecentAuditLogs(auditResponse.data.slice(0, 6));
            } catch (requestError) {
                console.error('Analytics sync failed', requestError);
                setError(getRequestErrorMessage(requestError, t('Unable to load analytics.')));
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialAnalytics();
    }, [t]);

    return (
        <section className="min-w-0 space-y-5 sm:space-y-8">
            {error && <ErrorNotice message={error} onRetry={handleApply} retryLabel={t('Retry')} />}
            <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-blue-600">{t('Analytics')}</p>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{t('Usage overview')}</h2>
                </div>
                <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-2 md:flex md:flex-wrap">
                    <label className="min-w-0 text-xs font-bold text-slate-500">
                        {t('From')}
                        <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block w-full min-w-0 rounded-xl border border-slate-200 p-2 text-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-auto" />
                    </label>
                    <label className="min-w-0 text-xs font-bold text-slate-500">
                        {t('To')}
                        <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block w-full min-w-0 rounded-xl border border-slate-200 p-2 text-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-auto" />
                    </label>
                    <button type="button" onClick={handleApply} disabled={isApplying} className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60 sm:col-span-2 md:col-span-1">
                        {isApplying ? t('PLEASE WAIT...') : t('APPLY')}
                    </button>
                </div>
            </div>

            {isLoading ? <LoadingNotice message={t('Loading analytics...')} /> : <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {[
                    [t('Total Flags'), metrics?.total_flags ?? 0, 'text-blue-600'],
                    [t('Active Flags'), metrics?.active_flags ?? 0, 'text-green-600'],
                    [t("Today's Evaluations"), metrics?.todays_evaluations ?? 0, 'text-orange-600'],
                    [t('Audit Logs Today'), metrics?.audit_logs_today ?? 0, 'text-purple-600']
                ].map(([label, value, color]) => (
                    <div key={label} className="min-w-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                        <p className="wrap-break-word text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs sm:tracking-widest">{label}</p>
                        <p className={`mt-2 wrap-break-word text-3xl font-black sm:mt-3 sm:text-4xl ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid min-w-0 gap-5 xl:grid-cols-2 sm:gap-8">
                <div className="min-w-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                    <h3 className="mb-4 text-base font-black text-slate-800 sm:text-lg">{t('Feature Evaluation Counts')}</h3>
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
                <div className="min-w-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                    <h3 className="mb-4 text-base font-black text-slate-800 sm:text-lg">{t('Environment Usage')}</h3>
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

            <section className="min-w-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="recent-audit-logs-heading">
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
                                    <p className="break-all text-sm text-slate-500">{log.details || t('No details available')}</p>
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
            </>}
        </section>
    );
};

export default AnalyticsOverview;
