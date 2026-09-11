import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash2, Settings2, Globe, Activity, Cpu, Layers, CheckCircle2, AlertCircle, X } from 'lucide-react';

const FlagDashboard = () => {
    const [flags, setFlags] = useState([]);
    const [envs, setEnvs] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const emptyFlag = { key: '', description: '', owner_team: '', flag_type: 'boolean', default_value: 'false', enabled: true, rollout_percentage: 100 };
    const [newFlag, setNewFlag] = useState(emptyFlag);

    const fetchData = async () => {
        try {
            const [flagsRes, envsRes, overridesRes] = await Promise.all([
                api.get('/flags/'), api.get('/environments/'), api.get('/overrides/')
            ]);
            setFlags(flagsRes.data);
            setEnvs(envsRes.data);
            setOverrides(overridesRes.data);
        } catch (err) { console.error("Sync Error", err); }
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [flagsRes, envsRes, overridesRes] = await Promise.all([
                    api.get('/flags/'), api.get('/environments/'), api.get('/overrides/')
                ]);
                setFlags(flagsRes.data);
                setEnvs(envsRes.data);
                setOverrides(overridesRes.data);
            } catch (err) {
                console.error("Sync Error", err);
            }
        };
        loadDashboardData();
    }, []);

    const handleCreateFlag = async (e) => {
        e.preventDefault();
        try {
            await api.post('/flags/', newFlag);
            setShowModal(false);
            setNewFlag(emptyFlag);
            fetchData();
        } catch (err) {
            console.error("Create error", err);
            alert("Failed to create flag");
        }
    };

    const toggleFlag = async (flag) => {
        await api.put(`/flags/${flag.id}`, { 
            key: flag.key,
            description: flag.description,
            owner_team: flag.owner_team,
            enabled: !flag.enabled,
            rollout_percentage: flag.rollout_percentage
        });
        fetchData();
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this component?")) {
            try {
                await api.delete(`/flags/${id}`);
                fetchData();
            } catch (err) {
                console.error("Delete error", err);
            }
        }
    };

    const handleRolloutChange = async (id, val) => {
        const numericVal = parseInt(val);
        setFlags(flags.map(f => f.id === id ? { ...f, rollout_percentage: numericVal } : f));
        const flag = flags.find(f => f.id === id);
        if (flag) {
            await api.put(`/flags/${id}`, { 
                key: flag.key,
                description: flag.description,
                owner_team: flag.owner_team,
                enabled: flag.enabled,
                rollout_percentage: numericVal 
            });
        }
    };

    const handleOverrideToggle = async (flagId, envId) => {
        const existing = overrides.find(o => o.feature_flag_id === flagId && o.environment_id === envId);
        if (!existing) {
            await api.post('/overrides/', { feature_flag_id: flagId, environment_id: envId, value: true, enabled: true });
        } else if (existing.value === true) {
            await api.put(`/overrides/${existing.id}`, { value: false });
        } else {
            await api.delete(`/overrides/${existing.id}`);
        }
        fetchData();
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
        <div className="min-h-screen space-y-12">
            
            {/* --- Interface --- */}
            <section className="relative bg-white rounded-[3rem] p-12 overflow-hidden shadow-2xl border border-slate-100">
                <div className="absolute top-0 right-0 p-20 opacity-5">
                    <Cpu size={300} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-600 h-1 w-12 rounded-full"></span>
                            <span className="text-blue-600 font-black uppercase tracking-[0.4em] text-xs">Flag Management</span>
                        </div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Control <span className="text-blue-600">Dashboard</span></h1>
                        <p className="mt-4 text-slate-500 text-xl font-medium max-w-xl">Configure, rollout, and manage environment-specific feature logic.</p>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-slate-900 text-white hover:bg-blue-600 px-12 py-6 rounded-4xl font-black text-xl transition-all duration-500 shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95 flex items-center gap-4 cursor-pointer"
                    >
                        <Plus size={32} /> CREATE FLAG
                    </button>
                </div>
            </section>

            {/* --- CREATE FLAG MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-slate-900">Create New Feature Flag</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateFlag} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Flag Key</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. new_dashboard"
                                    value={newFlag.key}
                                    onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Description</label>
                                <textarea 
                                    placeholder="Feature description"
                                    value={newFlag.description}
                                    onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Flag Type</label>
                                <select 
                                    value={newFlag.flag_type}
                                    onChange={(e) => setNewFlag({ ...newFlag, flag_type: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                                >
                                    <option value="boolean">Boolean</option>
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Default Value</label>
                                <select 
                                    value={newFlag.default_value}
                                    onChange={(e) => setNewFlag({ ...newFlag, default_value: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                                >
                                    <option value="false">False</option>
                                    <option value="true">True</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Owner Team</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Core Team"
                                    value={newFlag.owner_team}
                                    onChange={(e) => setNewFlag({ ...newFlag, owner_team: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                <span className="text-xs font-black uppercase text-slate-500">Initial State (Enabled)</span>
                                <input 
                                    type="checkbox" 
                                    checked={newFlag.enabled}
                                    onChange={(e) => setNewFlag({ ...newFlag, enabled: e.target.checked })}
                                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Initial Rollout Percentage</label>
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
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-600/30 cursor-pointer"
                                >
                                    Save Flag
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- GRID OF FEATURE --- */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {flags.map(flag => (
                    <div key={flag.id} className="feature-card rounded-[3.5rem] flex flex-col bg-white shadow-xl border border-slate-100 overflow-hidden">
                        
                        {/* HEADER ( IDENTITY ) */}
                        <div className="p-10 flex justify-between items-start border-b border-slate-100">
                            <div className="flex gap-6 items-center">
                                <div className="w-20 h-20 bg-linear-to-br from-blue-50 to-blue-100 rounded-4xl flex items-center justify-center text-blue-600 border border-blue-200 shadow-inner">
                                    <Settings2 size={40} strokeWidth={2.5}/>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{flag.key}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{flag.owner_team || 'Unassigned'}</span>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                            {flag.flag_type} · default {flag.default_value}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div 
                                onClick={() => toggleFlag(flag)}
                                className={`group h-12 w-24 rounded-full p-1.5 cursor-pointer transition-colors duration-300 flex items-center ${flag.enabled ? 'bg-green-500' : 'bg-slate-300'}`}
                            >
                                <div className={`h-9 w-9 bg-white rounded-full shadow-2xl flex items-center justify-center transition-transform duration-300 ${flag.enabled ? 'translate-x-12' : 'translate-x-0'}`}>
                                    <Cpu size={18} className={flag.enabled ? 'text-green-600' : 'text-slate-400'} />
                                </div>
                            </div>
                        </div>

                        {/* BODY */}
                        <div className="p-10 space-y-12 flex-1">
                            
                            {/* ROLLOUT */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Activity size={14} className="text-blue-500" /> Percentage
                                        </h4>
                                    </div>
                                    <div className="text-6xl font-black text-blue-600 tracking-tighter leading-none">{flag.rollout_percentage || 0}<span className="text-xl">%</span></div>
                                </div>
                                
                                <div className="relative">
                                    <div className="h-4 bg-slate-100 rounded-full border border-slate-200 overflow-hidden shadow-inner p-1">
                                        <div 
                                            className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                                            style={{ width: `${flag.rollout_percentage || 0}%` }}
                                        />
                                    </div>
                                    <input 
                                        type="range" min="0" max="100" 
                                        value={flag.rollout_percentage || 0} 
                                        onChange={(e) => handleRolloutChange(flag.id, e.target.value)}
                                        className="absolute -top-1 left-0 w-full opacity-0 h-6 cursor-pointer z-10"
                                    />
                                </div>
                            </div>

                            {/* ENVIRONMENT */}
                            <div className="space-y-6 pt-6 border-t border-slate-50">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Globe size={14} className="text-orange-500" /> Flag Force Toggle
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {envs.map(env => {
                                        const state = getOverrideState(flag.id, env.id);
                                        return (
                                            <button 
                                                key={env.id}
                                                onClick={() => handleOverrideToggle(flag.id, env.id)}
                                                className={`p-6 rounded-4xl border-2 transition-all flex flex-col items-center justify-center gap-2 group/btn active:scale-90 cursor-pointer ${state.bg} ${state.text} ${state.label === 'DEFAULT' ? 'border-slate-100 hover:border-blue-400 bg-slate-50 text-slate-600' : 'border-transparent shadow-lg'}`}
                                            >
                                                <span className="text-[10px] font-black tracking-widest uppercase opacity-70">{env.name}</span>
                                                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-tighter">
                                                    {state.icon} {state.label}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="p-8 bg-slate-50/50 flex justify-between items-center rounded-b-[3.5rem] border-t border-slate-100">
                            <div>
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Flag Description</h4>
                                <p className="text-xs text-slate-500 font-medium italic mt-1">"{flag.description || 'System controlled'}"</p>
                            </div>
                            <button onClick={() => handleDelete(flag.id)} className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all cursor-pointer">
                                <Trash2 size={16} className="group-hover:rotate-12 transition-transform"/>
                                <span className="text-[10px] font-black uppercase tracking-widest">Delete Component</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FlagDashboard;