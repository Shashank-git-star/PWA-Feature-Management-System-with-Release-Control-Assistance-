import React, { useState, useEffect } from 'react';
import api from '../api';
import { Target, User, Users, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

const TargetingRules = () => {
    const [flags, setFlags] = useState([]);
    const [groups, setGroups] = useState([]);
    const [rules, setRules] = useState([]);
    const [selectedFlagId, setSelectedFlagId] = useState('');
    
    // Form State
    const [newRule, setNewRule] = useState({
        target_type: 'USER', // 'USER' or 'GROUP'
        target_identifier: '',
        value: true
    });

    useEffect(() => {
        fetchFlags();
        fetchGroups();
    }, []);

    useEffect(() => {
        if (selectedFlagId) fetchRules(selectedFlagId);
    }, [selectedFlagId]);

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

    const handleAddRule = async (e) => {
        e.preventDefault();
        if (!selectedFlagId) return alert("Select a flag first");
        
        await api.post('/targeting/', {
            flag_id: parseInt(selectedFlagId),
            ...newRule
        });
        
        setNewRule({ ...newRule, target_identifier: '' });
        fetchRules(selectedFlagId);
    };

    const deleteRule = async (id) => {
        await api.delete(`/targeting/${id}`);
        fetchRules(selectedFlagId);
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="border-b pb-6">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Targeting Rules</h1>
                <p className="text-slate-500 font-medium">Override rollout logic for specific users or groups.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* --- Left Column: Selection --- */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <label className="block text-xs font-black text-slate-400 uppercase mb-3 ml-1">1. Select Feature Flag</label>
                        <select 
                            className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                            value={selectedFlagId}
                            onChange={(e) => setSelectedFlagId(e.target.value)}
                        >
                            <option value="">-- Choose a Flag --</option>
                            {flags.map(f => (
                                <option key={f.id} value={f.id}>{f.key}</option>
                            ))}
                        </select>
                    </div>

                    {selectedFlagId && (
                        <form onSubmit={handleAddRule} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in slide-in-from-left duration-300">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">2. Add New Rule</h2>
                            
                            <select 
                                className="w-full bg-slate-50 border-none p-3 rounded-xl font-bold"
                                value={newRule.target_type}
                                onChange={(e) => setNewRule({...newRule, target_type: e.target.value, target_identifier: ''})}
                            >
                                <option value="USER">Specific User ID</option>
                                <option value="GROUP">Entire Group</option>
                            </select>

                            {newRule.target_type === 'USER' ? (
                                <input 
                                    className="w-full bg-slate-50 border-none p-3 rounded-xl font-bold"
                                    placeholder="Enter User ID (e.g. 101)"
                                    value={newRule.target_identifier}
                                    onChange={(e) => setNewRule({...newRule, target_identifier: e.target.value})}
                                />
                            ) : (
                                <select 
                                    className="w-full bg-slate-50 border-none p-3 rounded-xl font-bold"
                                    value={newRule.target_identifier}
                                    onChange={(e) => setNewRule({...newRule, target_identifier: e.target.value})}
                                >
                                    <option value="">-- Select Group --</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            )}

                            <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                                <button 
                                    type="button"
                                    onClick={() => setNewRule({...newRule, value: true})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newRule.value ? 'bg-green-500 text-white shadow-md' : 'text-slate-400'}`}
                                >
                                    ENABLE
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setNewRule({...newRule, value: false})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!newRule.value ? 'bg-red-500 text-white shadow-md' : 'text-slate-400'}`}
                                >
                                    DISABLE
                                </button>
                            </div>

                            <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 hover:bg-black">
                                <Plus size={18}/> Apply Rule
                            </button>
                        </form>
                    )}
                </div>

                {/* --- Right Column: Active Rules List --- */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-4xl border border-slate-200 shadow-sm min-h-100">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-800">Active Targeting Rules</h2>
                            <Target className="text-slate-200" size={28} />
                        </div>

                        {!selectedFlagId ? (
                            <div className="p-20 text-center text-slate-400 italic">Select a flag to manage its rules</div>
                        ) : rules.length === 0 ? (
                            <div className="p-20 text-center text-slate-400 italic">No custom rules yet. Global rollout is active.</div>
                        ) : (
                            <div className="p-6 grid gap-4">
                                {rules.map(rule => (
                                    <div key={rule.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                                {rule.target_type === 'USER' ? <User size={20} className="text-blue-500"/> : <Users size={20} className="text-purple-500"/>}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{rule.target_type} Target</div>
                                                <div className="font-bold text-slate-800">
                                                    ID: {rule.target_identifier} 
                                                    {rule.target_type === 'GROUP' && ` (${groups.find(g => String(g.id) === rule.target_identifier)?.name})`}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className={`flex items-center gap-1 font-black text-sm ${rule.value ? 'text-green-600' : 'text-red-600'}`}>
                                                {rule.value ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                                                {rule.value ? 'FORCE ON' : 'FORCE OFF'}
                                            </div>
                                            <button onClick={() => deleteRule(rule.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TargetingRules;