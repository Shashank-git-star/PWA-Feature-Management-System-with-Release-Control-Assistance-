import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Clock, User, HardDrive, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { ErrorNotice, LoadingNotice } from '../components/RequestState';
import { getRequestErrorMessage } from '../requestErrors';

const AuditLogs = () => {
    const { t, language } = useLanguage();
    const [logs, setLogs] = useState([]);
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
        'DELETE_TARGETING_RULE',
        'CREATE_GROUP',
        'UPDATE_USER_GROUP'
    ];
    const localeByLanguage = { en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN' };
    const indiaTime = (value, options) => new Date(value).toLocaleString(localeByLanguage[language] || 'en-IN', {
        ...options,
        timeZone: 'Asia/Kolkata'
    });

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

            {/* Timeline View */}
            <div className="space-y-4">
                {error && <ErrorNotice message={error} onRetry={retryFetchLogs} retryLabel={t('Retry')} />}
                {isLoading ? <LoadingNotice message={t('Loading audit logs...')} /> : !error && logs.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500">{t('No audit logs found')}</div>
                ) : logs.map((log) => (
                    <article key={log.id} className="group grid min-w-0 grid-cols-1 gap-5 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-lg sm:p-6 md:grid-cols-[minmax(8rem,0.65fr)_minmax(0,1.35fr)] xl:grid-cols-[minmax(8rem,0.65fr)_minmax(0,1.35fr)_minmax(18rem,1.5fr)]">
                        {/* Timestamp Block */}
                        <div className="flex min-w-0 items-center gap-3 border-b border-slate-100 pb-4 md:items-start md:border-b-0 md:border-r md:pb-0 md:pr-5 xl:flex-col xl:items-center xl:justify-center">
                            <Clock size={16} className="text-slate-300 mb-1" />
                            <div className="min-w-0 xl:text-center">
                                <time dateTime={log.created_at} className="block wrap-break-word text-xs font-black uppercase tracking-tight text-slate-500 sm:text-[13px]">
                                    {indiaTime(log.created_at, { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                                </time>
                                <span className="block wrap-break-word text-sm font-bold text-slate-400">
                                    {indiaTime(log.created_at, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </span>
                            </div>
                        </div>

                        {/* Doer & Action */}
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-blue-600 group-hover:text-white sm:h-12 sm:w-12">
                                <User size={20} aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="wrap-break-word font-black tracking-tight text-slate-800">
                                    {t('User ID')}: {log.user_id ?? t('Not assigned')}
                                </h3>
                                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                                    <span className="max-w-full wrap-break-word rounded-full bg-blue-50 px-3 py-1 text-[9px] font-black uppercase text-blue-600">
                                        {t(log.action)}
                                    </span>
                                    <span className="flex min-w-0 items-start gap-1 break-all text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                        <HardDrive className="mt-0.5 shrink-0" size={10} aria-hidden="true" /> <span className="min-w-0">{log.details}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Change details */}
                        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:gap-3 sm:p-4 md:col-span-2 xl:col-span-1">
                           <div className="min-w-0 text-left">
                               <p className="mb-1 wrap-break-word text-[10px] font-black uppercase tracking-wider text-slate-400 sm:text-xs">{t('Previous')}</p>
                               <span className="block max-w-full whitespace-pre-wrap wrap-break-word rounded-lg border border-red-100 bg-red-50/50 px-2 py-2 font-mono text-[11px] font-bold text-red-500 line-through sm:px-3 sm:text-xs">
                                   {log.old_state || 'NULL'}
                               </span>
                           </div>
                           <ArrowRight className="mt-8 rotate-90 text-slate-300 sm:rotate-0" size={14} aria-hidden="true" />
                           <div className="min-w-0 text-left">
                               <p className="mb-1 wrap-break-word text-[10px] font-black uppercase tracking-wider text-slate-400 sm:text-xs">{t('Assigned')}</p>
                               <span className="block max-w-full whitespace-pre-wrap wrap-break-word rounded-lg border border-green-200 bg-green-50 px-2 py-2 font-mono text-[11px] font-bold text-green-700 shadow-sm shadow-green-100 sm:px-3 sm:text-xs">
                                   {log.new_state || 'NULL'}
                               </span>
                           </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
};
export default AuditLogs;