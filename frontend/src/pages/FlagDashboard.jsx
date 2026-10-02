import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import { Plus, Trash2, Settings2, Globe, Activity, Cpu, Layers, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { ErrorNotice, LoadingNotice } from '../components/RequestState';
import { getRequestErrorMessage } from '../requestErrors';

const FlagDashboard = ({ isAdmin = false }) => {
    const { t } = useLanguage();
    const [flags, setFlags] = useState([]);
    const [envs, setEnvs] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [rolloutDrafts, setRolloutDrafts] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState('');
    const savingRolloutIds = useRef(new Set());
    const emptyFlag = { key: '', description: '', owner_team: '', flag_type: 'boolean', default_value: 'false', enabled: true, rollout_percentage: 100 };
    const [newFlag, setNewFlag] = useState(emptyFlag);

    const fetchData = useCallback(async () => {
        const [flagsRes, envsRes, overridesRes] = await Promise.all([
            api.get('/flags/'), api.get('/environments/'), api.get('/overrides/')
        ]);
        setFlags(flagsRes.data);
        setEnvs(envsRes.data);
        setOverrides(overridesRes.data);
    }, []);

    useEffect(() => {
        let isCurrent = true;
        const loadDashboard = async () => {
            try {
                await fetchData();
            } catch (requestError) {
                console.error('Flag dashboard sync failed', requestError);
                if (isCurrent) setError(getRequestErrorMessage(requestError, t('Unable to load feature flags.')));
            } finally {
                if (isCurrent) setIsLoading(false);
            }
        };
        loadDashboard();
        return () => { isCurrent = false; };
    }, [fetchData, t]);

    const handleCreateFlag = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            await api.post('/flags/', newFlag);
            setShowModal(false);
            setNewFlag(emptyFlag);
            await fetchData();
        } catch (requestError) {
            console.error('Create flag failed', requestError);
            setError(getRequestErrorMessage(requestError, t('Failed to create flag')));
        } finally {
            setIsSaving(false);
        }
    };

    const toggleFlag = async (flag) => {
        setIsMutating(true);
        setError('');
        try {
            await api.put(`/flags/${flag.id}`, {
                key: flag.key,
                description: flag.description,
                owner_team: flag.owner_team,
                enabled: !flag.enabled,
                rollout_percentage: flag.rollout_percentage
            });
            await fetchData();
        } catch (requestError) {
            console.error('Flag toggle failed', requestError);
            setError(getRequestErrorMessage(requestError, t('Unable to update flag.')));
        } finally {
            setIsMutating(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t("Are you sure you want to delete this component?"))) {
            setIsMutating(true);
            setError('');
            try {
                await api.delete(`/flags/${id}`);
                await fetchData();
            } catch (requestError) {
                console.error('Delete flag failed', requestError);
                setError(getRequestErrorMessage(requestError, t('Unable to delete flag.')));
            } finally {
                setIsMutating(false);
            }
        }
    };

    const handleRolloutChange = (id, val) => {
        setRolloutDrafts((drafts) => ({ ...drafts, [id]: Number(val) }));
    };

    const saveRolloutPercentage = async (id, val) => {
        const numericVal = Number(val);
        const flag = flags.find(f => f.id === id);
        if (!flag || savingRolloutIds.current.has(id)) return;

        setRolloutDrafts((drafts) => {
            const nextDrafts = { ...drafts };
            delete nextDrafts[id];
            return nextDrafts;
        });
        if (numericVal === flag.rollout_percentage) return;

        savingRolloutIds.current.add(id);
        setError('');
        setFlags((currentFlags) => currentFlags.map((currentFlag) => (
            currentFlag.id === id ? { ...currentFlag, rollout_percentage: numericVal } : currentFlag
        )));
        setIsMutating(true);
        try {
            await api.put(`/flags/${id}`, {
                key: flag.key,
                description: flag.description,
                owner_team: flag.owner_team,
                enabled: flag.enabled,
                rollout_percentage: numericVal
            });
        } catch (error) {
            console.error('Rollout update failed', error);
            setFlags((currentFlags) => currentFlags.map((currentFlag) => (
                currentFlag.id === id ? { ...currentFlag, rollout_percentage: flag.rollout_percentage } : currentFlag
            )));
            setError(getRequestErrorMessage(error, t('Failed to update rollout percentage')));
        } finally {
            savingRolloutIds.current.delete(id);
            setIsMutating(false);
        }
    };

    const handleOverrideToggle = async (flagId, envId) => {
        const existing = overrides.find(o => o.feature_flag_id === flagId && o.environment_id === envId);
        setIsMutating(true);
        setError('');
        try {
            if (!existing) {
                await api.post('/overrides/', { feature_flag_id: flagId, environment_id: envId, value: true, enabled: true });
            } else if (existing.value === true) {
                await api.put(`/overrides/${existing.id}`, { value: false });
            } else {
                await api.delete(`/overrides/${existing.id}`);
            }
            await fetchData();
        } catch (requestError) {
            console.error('Override update failed', requestError);
            setError(getRequestErrorMessage(requestError, t('Unable to update override.')));
        } finally {
            setIsMutating(false);
        }
    };

    const getOverrideState = (flagId, envId) => {
        const ov = overrides.find(o => o.feature_flag_id === flagId && o.environment_id === envId);
        if (!ov) return { label: 'DEFAULT', bg: 'bg-white', text: 'text-slate-400', icon: <Layers size={14} /> };
        if (!ov.enabled) return { label: 'OVERRIDE OFF', bg: 'bg-white', text: 'text-slate-400', icon: <AlertCircle size={14} /> };
        return ov.value 
            ? { label: 'FORCED ON', bg: 'bg-green-500', text: 'text-white', icon: <CheckCircle2 size={14}/> } 
            : { label: 'FORCED OFF', bg: 'bg-red-500', text: 'text-white', icon: <AlertCircle size={14}/> };
    };

    return (
        <div className="min-w-0 space-y-6 sm:space-y-10">
            {error && <ErrorNotice message={error} onRetry={() => fetchData().catch((requestError) => {
                console.error('Flag dashboard retry failed', requestError);
                setError(getRequestErrorMessage(requestError, t('Unable to load feature flags.')));
            })} retryLabel={t('Retry')} />}
            {/* --- Interface --- */}
            <section className="flag-hero relative overflow-hidden rounded-3xl border border-blue-100 p-6 shadow-xl sm:rounded-[3rem] sm:p-10 lg:p-12">
                <div className="absolute right-0 top-0 hidden p-12 opacity-10 sm:block lg:p-20">
                    <Cpu size={300} />
                </div>
                <div className="relative z-10 flex min-w-0 flex-col items-stretch justify-between gap-6 md:flex-row md:items-center md:gap-8">
                    <div className="min-w-0">
                        <h1 className="text-4xl font-black leading-tight tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">{t('Flag')} <span className="text-blue-600">{t('Management')}</span></h1>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-600 h-1 w-10 rounded-full"></span>
                            <p className="mt-3 max-w-xl text-base font-medium text-slate-600 sm:mt-4 sm:text-xl">{t('Configure, rollout, and manage environment-specific feature logic.')}</p>
                        </div>
                    </div>
                    {isAdmin && <button
                        onClick={() => setShowModal(true)}
                        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-700 active:scale-95 sm:w-auto sm:gap-4 sm:rounded-4xl sm:px-10 sm:py-5 sm:text-lg"
                    >
                        <Plus size={32} /> {t('CREATE FLAG')}
                    </button>}
                </div>
            </section>

            {/* --- CREATE FLAG MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-4">
                    <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-[2.5rem] sm:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-slate-900">{t('Create New Feature Flag')}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateFlag} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('Flag Key')}</label>
                                <input 
                                    type="text" 
                                    placeholder={t('e.g. new_dashboard')}
                                    value={newFlag.key}
                                    onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('Description')}</label>
                                <textarea 
                                    placeholder={t('Feature description')}
                                    value={newFlag.description}
                                    onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('Flag Type')}</label>
                                <select 
                                    value={newFlag.flag_type}
                                    onChange={(e) => setNewFlag({ ...newFlag, flag_type: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                                >
                                    <option value="boolean">{t('Boolean')}</option>
                                    <option value="string">{t('String')}</option>
                                    <option value="number">{t('Number')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('Default Value')}</label>
                                <select 
                                    value={newFlag.default_value}
                                    onChange={(e) => setNewFlag({ ...newFlag, default_value: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                                >
                                    <option value="false">{t('False')}</option>
                                    <option value="true">{t('True')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('Owner Team')}</label>
                                <input 
                                    type="text" 
                                    placeholder={t('e.g. Core Team')}
                                    value={newFlag.owner_team}
                                    onChange={(e) => setNewFlag({ ...newFlag, owner_team: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                <span className="text-xs font-black uppercase text-slate-500">{t('Initial State (Enabled)')}</span>
                                <input 
                                    type="checkbox" 
                                    checked={newFlag.enabled}
                                    onChange={(e) => setNewFlag({ ...newFlag, enabled: e.target.checked })}
                                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">{t('Initial Rollout Percentage')}</label>
                                <input 
                                    type="number" 
                                    min="0" 
                                    max="100"
                                    value={newFlag.rollout_percentage}
                                    onChange={(e) => setNewFlag({ ...newFlag, rollout_percentage: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                                />
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                                >
                                    {t('Cancel')}
                                </button>
                                <button disabled={isSaving}
                                    type="submit"
                                    className="min-h-11 rounded-2xl bg-blue-600 px-8 py-3 font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
                                >
                                    {isSaving ? t('PLEASE WAIT...') : t('Save Flag')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- GRID OF FEATURE --- */}
            {isLoading ? <LoadingNotice message={t('Loading feature flags...')} /> : flags.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{t('No feature flags found')}</p>
            ) :             <div className="grid min-w-0 grid-cols-1 gap-5 sm:gap-8 xl:grid-cols-2">
                {flags.map(flag => (
                    <div key={flag.id} className="feature-card flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg sm:rounded-[2.5rem]">
                        
                        {/* HEADER ( IDENTITY ) */}
                        <div className="flex min-w-0 flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:p-8">
                            <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50 to-blue-100 text-blue-600 shadow-inner sm:h-20 sm:w-20 sm:rounded-4xl">
                                    <Settings2 size={32} strokeWidth={2.5} className="sm:hidden" />
                                    <Settings2 size={40} strokeWidth={2.5} className="hidden sm:block" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="break-all text-xl font-black uppercase italic tracking-tighter text-slate-900 sm:text-3xl">{flag.key}</h3>
                                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{flag.owner_team || t('Unassigned')}</span>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                            {t(flag.flag_type)} · {t('default')} {t(String(flag.default_value))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => toggleFlag(flag)}
                                disabled={!isAdmin || isMutating}
                                role="switch"
                                aria-checked={flag.enabled}
                                aria-label={`${t('Enabled')}: ${flag.key}`}
                                className={`group h-12 w-24 shrink-0 rounded-full p-1.5 transition-colors duration-300 motion-reduce:transition-none ${isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${flag.enabled ? 'bg-green-500' : 'bg-slate-300'} ${isMutating ? 'pointer-events-none opacity-60' : ''}`}
                            >
                                <div className={`h-9 w-9 bg-white rounded-full shadow-2xl flex items-center justify-center transition-transform duration-300 ${flag.enabled ? 'translate-x-12' : 'translate-x-0'}`}>
                                    <Cpu size={18} className={flag.enabled ? 'text-green-600' : 'text-slate-400'} />
                                </div>
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="min-w-0 flex-1 space-y-8 p-5 sm:space-y-10 sm:p-8">
                            
                            {/* ROLLOUT */}
                            <div className="space-y-6">
                                <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Activity size={14} className="text-blue-500" /> {t('Percentage')}
                                        </h4>
                                    </div>
                                    <div className="text-4xl font-black leading-none tracking-tighter text-blue-600 sm:text-5xl lg:text-6xl">{rolloutDrafts[flag.id] ?? flag.rollout_percentage ?? 0}<span className="text-xl">%</span></div>
                                </div>
                                
                                <div className="relative">
                                    <div className="h-4 bg-slate-100 rounded-full border border-slate-200 overflow-hidden shadow-inner p-1">
                                        <div 
                                            className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                                            style={{ width: `${rolloutDrafts[flag.id] ?? flag.rollout_percentage ?? 0}%` }}
                                        />
                                    </div>
                                    <input 
                                        type="range" min="0" max="100" 
                                        value={rolloutDrafts[flag.id] ?? flag.rollout_percentage ?? 0}
                                        onChange={(e) => handleRolloutChange(flag.id, e.target.value)}
                                        onPointerUp={(e) => saveRolloutPercentage(flag.id, e.currentTarget.value)}
                                        onKeyUp={(e) => {
                                            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
                                                saveRolloutPercentage(flag.id, e.currentTarget.value);
                                            }
                                        }}
                                        onBlur={(e) => saveRolloutPercentage(flag.id, e.currentTarget.value)}
                                        disabled={!isAdmin}
                                        className="absolute -top-1 left-0 w-full opacity-0 h-6 cursor-pointer z-10"
                                    />
                                </div>
                            </div>

                            {/* ENVIRONMENT */}
                            <div className="space-y-6 pt-6 border-t border-slate-50">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Globe size={14} className="text-orange-500" /> {t('Flag Force Toggle')}
                                </h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                                    {envs.map(env => {
                                        const state = getOverrideState(flag.id, env.id);
                                        return (
                                            <button
                                                key={env.id}
                                                onClick={() => handleOverrideToggle(flag.id, env.id)}
                                                disabled={!isAdmin || isMutating}
                                                className={`min-h-20 min-w-0 rounded-2xl border-2 p-4 transition-all duration-200 motion-reduce:transition-none sm:rounded-3xl sm:p-5 ${isAdmin ? 'cursor-pointer active:scale-[0.98]' : 'cursor-not-allowed opacity-60'} ${state.bg} ${state.text} ${state.label === 'DEFAULT' ? 'border-slate-100 bg-slate-50 text-slate-600 hover:border-blue-400' : 'border-transparent shadow-lg'} ${isMutating ? 'opacity-60' : ''}`}
                                            >
                                                <span className="text-[10px] font-black tracking-widest uppercase opacity-70">{env.name}</span>
                                                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-tighter">
                                                    {state.icon} {t(state.label)}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex min-w-0 flex-col items-stretch justify-between gap-4 rounded-b-3xl border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:rounded-b-[2.5rem] sm:p-8">
                            <div className="min-w-0">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{t('Flag Description')}</h4>
                                <p className="mt-1 break-words text-xs font-medium italic text-slate-500">"{flag.description || t('System controlled')}"</p>
                            </div>
                            {isAdmin && <button onClick={() => handleDelete(flag.id)} className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all cursor-pointer">
                                <Trash2 size={16} className="group-hover:rotate-12 transition-transform"/>
                                <span className="text-[10px] font-black uppercase tracking-widest">{t('Delete Component')}</span>
                            </button>}
                        </div>
                    </div>
                ))}
            </div>}
        </div>
    );
};

export default FlagDashboard;