import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, LogOut, ArrowLeft, Search, Shield, Trash2, Loader2, Calendar, Download, Crown, User, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProUsers: 0,
        totalMoney: 0
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const statsRes = await api.getAdminStats();
            if (statsRes) {
                setStats(statsRes);
            }

            const usersRes = await api.getUsers();
            if (usersRes && usersRes.users) {
                setUsers(usersRes.users);
            }
        } catch (e) {
            console.error("Failed to fetch admin data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

        try {
            setProcessingId(userId);
            await api.deleteUser(userId);
            await fetchData(); // Refresh list to update stats
        } catch (e) {
            alert("Failed to delete user: " + e.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleToggleSubscription = async (user) => {
        const currentRole = getUserRole(user);
        if (currentRole === 'admin') return;

        const newStatus = currentRole === 'pro' ? 'free' : 'pro';
        const confirmMsg = newStatus === 'pro'
            ? `Upgrade ${user.full_name || user.email || 'this user'} to PRO?`
            : `Downgrade ${user.full_name || user.email || 'this user'} to FREE?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            setProcessingId(user.id);
            await api.toggleSubscription(user.id, newStatus);
            await fetchData();
        } catch (e) {
            alert("Failed to update subscription: " + e.message);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.id && user.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatDate = (dateString, showTime = false) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: showTime ? '2-digit' : undefined,
            minute: showTime ? '2-digit' : undefined
        });
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    // Helper to determine role
    const getUserRole = (user) => {
        if (user.is_admin) return 'admin';
        if (user.pro_expiry && new Date(user.pro_expiry) > new Date()) return 'pro';
        return 'free';
    };

    const handleExportCSV = () => {
        // Define CSV headers
        const headers = ['User ID', 'User Name', 'Contact (Email)', 'Join Time', 'Role', 'Pro Start', 'Pro Due', 'Status'];

        // Map user data to CSV rows
        const rows = filteredUsers.map(user => {
            const role = getUserRole(user).toUpperCase();
            const joinTime = new Date(user.created_at).toISOString();
            const proStart = user.pro_start_date ? new Date(user.pro_start_date).toISOString() : '';
            const proDue = user.pro_expiry ? new Date(user.pro_expiry).toISOString() : '';

            return [
                user.id,
                `"${user.full_name || user.email || 'No Name'}"`,
                user.email,
                joinTime,
                role,
                proStart,
                proDue,
                'Active'
            ];
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
                <div className="p-6">
                    <div className="flex items-center gap-3 text-slate-800 font-extrabold text-2xl">
                        <Shield className="text-primary" size={28} />
                        <span>Admin</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <div className="bg-slate-100 text-slate-800 px-4 py-3 rounded-xl font-bold flex items-center gap-3 cursor-pointer">
                        <Users size={20} />
                        <span>Dashboard</span>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-100 mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full text-left px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-colors"
                    >
                        <ArrowLeft size={18} /> Back to App
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/auth';
                        }}
                        className="w-full text-left px-4 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl flex items-center gap-3 mt-2 transition-colors"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8 overflow-y-auto min-h-screen">

                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800">Overview</h1>
                        <p className="text-slate-400 font-bold text-sm mt-1">Welcome back, Admin.</p>
                    </div>

                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/auth';
                        }}
                        className="bg-white text-red-500 hover:bg-red-50 border border-slate-100 p-3 rounded-2xl font-bold transition-all shadow-sm flex items-center gap-2 group"
                        title="Sign Out"
                    >
                        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Users</h3>
                                <p className="text-3xl font-extrabold text-slate-800">{loading ? '...' : stats.totalUsers}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                                <Crown size={24} />
                            </div>
                            <div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pro Users</h3>
                                <p className="text-3xl font-extrabold text-slate-800">{loading ? '...' : stats.totalProUsers}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Money</h3>
                                <p className="text-3xl font-extrabold text-slate-800">{loading ? '...' : formatMoney(stats.totalMoney)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Management Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-xl font-extrabold text-slate-800">User Management</h2>

                        <div className="flex gap-3 w-full md:w-auto">
                            {/* Search Bar */}
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="w-full bg-slate-50 pl-10 pr-4 py-2.5 rounded-xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* CSV Export Button */}
                            <button
                                onClick={handleExportCSV}
                                className="bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200"
                            >
                                <Download size={18} /> <span className="hidden sm:inline">Export CSV</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                                    <th className="px-6 py-4 rounded-tl-3xl">User ID</th>
                                    <th className="px-6 py-4">User Name</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Join Time</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Pro Start</th>
                                    <th className="px-6 py-4">Pro Due</th>
                                    <th className="px-6 py-4 text-right rounded-tr-3xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                                {loading && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="animate-spin" size={18} /> Loading users...
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {!loading && filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                                            No users found matching "{searchTerm}"
                                        </td>
                                    </tr>
                                )}

                                {!loading && filteredUsers.map(user => {
                                    const role = getUserRole(user);
                                    const isProcessing = processingId === user.id;

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* User ID */}
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md w-fit select-all" title={user.id}>
                                                    {user.id.slice(0, 8)}...
                                                </div>
                                            </td>

                                            {/* User Name */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-extrabold overflow-hidden flex-shrink-0">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            user.full_name ? user.full_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : <User size={14} />)
                                                        )}
                                                    </div>
                                                    <div className="text-slate-800">{user.full_name || user.email || 'No Name'}</div>
                                                </div>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-6 py-4 text-slate-500 font-normal text-xs">{user.email}</td>

                                            {/* Join Time */}
                                            <td className="px-6 py-4 text-slate-400 text-xs font-normal">
                                                {formatDate(user.created_at)}
                                            </td>

                                            {/* Role */}
                                            <td className="px-6 py-4">
                                                {role === 'admin' && (
                                                    <span className="bg-slate-800 text-white px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 w-fit">
                                                        <Shield size={12} fill="currentColor" /> Admin
                                                    </span>
                                                )}
                                                {role === 'pro' && (
                                                    <span className="bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 w-fit">
                                                        <Crown size={12} fill="currentColor" /> Pro
                                                    </span>
                                                )}
                                                {role === 'free' && (
                                                    <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-xs font-bold w-fit">Free</span>
                                                )}
                                            </td>

                                            {/* Pro Dates */}
                                            <td className="px-6 py-4 text-slate-500 font-normal text-xs whitespace-nowrap">
                                                {formatDate(user.pro_start_date)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-normal text-xs whitespace-nowrap">
                                                {role === 'pro' ? (
                                                    <span className={new Date(user.pro_expiry) < new Date() ? 'text-red-500 font-bold' : ''}>
                                                        {formatDate(user.pro_expiry)}
                                                    </span>
                                                ) : '-'}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                {!user.is_admin && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Toggle Pro Button / Switch */}
                                                        <button
                                                            onClick={() => handleToggleSubscription(user)}
                                                            disabled={isProcessing}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${role === 'pro' ? 'bg-amber-500' : 'bg-slate-200'}`}
                                                            title={role === 'pro' ? "Downgrade to Free" : "Upgrade to Pro"}
                                                        >
                                                            <span className="sr-only">Make Pro/Free</span>
                                                            <span
                                                                className={`${role === 'pro' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                            />
                                                        </button>

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            disabled={isProcessing}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    );
}
