import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/api';
import { Users, Package, DollarSign, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const res = await api.getAdminStats();
            if (res.success) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Failed to load admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount) => `$${amount.toLocaleString()}`;

    const StatCard = ({ title, value, icon: Icon, colorClass, subtext }) => (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
                    <Icon size={24} />
                </div>
                {subtext && <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">{subtext}</span>}
            </div>
            <h3 className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{title}</h3>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{value}</p>
        </div>
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
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Dashboard</h1>
                <p className="text-slate-400 dark:text-slate-500 font-bold mt-1">System Overview</p>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={Users}
                        colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                    />
                    <StatCard
                        title="Total Items"
                        value={stats.totalItems}
                        icon={Package}
                        colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20"
                    />
                    <StatCard
                        title="Total Value"
                        value={formatMoney(stats.totalValue)}
                        icon={DollarSign}
                        colorClass="bg-green-50 text-green-600 dark:bg-green-900/20"
                    />
                    <StatCard
                        title="Issues"
                        value={stats.damagedItems + stats.lostItems}
                        icon={AlertTriangle}
                        colorClass="bg-red-50 text-red-600 dark:bg-red-900/20"
                        subtext={`${stats.damagedItems} Damaged, ${stats.lostItems} Lost`}
                    />
                </div>
            )}

            {/* Placeholder for future charts */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center py-20">
                <p className="text-slate-400 font-bold">Analytics Charts Coming Soon</p>
            </div>
        </AdminLayout>
    );
}
