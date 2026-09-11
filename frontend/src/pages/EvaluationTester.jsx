import { useState, useEffect } from 'react';
import api from '../api';
import { FlaskConical, Globe, User, Users, Activity } from 'lucide-react';

const EvaluationTester = () => {
    const [envs, setEnvs] = useState([]);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [query, setQuery] = useState({ flag_key: '', environment: '', user_id: '', group_id: '' });
    const [result, setResult] = useState(null);

    useEffect(() => {
        const loadEnvs = async () => {
            try {
                const [envsRes, usersRes, groupsRes] = await Promise.all([
                    api.get('/environments/'),
                    api.get('/auth/users'),
                    api.get('/groups/')
                ]);
                setEnvs(envsRes.data);
                setUsers(usersRes.data);
                setGroups(groupsRes.data);
                if (envsRes.data.length > 0) setQuery(q => ({...q, environment: envsRes.data[0].name}));
            } catch (err) { console.error("Could not load evaluation data", err); }
        };
        loadEnvs();
    }, []);

    const handleTest = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/flags/evaluate', {
                flag_key: query.flag_key.trim(),
                environment: query.environment, 
                user_id: query.user_id ? parseInt(query.user_id) : null,
                group_id: query.group_id ? parseInt(query.group_id) : null
            });
            setResult(res.data);
        } catch (err) {
            console.error("Evaluation failed", err);
            alert("Error: Flag key '" + query.flag_key + "' was not found in the " + query.environment + " environment.");
        }
    };

    return (
        <div className="max-w-xl mx-auto py-12">
            <div className="text-center mb-8">
                <div className="bg-blue-600 text-white w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200">
                    <FlaskConical size={32} />
                </div>
                <h1 className="text-3xl font-black text-slate-900">Evaluation Engine</h1>
            </div>

            <form onSubmit={handleTest} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-2xl space-y-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Flag Key</label>
                    <input className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-blue-500 outline-none"
                        placeholder="e.g. NEW_DASHBOARD" required value={query.flag_key} onChange={(e) => setQuery({...query, flag_key: e.target.value})} />
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Environment</label>
                    <div className="relative">
                        <select className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold appearance-none outline-none focus:border-blue-500"
                            value={query.environment} onChange={(e) => setQuery({...query, environment: e.target.value})}>
                            {envs.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                        </select>
                        <Globe size={18} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">User</label>
                <div className="relative">
                    <select className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold appearance-none outline-none focus:border-blue-500"
                        value={query.user_id} onChange={(e) => setQuery({...query, user_id: e.target.value, group_id: ''})}>
                        <option value="">Evaluate without a user</option>
                        {users.map(user => <option key={user.id} value={user.id}>{user.email} (ID: {user.id})</option>)}
                    </select>
                    <User size={18} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                </div>
                </div>

                <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Group</label>
                <div className="relative">
                    <select className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold appearance-none outline-none focus:border-blue-500"
                        value={query.group_id} onChange={(e) => setQuery({...query, group_id: e.target.value, user_id: ''})}>
                        <option value="">Evaluate without a group</option>
                        {groups.map(group => <option key={group.id} value={group.id}>{group.name} (ID: {group.id})</option>)}
                    </select>
                    <Users size={18} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black shadow-lg hover:bg-black transition-all">
                    RUN EVALUATION
                </button>

                {/* UPDATED RESULT DISPLAY */}
                {result && (
                    <div className={`mt-8 p-8 rounded-4xl border-4 text-center transition-all animate-in zoom-in duration-300 ${
                        result.value ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <div className="text-[10px] font-black uppercase mb-1 opacity-60 tracking-widest italic">Evaluation Result</div>
                        
                        <h2 className="text-5xl font-black italic tracking-tighter mb-4">
                            {result.value ? 'ENABLED' : 'DISABLED'}
                        </h2>

                        {/* REASON TAG */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-current font-bold text-[11px] uppercase tracking-wider">
                            <Activity size={14} />
                            Reason: <span className="underline">{result.reason}</span>
                        </div>

                        <p className="mt-4 text-xs font-medium opacity-80">
                            Target: {result.flag_key} | User: {result.user_id || 'Global'}
                        </p>
                    </div>
                )}
            </form>
        </div>
    );
};

export default EvaluationTester;