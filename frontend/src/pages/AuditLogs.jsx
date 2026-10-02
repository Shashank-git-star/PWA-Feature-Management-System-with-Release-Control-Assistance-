import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Clock, User, Eye, X, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { ErrorNotice, LoadingNotice } from '../components/RequestState';
import { getRequestErrorMessage } from '../requestErrors';

const AuditLogs = () => {
    const { t, language } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ user_id: '', flag_id: '', action: '', start_date: '', end_date: '' });
    const actions = [
        'CREATE_FLAG',
        'UPDATE_FLAG_SETTINGS',
        'ENABLE_FLAG',
        'DISABLE_FLAG',
        'UPDATE_ROLLOUT',
        'DELETE_FLAG',
        'CREATE_ENVIRONMENT',
        'UPDATE_ENVIRONMENT',
        'DELETE_ENVIRONMENT',
        'CREATE_OVERRIDE',
        'UPDATE_OVERRIDE',
        'DELETE_OVERRIDE',
        'CREATE_TARGETING_RULE',
        'UPDATE_TARGETING_RULE',
        'DELETE_TARGETING_RULE',
        'CREATE_GROUP',
        'UPDATE_USER_GROUP'
    ];
    const localeByLanguage = { en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN' };
    const indiaTime = (value, options) => new Date(value).toLocaleString(localeByLanguage[language] || 'en-IN', {
        ...options,
        timeZone: 'Asia/Kolkata'
    });
    const getChangedKey = (log) => {
        const [, ...targetParts] = (log.details || '').split('|');
        return targetParts.join('|').trim() || log.details || '—';
    };

    const getFilteredLogs = useCallback(() => {
        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
        return api.get('/audit-logs', { params });
    }, [filters]);

    const fetchLogs = useCallback(async () => {
        try {
            const res = await getFilteredLogs();
            setLogs(res.data);
        } catch (requestError) {
            console.error('Audit sync failed', requestError);
            setError(getRequestErrorMessage(requestError, t('Unable to load audit logs.')));
        } finally {
            setIsLoading(false);
        }
    }, [getFilteredLogs, t]);

    useEffect(() => {
        let isCurrent = true;
        getFilteredLogs().then((res) => {
            if (isCurrent) setLogs(res.data);
        }).catch((requestError) => {
            console.error('Audit sync failed', requestError);
            if (isCurrent) setError(getRequestErrorMessage(requestError, t('Unable to load audit logs.')));
        }).finally(() => {
            if (isCurrent) setIsLoading(false);
        });
        return () => { isCurrent = false; };
    }, [getFilteredLogs, t]);

    const updateFilter = (key, value) => {
        setError('');
        setIsLoading(true);
        setFilters((current) => ({ ...current, [key]: value }));
    };

    const retryFetchLogs = () => {
        setError('');
        setIsLoading(true);
        fetchLogs();
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 lg:space-y-10 animate-in fade-in duration-500 motion-reduce:animate-none">
            {/* Header Area */}
            <div className="flex min-w-0 flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:rounded-[2.5rem] sm:p-8 lg:p-10">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="text-blue-600" size={20} />
                        <span className="wrap-break-word text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 sm:tracking-[0.3em]">{t('Integrity Protocol')}</span>
                    </div>
                    <h1 className="wrap-break-word text-2xl font-black italic uppercase tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">{t('System Activity Logs')}</h1>
                </div>
                <div className="flex items-baseline gap-3 sm:block sm:text-right">
                    <span className="text-3xl font-black text-slate-300 sm:text-4xl">{logs.length}</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Total Events Recorded')}</p>
                </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-6 xl:grid-cols-5">
                <input inputMode="numeric" aria-label={t('User ID')} className="min-w-0 rounded-xl border border-slate-200 p-3 text-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder={t('User ID')} value={filters.user_id} onChange={(e) => updateFilter('user_id', e.target.value)} />
                <input inputMode="numeric" aria-label={t('Flag ID')} className="min-w-0 rounded-xl border border-slate-200 p-3 text-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder={t('Flag ID')} value={filters.flag_id} onChange={(e) => updateFilter('flag_id', e.target.value)} />
                <select aria-label={t('All actions')} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" value={filters.action} onChange={(e) => updateFilter('action', e.target.value)}>
                    <option value="">{t('All actions')}</option>
                    {actions.map((action) => <option key={action} value={action}>{t(action)}</option>)}
                </select>
                <label className="min-w-0 text-xs font-bold text-slate-500">{t('From')}<input type="date" aria-label={t('From')} className="mt-1 block w-full min-w-0 rounded-xl border border-slate-200 p-3 text-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" value={filters.start_date} onChange={(e) => updateFilter('start_date', e.target.value)} /></label>
                <label className="min-w-0 text-xs font-bold text-slate-500">{t('To')}<input type="date" aria-label={t('To')} className="mt-1 block w-full min-w-0 rounded-xl border border-slate-200 p-3 text-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" value={filters.end_date} onChange={(e) => updateFilter('end_date', e.target.value)} /></label>
            </div>

            <div className="space-y-3">
                {error && <ErrorNotice message={error} onRetry={retryFetchLogs} retryLabel={t('Retry')} />}
                {isLoading ? <LoadingNotice message={t('Loading audit logs...')} /> : !error && logs.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500">{t('No audit logs found')}</div>
                ) : logs.map((log) => (
                    <article key={log.id} className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md lg:grid-cols-[minmax(11rem,1.25fr)_minmax(6rem,0.7fr)_minmax(9rem,1fr)_minmax(9rem,1.25fr)_auto] lg:items-center lg:gap-4">
                        <div className="min-w-0">
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{t('Timestamp')}</span>
                            <time dateTime={log.created_at} className="mt-1 flex items-start gap-1.5 wrap-break-word text-xs font-bold text-slate-700 sm:text-sm">
                                <Clock size={14} className="mt-0.5 shrink-0 text-blue-500" />
                                {indiaTime(log.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                            </time>
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{t('Doer')}</span>
                            <span className="mt-1 flex items-center gap-1.5 wrap-break-word text-xs font-bold text-slate-700 sm:text-sm">
                                <User size={14} className="shrink-0 text-slate-400" /> {log.user_id ? `${t('User ID')}: ${log.user_id}` : t('Not assigned')}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{t('Action')}</span>
                            <span className="mt-1 inline-flex max-w-full wrap-break-word rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">{t(log.action)}</span>
                        </div>
                        <div className="col-span-2 min-w-0 lg:col-span-1">
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{t('Key (name) of what changed')}</span>
                            <span className="mt-1 block break-all text-sm font-bold text-slate-700">{getChangedKey(log)}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-blue-600 hover:text-white lg:col-span-1"
                        >
                            <Eye size={15} /> {t('View details')}
                        </button>
                    </article>
                ))}
            </div>
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setSelectedLog(null);
                }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="audit-details-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h2 id="audit-details-title" className="text-xl font-black text-slate-900">{t('Audit details')}</h2>
                                <p className="mt-1 break-all text-sm text-slate-500">{getChangedKey(selectedLog)}</p>
                            </div>
                            <button type="button" aria-label={t('Close')} onClick={() => setSelectedLog(null)} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="min-w-0 rounded-2xl border border-red-100 bg-red-50 p-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-red-700">{t('Previous')}</h3>
                                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap wrap-break-word font-mono text-sm text-red-900">{selectedLog.old_state ?? '—'}</pre>
                            </div>
                            <div className="min-w-0 rounded-2xl border border-green-100 bg-green-50 p-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-green-700">{t('Assigned')}</h3>
                                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap wrap-break-word font-mono text-sm text-green-900">{selectedLog.new_state ?? '—'}</pre>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};
export default AuditLogs;