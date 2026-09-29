import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash2, Globe, FileText } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

const Environments = ({ isAdmin = false }) => {
    const { t, locale } = useLanguage();
    const [envs, setEnvs] = useState([]);
    const [formData, setFormData] = useState({ name: '', description: '' });

    const fetchEnvs = async () => {
        try {
            const res = await api.get('/environments/');
            setEnvs(res.data);
        } catch (err) { console.error("Fetch failed", err); }
    };

    useEffect(() => {
        const loadEnvironments = async () => {
            try {
                const res = await api.get('/environments/');
                setEnvs(res.data);
            } catch (err) {
                console.error("Fetch failed", err);
            }
        };
        loadEnvironments();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.name) return;
        
        await api.post('/environments/', { 
            name: formData.name, 
            description: formData.description 
        });
        
        setFormData({ name: '', description: '' });
        fetchEnvs();
    };

    const handleDelete = async (id) => {
        if(window.confirm(t("Delete this environment?"))) {
            await api.delete(`/environments/${id}`);
            fetchEnvs();
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            {/* HEADER */}
            <div className="border-b border-slate-200 pb-6">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{t('ENVIRONMENTS')}</h1>
            </div>

            {/* CREATE SECTION */}
            {isAdmin && <form onSubmit={handleCreate} className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">{t('Create New Environment')}</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <input 
                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold"
                        placeholder={t('Name (e.g. Production)')}
                        value={formData.name}
                        required
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                    <input 
                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-blue-500 focus:bg-white outline-none"
                        placeholder={t('Description (Optional)')}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>
                <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95">
                    <Plus size={20} /> {t('REGISTER ENVIRONMENT')}
                </button>
            </form>}

            {/* LIST SECTION */}
            <div className="grid gap-4">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">{t('Active Environments')}</h2>
                {envs.map(env => (
                    <div key={env.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex justify-between items-center transition-all hover:border-blue-200">
                        <div className="flex items-center gap-5">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-400">
                                <Globe size={24} />
                            </div>
                            <div>
                                <div className="text-xl font-black text-slate-800">{env.name}</div>
                                <div className="text-sm text-slate-500 flex items-center gap-1">
                                    <FileText size={14} /> {env.description || t('No description provided.')}
                                </div>
                                <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {t('Created')} {new Date(env.created_at).toLocaleDateString(locale)}
                                    {env.updated_at && ` | ${t('Updated')} ${new Date(env.updated_at).toLocaleDateString(locale)}`}
                                </div>
                            </div>
                        </div>
                        
                        {isAdmin && <button
                            onClick={() => handleDelete(env.id)} 
                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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