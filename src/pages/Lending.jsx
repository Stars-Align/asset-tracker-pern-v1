import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { ArrowLeft, User, Calendar, CheckCircle2, Clock, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LendingPage() {
    const navigate = useNavigate();
    const [lentItems, setLentItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLentItems();
    }, []);

    async function fetchLentItems() {
        try {
            setLoading(true);
            // Backend: supports filtering status=lent in getItems
            const res = await api.get('/items?status=lent');
            setLentItems(res.data.items || []);
        } catch (e) {
            console.error("Fetch lent items error", e);
        } finally {
            setLoading(false);
        }
    }

    const handleReturn = async (item) => {
        if (!window.confirm(`Mark ${item.name} as returned?`)) return;

        try {
            await api.post(`/items/${item.id}/return`);
            fetchLentItems();
        } catch (e) {
            alert("Return failed: " + e.message);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'No date';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDaysOverdue = (dueDate) => {
        if (!dueDate) return 0;
        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = now - due;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 pb-20 font-sans text-slate-900">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ArrowLeft size={24} /></button>
                    <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Lending Tracker</h1>
                </div>
            </div>

            <div className="p-4 space-y-4">

                {/* Stats Cards (Simple) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-500 text-white p-5 rounded-2xl shadow-lg shadow-blue-500/20">
                        <h3 className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Active Loans</h3>
                        <p className="text-3xl font-extrabold">{lentItems.length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Overdue</h3>
                        <p className="text-3xl font-extrabold text-red-500">
                            {lentItems.filter(i => getDaysOverdue(i.due_date) > 0).length}
                        </p>
                    </div>
                </div>

                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 mt-4">Currently Borrowed</h2>

                {loading ? (
                    <div className="text-center py-10 text-slate-400">Loading...</div>
                ) : lentItems.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p>No items currently lent out.</p>
                        <button onClick={() => navigate('/')} className="text-primary font-bold text-sm mt-2">Lend an item</button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {lentItems.map(item => {
                            const overdueDays = getDaysOverdue(item.due_date);
                            const isOverdue = overdueDays > 0;

                            return (
                                <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                    {isOverdue && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-xl z-20">OVERDUE {overdueDays} DAYS</div>}

                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                            {item.photo_url ? (
                                                <img src={item.photo_url} className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <Package className="text-slate-300 dark:text-slate-600" size={24} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">{item.name}</h3>

                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                                    <User size={12} className="text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.borrower}</span>
                                                </div>
                                                {item.due_date && (
                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                                                        <Calendar size={12} />
                                                        <span className="text-xs font-bold">{formatDate(item.due_date)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                                        <button
                                            onClick={() => handleReturn(item)}
                                            className="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors"
                                        >
                                            <CheckCircle2 size={14} /> Mark Returned
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}