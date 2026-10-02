import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { FlaskConical, Globe, User, Users, Activity } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { ErrorNotice, LoadingNotice } from '../components/RequestState';
import { getRequestErrorMessage } from '../requestErrors';

const EvaluationTester = () => {
    const { t } = useLanguage();
    const [envs, setEnvs] = useState([]);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [query, setQuery] = useState({ flag_key: '', environment: '', user_id: '', group_id: '' });
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const loadOptions = useCallback(() => Promise.all([
                api.get('/environments/'),
                api.get('/auth/users'),
                api.get('/groups/')
            ]), []);

    useEffect(() => {
        let isCurrent = true;
        loadOptions().then(([envsRes, usersRes, groupsRes]) => {
            if (!isCurrent) return;
            setEnvs(envsRes.data);
            setUsers(usersRes.data);
            setGroups(groupsRes.data);
            if (envsRes.data.length > 0) setQuery(q => ({ ...q, environment: q.environment || envsRes.data[0].name }));
        }).catch((requestError) => {
            console.error('Could not load evaluation data', requestError);
            if (isCurrent) setError(getRequestErrorMessage(requestError, t('Unable to load evaluation options.')));
        }).finally(() => {
            if (isCurrent) setIsLoading(false);
        });
        return () => { isCurrent = false; };
    }, [loadOptions, t]);

    const retryLoadOptions = () => {
        setIsLoading(true);
        setError('');
        loadOptions().then(([envsRes, usersRes, groupsRes]) => {
            setEnvs(envsRes.data);
            setUsers(usersRes.data);
            setGroups(groupsRes.data);
            if (envsRes.data.length > 0) setQuery(q => ({ ...q, environment: q.environment || envsRes.data[0].name }));
        }).catch((requestError) => {
            console.error('Could not reload evaluation data', requestError);
            setError(getRequestErrorMessage(requestError, t('Unable to load evaluation options.')));
        }).finally(() => setIsLoading(false));
    };

    const handleTest = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);
        setIsSubmitting(true);
        try {
            const res = await api.post('/flags/evaluate', {
                flag_key: query.flag_key.trim(),
                environment: query.environment, 
                user_id: query.user_id ? parseInt(query.user_id) : null,
                group_id: query.group_id ? parseInt(query.group_id) : null
            });
            setResult(res.data);
        } catch (requestError) {
            console.error('Evaluation failed', requestError);
            setError(getRequestErrorMessage(requestError, t('Unable to run evaluation.')));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-xl py-4 sm:py-8 lg:py-12">
            <div className="text-center mb-8">
                <div className="bg-blue-600 text-white w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200">
                    <FlaskConical size={32} />
                </div>
                <h1 className="text-3xl font-black text-slate-900">{t('Evaluation Engine')}</h1>
            </div>

            {error && <div className="mb-4"><ErrorNotice message={error} onRetry={retryLoadOptions} retryLabel={t('Retry')} /></div>}
            {isLoading ? <LoadingNotice message={t('Loading evaluation options...')} /> : <form onSubmit={handleTest} className="space-y-5 rounded-3xl border-2 border-slate-100 bg-white p-5 shadow-xl sm:space-y-6 sm:rounded-[2.5rem] sm:p-8">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">{t('Flag Key')}</label>
                    <input className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-blue-500 outline-none"
                        placeholder={t('e.g. NEW_DASHBOARD')} required value={query.flag_key} onChange={(e) => setQuery({...query, flag_key: e.target.value})} />
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">{t('Environment')}</label>
                    <div className="relative">
                        <select className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold appearance-none outline-none focus:border-blue-500"
                            value={query.environment} onChange={(e) => setQuery({...query, environment: e.target.value})}>
                            {envs.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                        </select>
                        <Globe size={18} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">{t('User')}</label>
                <div className="relative">
                    <select className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold appearance-none outline-none focus:border-blue-500"
                        value={query.user_id} onChange={(e) => setQuery({...query, user_id: e.target.value, group_id: ''})}>
                        <option value="">{t('Evaluate without a user')}</option>
                        {users.map(user => <option key={user.id} value={user.id}>{user.email} (ID: {user.id})</option>)}
                    </select>
                    <User size={18} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                </div>
                </div>

                <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">{t('Group')}</label>
                <div className="relative">
                    <select className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold appearance-none outline-none focus:border-blue-500"
                        value={query.group_id} onChange={(e) => setQuery({...query, group_id: e.target.value, user_id: ''})}>
                        <option value="">{t('Evaluate without a group')}</option>
                        {groups.map(group => <option key={group.id} value={group.id}>{group.name} (ID: {group.id})</option>)}
                    </select>
                    <Users size={18} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                </div>
                </div>

                <button type="submit" disabled={isSubmitting || !query.environment} className="min-h-12 w-full rounded-2xl bg-blue-600 py-4 font-black text-white shadow-lg transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 sm:rounded-3xl sm:py-5">
                    {isSubmitting ? t('PLEASE WAIT...') : t('RUN EVALUATION')}
                </button>

                {/* UPDATED RESULT DISPLAY */}
                {result && (
                    <div className={`mt-8 rounded-3xl border-4 p-5 text-center transition-all animate-in zoom-in duration-300 sm:rounded-4xl sm:p-8 motion-reduce:animate-none ${
                        result.value ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <div className="text-[10px] font-black uppercase mb-1 opacity-60 tracking-widest italic">{t('Evaluation Result')}</div>
                        
                        <h2 className="mb-4 break-words text-4xl font-black italic tracking-tighter sm:text-5xl">
                            {result.value ? t('ENABLED') : t('DISABLED')}
                        </h2>

                        {/* REASON TAG */}
                        <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-current bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                            <Activity size={14} />
                            {t('Reason')}: <span className="underline">{t(result.reason)}</span>
                        </div>

                        <p className="mt-4 break-all text-xs font-medium opacity-80">
                            {t('Target')}: {result.flag_key} | {t('User')}: {result.user_id || t('Global')}
                        </p>
                    </div>
                )}
            </form>}
        </div>
    );
};

export default EvaluationTester;