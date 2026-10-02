import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Plus, Trash2, Globe, FileText } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { ErrorNotice, LoadingNotice } from '../components/RequestState';
import { getRequestErrorMessage } from '../requestErrors';

const Environments = ({ isAdmin = false }) => {
    const { t, locale } = useLanguage();
    const [envs, setEnvs] = useState([]);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchEnvs = useCallback(async () => {
        try {
            const res = await api.get('/environments/');
            setEnvs(res.data);
            setError('');
        } catch (requestError) {
            console.error('Environment sync failed', requestError);
            setError(getRequestErrorMessage(requestError, t('Unable to load environments.')));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        let isCurrent = true;
        api.get('/environments/').then((res) => {
            if (!isCurrent) return;
            setEnvs(res.data);
            setError('');
        }).catch((requestError) => {
            console.error('Environment sync failed', requestError);
            if (isCurrent) setError(getRequestErrorMessage(requestError, t('Unable to load environments.')));
        }).finally(() => {
            if (isCurrent) setIsLoading(false);
        });
        return () => { isCurrent = false; };
    }, [t]);

    const retryFetchEnvs = () => {
        setIsLoading(true);
        setError('');
        fetchEnvs();
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.name) return;
        setIsSaving(true);
        setError('');
        try {
            await api.post('/environments/', {
                name: formData.name,
                description: formData.description
            });
            setFormData({ name: '', description: '' });
            await fetchEnvs();
        } catch (requestError) {
            console.error('Environment create failed', requestError);
            setError(getRequestErrorMessage(requestError, t('Unable to create environment.')));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm(t("Delete this environment?"))) {
            setError('');
            try {
                await api.delete(`/environments/${id}`);
                await fetchEnvs();
            } catch (requestError) {
                console.error('Environment delete failed', requestError);
                setError(getRequestErrorMessage(requestError, t('Unable to delete environment.')));
            }
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8 lg:space-y-10">
            {/* HEADER */}
            <div className="border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 sm:text-4xl">{t('ENVIRONMENTS')}</h1>
            </div>

            {error && <ErrorNotice message={error} onRetry={retryFetchEnvs} retryLabel={t('Retry')} />}

            {/* CREATE SECTION */}
            {isAdmin && <form onSubmit={handleCreate} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-4xl sm:p-8">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">{t('Create New Environment')}</h2>
                <div className="grid min-w-0 gap-4 md:grid-cols-2">
                    <input 
                        className="w-full min-w-0 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 font-bold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        placeholder={t('Name (e.g. Production)')}
                        value={formData.name}
                        required
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                    <input 
                        className="w-full min-w-0 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        placeholder={t('Description (Optional)')}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>
                <button disabled={isSaving} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 font-black text-white shadow-lg transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-8">
                    <Plus size={20} /> {isSaving ? t('PLEASE WAIT...') : t('REGISTER ENVIRONMENT')}
                </button>
            </form>}

            {/* LIST SECTION */}
            <div className="grid gap-4">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">{t('Active Environments')}</h2>
                {isLoading ? <LoadingNotice message={t('Loading environments...')} /> : envs.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">{t('No environments found')}</p>
                ) : envs.map(env => (
                    <div key={env.id} className="flex min-w-0 items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md sm:items-center sm:gap-5 sm:p-6">
                        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-5">
                            <div className="shrink-0 rounded-xl border border-slate-100 bg-slate-50 p-3 text-slate-400">
                                <Globe size={24} />
                            </div>
                            <div className="min-w-0">
                                <div className="break-words text-lg font-black text-slate-800 sm:text-xl">{env.name}</div>
                                <div className="flex min-w-0 items-start gap-1 break-words text-sm text-slate-500">
                                    <FileText className="mt-0.5 shrink-0" size={14} /> <span className="min-w-0">{env.description || t('No description provided.')}</span>
                                </div>
                                <div className="mt-2 break-words text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:tracking-widest">
                                    {t('Created')} {new Date(env.created_at).toLocaleDateString(locale)}
                                    {env.updated_at && ` | ${t('Updated')} ${new Date(env.updated_at).toLocaleDateString(locale)}`}
                                </div>
                            </div>
                        </div>
                        
                        {isAdmin && <button
                            onClick={() => handleDelete(env.id)} 
                            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                            title={t('Delete Environment')}
                        >
                            <Trash2 size={22} />
                        </button>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Environments;