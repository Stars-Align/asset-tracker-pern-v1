import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';
import { Trash2, User, Search, ShieldCheck } from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await api.getUsers();
            if (res.success) {
                setUsers(res.data.users);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            alert('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;

        try {
            await api.deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
            alert('User deleted successfully');
        } catch (error) {
            alert('Failed to delete user: ' + error.message);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Users</h1>
                    <p className="text-slate-400 dark:text-slate-500 font-bold mt-1">Manage accounts</p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-primary outline-none text-sm font-bold w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 overflow-hidden">
                                            {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={20} />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 dark:text-white text-sm">{user.full_name || 'No Name'}</div>
                                            <div className="text-xs text-slate-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {user.is_admin ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            <ShieldCheck size={12} /> Admin
                                        </span>
                                    ) : user.is_pro ? (
                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                            Pro
                                        </span>
                                    ) : (
                                        <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                            User
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-slate-600 dark:text-slate-300">{user.item_count}</span>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-400 font-bold">
                                    {new Date(user.joined_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {currentUser?.id !== user.id && (
                                        <button
                                            onClick={() => handleDelete(user.id, user.full_name || user.email)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="p-12 text-center text-slate-400 font-bold">
                        No users found.
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
