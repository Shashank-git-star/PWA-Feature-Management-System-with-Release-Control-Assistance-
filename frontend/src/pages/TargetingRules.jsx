import { useState, useEffect } from 'react';
import api from '../api';
import { Target, User, Users, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { ErrorNotice, LoadingNotice } from '../components/RequestState';
import { getRequestErrorMessage } from '../requestErrors';

const TargetingRules = ({ isAdmin = false }) => {
    const { t } = useLanguage();
    const [flags, setFlags] = useState([]);
    const [groups, setGroups] = useState([]);
    const [rules, setRules] = useState([]);
    const [selectedFlagId, setSelectedFlagId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRulesLoading, setIsRulesLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Form State
    const [newRule, setNewRule] = useState({
        target_type: 'USER', // 'USER' or 'GROUP'
        target_identifier: '',
        value: true
    });

    const fetchFlags = async () => {
        const res = await api.get('/flags/');
        setFlags(res.data);
    };

    const fetchGroups = async () => {
        const res = await api.get('/groups/');
        setGroups(res.data);
    };

    const fetchRules = async (flagId) => {
        const res = await api.get(`/targeting/flag/${flagId}`);
        setRules(res.data);
    };

    const existingTargetRule = rules.find((rule) =>
        rule.target_type.toUpperCase() === newRule.target_type
        && String(rule.target_identifier) === String(Number(newRule.target_identifier))
    );

    const handleAddRule = async (e) => {
        e.preventDefault();
        if (!selectedFlagId) {
            setError(t('Select a flag first'));
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            await api.post('/targeting/', {
                flag_id: parseInt(selectedFlagId),
                ...newRule
            });
            setNewRule({ ...newRule, target_identifier: '' });
            await fetchRules(selectedFlagId);
        } catch (requestError) {
            console.error('Targeting rule create failed', requestError);
            setError(getRequestErrorMessage(requestError, t('Unable to create targeting rule.')));
        } finally {
            setIsSaving(false);
        }
    };

    const deleteRule = async (id) => {
        setError('');
        try {
            await api.delete(`/targeting/${id}`);
            await fetchRules(selectedFlagId);
        } catch (requestError) {
            console.error('Targeting rule delete failed', requestError);
            setError(getRequestErrorMessage(requestError, t('Unable to delete targeting rule.')));
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([fetchFlags(), fetchGroups()]);
            } catch (requestError) {
                console.error('Could not load targeting data', requestError);
                setError(getRequestErrorMessage(requestError, t('Unable to load targeting data.')));
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [t]);

    useEffect(() => {
        if (!selectedFlagId) return;
        const loadRules = async () => {
            try {
            await fetchRules(selectedFlagId);
            } catch (requestError) {
                console.error('Could not load targeting rules', requestError);
                setError(getRequestErrorMessage(requestError, t('Unable to load targeting rules.')));
            } finally {
                setIsRulesLoading(false);
            }
        };
        loadRules();
    }, [selectedFlagId, t]);

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-0 sm:space-y-8 sm:p-2">
            <div className="border-b pb-6">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{t('Targeting Rules')}</h1>
                <p className="text-slate-500 font-medium">{t('Override rollout logic for specific users or groups.')}</p>
            </div>

            {error && <ErrorNotice message={error} retryLabel={t('Retry')} />}
            {isLoading ? <LoadingNotice message={t('Loading targeting data...')} /> : (
            <div className="grid min-w-0 gap-6 md:grid-cols-3 lg:gap-8">
                {/* --- Left Column: Selection --- */}
                <div className="space-y-6">
                    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-3 ml-1">{t('1. Select Feature Flag')}</label>
                        <select 
                            className="w-full min-w-0 rounded-2xl border-none bg-slate-50 p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedFlagId}
                            onChange={(e) => {
                                setError('');
                                setIsRulesLoading(Boolean(e.target.value));
                                setSelectedFlagId(e.target.value);
                            }}
                        >
                            <option value="">-- {t('Choose a Flag')} --</option>
                            {flags.map(f => (
                                <option key={f.id} value={f.id}>{f.key}</option>
                            ))}
                        </select>
                    </div>

                    {selectedFlagId && isAdmin && (
                        <form onSubmit={handleAddRule} className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm animate-in slide-in-from-left duration-300 sm:p-6 motion-reduce:animate-none">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">{t('2. Add New Rule')}</h2>
                            
                            <select 
                                className="w-full min-w-0 rounded-xl border-none bg-slate-50 p-3 font-bold"
                                value={newRule.target_type}
                                onChange={(e) => setNewRule({...newRule, target_type: e.target.value, target_identifier: ''})}
                            >
                                <option value="USER">{t('Specific User ID')}</option>
                                <option value="GROUP">{t('Entire Group')}</option>
                            </select>

                            {newRule.target_type === 'USER' ? (
                                <input 
                                    className="w-full min-w-0 rounded-xl border-none bg-slate-50 p-3 font-bold"
                                    placeholder={t('Enter User ID (e.g. 101)')}
                                    value={newRule.target_identifier}
                                    onChange={(e) => setNewRule({...newRule, target_identifier: e.target.value})}
                                />
                            ) : (
                                <select 
                                    className="w-full min-w-0 rounded-xl border-none bg-slate-50 p-3 font-bold"
                                    value={newRule.target_identifier}
                                    onChange={(e) => setNewRule({...newRule, target_identifier: e.target.value})}
                                >
                                    <option value="">-- {t('Select Group')} --</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            )}

                            <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                                <button 
                                    type="button"
                                    onClick={() => setNewRule({...newRule, value: true})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newRule.value ? 'bg-green-500 text-white shadow-md' : 'text-slate-400'}`}
                                >
                                    {t('ENABLE')}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setNewRule({...newRule, value: false})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!newRule.value ? 'bg-red-500 text-white shadow-md' : 'text-slate-400'}`}
                                >
                                    {t('DISABLE')}
                                </button>
                            </div>

                            {existingTargetRule && (
                                <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                                    {t('This target already has a rule. Applying the other state will update that rule instead of creating a duplicate.')}
                                </p>
                            )}
                            <button disabled={isSaving || (existingTargetRule && existingTargetRule.value === newRule.value)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                                <Plus size={18}/> {isSaving ? t('PLEASE WAIT...') : existingTargetRule ? t('Update Rule State') : t('Apply Rule')}
                            </button>
                        </form>
                    )}
                </div>

                {/* --- Right Column: Active Rules List --- */}
                <div className="md:col-span-2">
                    <div className="min-h-72 min-w-0 rounded-3xl border border-slate-200 bg-white shadow-sm sm:rounded-4xl">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-50 p-5 sm:p-8">
                            <h2 className="text-lg font-black text-slate-800 sm:text-xl">{t('Active Targeting Rules')}</h2>
                            <Target className="shrink-0 text-slate-200" size={28} />
                        </div>

                        {isRulesLoading ? <LoadingNotice message={t('Loading targeting rules...')} /> : !selectedFlagId ? (
                            <div className="p-8 text-center text-slate-400 italic sm:p-12">{t('Select a flag to manage its rules')}</div>
                        ) : rules.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic sm:p-12">{t('No custom rules yet. Global rollout is active.')}</div>
                        ) : (
                            <div className="grid gap-4 p-4 sm:p-6">
                                {rules.map(rule => (
                                    <div key={rule.id} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                            <div className="shrink-0 rounded-xl bg-white p-3 shadow-sm">
                                                {rule.target_type === 'USER' ? <User size={20} className="text-blue-500"/> : <Users size={20} className="text-purple-500"/>}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{t(rule.target_type === 'USER' ? 'USER Target' : 'GROUP Target')}</div>
                                                <div className="break-all font-bold text-slate-800">
                                                    ID: {rule.target_identifier} 
                                                    {rule.target_type === 'GROUP' && ` (${groups.find(g => String(g.id) === rule.target_identifier)?.name})`}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-6">
                                            <div className={`flex items-center gap-1 font-black text-sm ${rule.value ? 'text-green-600' : 'text-red-600'}`}>
                                                {rule.value ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                                                {rule.value ? t('FORCE ON') : t('FORCE OFF')}
                                            </div>
                                            {isAdmin && <button onClick={() => deleteRule(rule.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={20} />
                                            </button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default TargetingRules;