import { useState, useEffect } from 'react';
import api from '../api';
import { Users, Plus, UserPlus, Shield } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { ErrorNotice, LoadingNotice } from '../components/RequestState';
import { getRequestErrorMessage } from '../requestErrors';

const UserGroups = ({ isAdmin = false }) => {
    const { t } = useLanguage();
    const [groups, setGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchGroups = async () => {
        const res = await api.get('/groups/');
        setGroups(res.data);
    };

    const fetchUsers = async () => {
        const res = await api.get('/auth/users');
        setUsers(res.data);
    };

    const createGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName) return;
        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/groups/', { name: newGroupName });
            setNewGroupName('');
            await fetchGroups();
        } catch (requestError) {
            console.error('Group create failed', requestError);
            setError(getRequestErrorMessage(requestError, t('Unable to create group.')));
        } finally {
            setIsSaving(false);
        }
    };

    const addUserToGroup = async (groupId, userId) => {
        setError('');
        setSuccess('');
        try {
            await api.post(`/groups/${groupId}/add-user/${userId}`);
            await fetchUsers();
            setSuccess(t('User assigned to group!'));
        } catch (requestError) {
            console.error('Group assignment failed', requestError);
            setError(getRequestErrorMessage(requestError, t('Unable to assign user to group.')));
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [groupsResponse, usersResponse] = await Promise.all([
                    api.get('/groups/'),
                    api.get('/auth/users')
                ]);
                setGroups(groupsResponse.data);
                setUsers(usersResponse.data);
            } catch (requestError) {
                console.error('Could not load user groups', requestError);
                setError(getRequestErrorMessage(requestError, t('Unable to load user groups.')));
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [t]);

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-0 sm:space-y-8 sm:p-2">
            <div className="border-b pb-6">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{t('User Groups')}</h1>
                <p className="text-slate-500 font-medium">{t('Create segments for targeted feature rollouts.')}</p>
            </div>

            {error && <ErrorNotice message={error} retryLabel={t('Retry')} />}
            {success && <p className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800" role="status">{success}</p>}
            {isLoading ? <LoadingNotice message={t('Loading user groups...')} /> : <div className="grid min-w-0 gap-6 md:grid-cols-3 lg:gap-8">
                {/* Left Column: Create & List Groups */}
                <div className="md:col-span-1 space-y-6">
                    {isAdmin && <form onSubmit={createGroup} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">{t('New Group')}</h2>
                        <input 
                            className="w-full min-w-0 rounded-xl border-none bg-slate-50 p-3 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={t('e.g. Beta Testers')}
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                        />
                        <button disabled={isSaving} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                            <Plus size={18}/> {isSaving ? t('PLEASE WAIT...') : t('Create')}
                        </button>
                    </form>}

                    <div className="space-y-2">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 ml-2">{t('Available Groups')}</h2>
                        {groups.length === 0 ? <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">{t('No groups found')}</p> : groups.map(group => (
                            <button
                                type="button"
                                key={group.id} 
                                onClick={() => {
                                    setError('');
                                    setSelectedGroup(group);
                                }}
                                className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl border p-4 text-left transition-all ${
                                    selectedGroup?.id === group.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                                }`}
                            >
                                <span className="flex min-w-0 items-center gap-2 font-bold">
                                    <Shield className="shrink-0" size={16}/> <span className="break-all">{group.name}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Column: Assign Users to Selected Group */}
                <div className="md:col-span-2">
                    {selectedGroup ? (
                        <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:rounded-4xl">
                            <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-5 sm:items-center sm:p-8">
                                <div className="min-w-0">
                                    <h2 className="break-words text-xl font-black italic uppercase text-slate-800 sm:text-2xl">{t('Manage')}: {selectedGroup.name}</h2>
                                    <p className="text-sm text-slate-500">{t('Assign users to this segment')}</p>
                                </div>
                                <Users className="shrink-0 text-slate-300" size={28} />
                            </div>
                            
                            <div className="max-w-full overflow-x-auto p-3 sm:p-6">
                                <table className="w-full min-w-[34rem]">
                                    <thead>
                                        <tr className="text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                            <th className="pb-4 px-2">{t('User ID')}</th>
                                            <th className="pb-4 px-2 text-right">{t('Action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4 px-2">
                                                    <div className="font-bold text-slate-700">{t('User ID')}: {user.id}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-black">
                                                        {t('Current Group')}: {user.group_id ? groups.find(g => g.id === user.group_id)?.name : t('NONE')}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-right">
                                                    {isAdmin && <button
                                                        onClick={() => addUserToGroup(selectedGroup.id, user.id)}
                                                        disabled={user.group_id === selectedGroup.id}
                                                        className={`min-h-11 max-w-40 whitespace-normal rounded-xl px-3 py-2 text-xs font-bold transition-all sm:max-w-none sm:px-4 ${
                                                            user.group_id === selectedGroup.id 
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                            : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                                        }`}
                                                    >
                                                        {user.group_id === selectedGroup.id ? t('Already In Group') : t('Add to Group')}
                                                    </button>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-100 p-8 text-center text-slate-300 sm:rounded-4xl sm:p-12 lg:p-20">
                            <UserPlus size={48} className="mb-4 opacity-20"/>
                            <p className="font-bold text-lg italic">{t('Select a group from the left to manage members')}</p>
                        </div>
                    )}
                </div>
            </div>}
        </div>
    );
};

export default UserGroups;