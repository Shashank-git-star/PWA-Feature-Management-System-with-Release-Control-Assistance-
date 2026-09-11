import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, Plus, UserPlus, Shield, Trash2 } from 'lucide-react';

const UserGroups = () => {
    const [groups, setGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);

    useEffect(() => {
        fetchGroups();
        fetchUsers();
    }, []);

    const fetchGroups = async () => {
        const res = await api.get('/groups/');
        setGroups(res.data);
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (e) { console.error("Could not fetch users"); }
    };

    const createGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName) return;
        await api.post('/groups/', { name: newGroupName });
        setNewGroupName('');
        fetchGroups();
    };

    const addUserToGroup = async (groupId, userId) => {
        await api.post(`/groups/${groupId}/add-user/${userId}`);
        fetchUsers(); 
        alert("User assigned to group!");
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="border-b pb-6">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">User Groups</h1>
                <p className="text-slate-500 font-medium">Create segments for targeted feature rollouts.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: Create & List Groups */}
                <div className="md:col-span-1 space-y-6">
                    <form onSubmit={createGroup} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">New Group</h2>
                        <input 
                            className="w-full bg-slate-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                            placeholder="e.g. Beta Testers"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                        />
                        <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700">
                            <Plus size={18}/> Create
                        </button>
                    </form>

                    <div className="space-y-2">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 ml-2">Available Groups</h2>
                        {groups.map(group => (
                            <div 
                                key={group.id} 
                                onClick={() => setSelectedGroup(group)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                                    selectedGroup?.id === group.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                                }`}
                            >
                                <span className="font-bold flex items-center gap-2">
                                    <Shield size={16}/> {group.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Assign Users to Selected Group */}
                <div className="md:col-span-2">
                    {selectedGroup ? (
                        <div className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 italic uppercase">Manage: {selectedGroup.name}</h2>
                                    <p className="text-sm text-slate-500">Assign users to this segment</p>
                                </div>
                                <Users className="text-slate-300" size={32} />
                            </div>
                            
                            <div className="p-6">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                            <th className="pb-4 px-2">User Email</th>
                                            <th className="pb-4 px-2 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4 px-2">
                                                    <div className="font-bold text-slate-700">{user.email}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-black">
                                                        Current Group: {user.group_id ? groups.find(g => g.id === user.group_id)?.name : 'NONE'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-right">
                                                    <button 
                                                        onClick={() => addUserToGroup(selectedGroup.id, user.id)}
                                                        disabled={user.group_id === selectedGroup.id}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                            user.group_id === selectedGroup.id 
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                            : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                                        }`}
                                                    >
                                                        {user.group_id === selectedGroup.id ? 'Already In Group' : 'Add to Group'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-4xl p-20">
                            <UserPlus size={48} className="mb-4 opacity-20"/>
                            <p className="font-bold text-lg italic">Select a group from the left to manage members</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserGroups;