import { useState, useEffect } from 'react';
import api from '../api';
import { Clock, User, HardDrive, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

const AuditLogs = () => {
    const { t, language } = useLanguage();
    const [logs, setLogs] = useState([]);
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

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
                const res = await api.get('/audit-logs', { params });
                setLogs(res.data);
            } catch (e) { console.error("Audit sync failed", e); }
        };
        fetchLogs();
    }, [filters]);

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex justify-between items-end bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="text-blue-600" size={20} />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">{t('Integrity Protocol')}</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">{t('System Activity Logs')}</h1>
                </div>
                <div className="text-right">
                    <span className="text-4xl font-black text-slate-200">{logs.length}</span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Total Events Recorded')}</p>
                </div>
            </div>

            <div className="grid gap-3 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 md:grid-cols-5">
                <input className="rounded-xl border border-slate-200 p-3 text-sm" placeholder={t('User ID')} value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })} />
                <input className="rounded-xl border border-slate-200 p-3 text-sm" placeholder={t('Flag ID')} value={filters.flag_id} onChange={(e) => setFilters({ ...filters, flag_id: e.target.value })} />
                <select className="rounded-xl border border-slate-200 bg-white p-3 text-sm" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
                    <option value="">{t('All actions')}</option>
                    {actions.map((action) => <option key={action} value={action}>{t(action)}</option>)}
                </select>
                <input type="date" className="rounded-xl border border-slate-200 p-3 text-sm" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
                <input type="date" className="rounded-xl border border-slate-200 p-3 text-sm" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
            </div>

            {/* Timeline View */}
            <div className="space-y-4">
                {logs.map((log) => (
                    <div key={log.id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex items-center gap-8">
                        {/* Timestamp Block */}
                        <div className="w-40 flex flex-col items-center justify-center border-r border-slate-100 pr-8">
                            <Clock size={16} className="text-slate-300 mb-1" />
                            <span className="text-[13px] font-black text-slate-400 uppercase tracking-tighter">
                                {indiaTime(log.created_at, { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className="text-[15px] font-bold text-slate-300">
                                {indiaTime(log.created_at, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                        </div>

                        {/* Doer & Action */}
                        <div className="flex-1 flex items-center gap-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <User size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 tracking-tight">
                                    {t('User ID')}: {log.user_id ?? t('Not assigned')}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-blue-50 text-blue-600 px-3 py-0.5 rounded-full text-[9px] font-black uppercase">
                                        {t(log.action)}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <HardDrive size={10} /> {log.details}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Change details */}
                        <div className="flex-[1.5] bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-center gap-4">
                           <div className="text-center">
                               <p className="text-[13px] font-black text-slate-300 uppercase mb-1 tracking-widest">{t('Previous')}</p>
                               <span className="text-xs font-bold text-red-400 font-mono px-3 py-1 bg-red-50/50 rounded-lg border border-red-100 line-through">
                                   {log.old_state || 'NULL'}
                               </span>
                           </div>
                           <ArrowRight className="text-slate-300" size={14} />
                           <div className="text-center">
                               <p className="text-[13px] font-black text-slate-300 uppercase mb-1 tracking-widest">{t('Assigned')}</p>
                               <span className="text-xs font-bold text-green-600 font-mono px-3 py-1 bg-green-50 rounded-lg border border-green-200 shadow-sm shadow-green-100">
                                   {log.new_state || 'NULL'}
                               </span>
                           </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default AuditLogs;