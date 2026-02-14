import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, ChevronRight, LayoutGrid, Box,
    AlertTriangle, CheckCircle2, X, MoreVertical, Edit2, Trash2, Loader2, MapPin, Clock,
    QrCode // 🟢 新增 QrCode 图标
} from 'lucide-react';
import Scanner from '../components/Scanner'; // 🟢 确保引入 Scanner 组件

export default function Home() {
    const navigate = useNavigate();

    // --- Data State ---
    const [locations, setLocations] = useState([]);
    const [recentItems, setRecentItems] = useState([]);
    const [user, setUser] = useState(null);

    const [stats, setStats] = useState({ total: 0, damaged: 0, lost: 0, overdue: 0, lossValue: 0 });
    const [loading, setLoading] = useState(true);
    const [abnormalItems, setAbnormalItems] = useState([]);

    // --- UI State ---
    const [openMenuId, setOpenMenuId] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editModalType, setEditModalType] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showScanner, setShowScanner] = useState(false); // 🟢 新增扫描器状态

    const [newLocName, setNewLocName] = useState('');
    const [editName, setEditName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const closeMenu = () => setOpenMenuId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    async function fetchData() {
        try {
            setLoading(true);

            // Get user from localStorage
            const userStr = localStorage.getItem('user');
            const userData = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;

            // App.jsx already handles authentication, no need to redirect here
            // if (!userData) {
            //     window.location.href = '/';
            //     return;
            // }

            setUser(userData);

            // Fetch locations and items from backend
            const locsRes = await api.get('/locations');
            const itemsRes = await api.get('/items');

            const locs = locsRes.data?.locations || [];
            const items = itemsRes.data?.items || [];

            if (locs && items) {
                // Only show root locations (no parent_id)
                const rootLocs = locs.filter(loc => !loc.parent_id);

                // Helper to get all descendant location IDs recursively
                const getDescendantIds = (locId, allLocs) => {
                    const children = allLocs.filter(l => l.parent_id === locId);
                    let ids = [locId];
                    children.forEach(child => {
                        ids = [...ids, ...getDescendantIds(child.id, allLocs)];
                    });
                    return ids;
                };

                const locsWithCounts = rootLocs.map(loc => {
                    const descendantIds = getDescendantIds(loc.id, locs);
                    // Count items where location_id is in the set of default + descendant IDs
                    const count = items.filter(i => descendantIds.includes(i.location_id)).length;
                    return {
                        ...loc,
                        itemCount: count
                    };
                });
                setLocations(locsWithCounts);
                setRecentItems(items.slice(0, 3));

                const now = new Date();
                const isOverdue = (item) => {
                    if (item.status !== 'lent') return false;
                    if (!item.due_date) return false;
                    return new Date(item.due_date) < now;
                };

                const damagedItems = items.filter(i => i.status === 'damaged');
                const lostItems = items.filter(i => i.status === 'lost');
                const overdueItems = items.filter(i => isOverdue(i));

                const lossVal = [...damagedItems, ...lostItems].reduce((sum, i) => sum + (Number(i.price) || 0), 0);

                setStats({
                    total: items.length,
                    damaged: damagedItems.length,
                    lost: lostItems.length,
                    overdue: overdueItems.length,
                    lossValue: lossVal
                });

                setAbnormalItems([...overdueItems, ...damagedItems, ...lostItems]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // --- ACTIONS ---
    const handleCreateLocation = async (e) => {
        e.preventDefault();
        if (!newLocName.trim()) return;
        setIsProcessing(true);
        try {
            await api.post('/locations', { name: newLocName });
            setNewLocName('');
            setIsCreateModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRename = async () => {
        if (!editName.trim()) return;
        setIsProcessing(true);
        try {
            await api.put(`/locations/${selectedLocation.id}`, { name: editName });
            closeEditModal();
            fetchData();
        } catch (error) {
            alert('Rename failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        setIsProcessing(true);
        try {
            // Backend should handle cascading deletes
            await api.delete(`/locations/${selectedLocation.id}`);
            closeEditModal();
            fetchData();
        } catch (error) {
            alert('Delete failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const openEditModal = (type, loc) => {
        setEditModalType(type);
        setSelectedLocation(loc);
        setOpenMenuId(null);
        if (type === 'rename') setEditName(loc.name);
    };

    const closeEditModal = () => {
        setEditModalType(null);
        setSelectedLocation(null);
    };

    const formatMoney = (amount) => `$${amount.toLocaleString()}`;
    const hasIssues = stats.damaged + stats.lost + stats.overdue > 0;

    // 🟢 新增：图片分析处理函数，支持自动分类开关
    const handleImageAnalysis = async (imageFile) => {
        // 检查用户是否开启了自动分类
        const isAiEnabled = localStorage.getItem('pref_auto_categorize') !== 'false';

        let identifiedData = { name: '', category: '', price: '' };

        if (isAiEnabled) {
            // 用户开启了 AI：执行 Gemini 调用逻辑
            try {
                // 这里的 callGeminiApi 是你原本封装好的函数（如需补充请告知）
                identifiedData = await callGeminiApi(imageFile);
            } catch (error) {
                console.error("AI Analysis failed, skipping...", error);
            }
        } else {
            // 用户关闭了 AI：跳过分析，直接使用空数据或手动输入
            console.log("AI is OFF, skipping analysis.");
        }

        // 后续逻辑，比如打开添加弹窗并填入数据
        setFormData(identifiedData);
        setIsAddModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 dark:text-white transition-colors duration-300 pb-32">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 shadow-sm rounded-b-[2.5rem] sticky top-0 z-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">My Space</h1>
                        <p className="text-slate-400 dark:text-slate-500 text-sm font-bold mt-1">Inventory Overview</p>
                    </div>
                    <div
                        onClick={() => navigate('/profile')}
                        className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                    >
                        {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </div>
                </div>

                {/* 🟢 Search & Scan Area */}
                <div className="flex items-center gap-3">
                    {/* Search Bar - Flex 1 to take remaining space */}
                    <div onClick={() => navigate('/search')} className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-3 text-slate-400 dark:text-slate-500 cursor-pointer active:scale-[0.98] transition-transform">
                        <Search size={20} />
                        <span className="font-bold text-sm">Search items...</span>
                    </div>

                    {/* 🟢 QR Code Scanner Button - Fixed Width */}
                    <button
                        onClick={() => setShowScanner(true)}
                        className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary active:scale-90 transition-transform shadow-sm border border-transparent dark:border-slate-700"
                    >
                        <QrCode size={24} />
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* STATUS CARD */}
                <div onClick={() => hasIssues && setShowStatusModal(true)}
                    className={`p-5 rounded-3xl shadow-sm border flex items-center justify-between cursor-pointer transition-transform active:scale-[0.98] 
               ${hasIssues ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                    <div>
                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 ${hasIssues ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>Item Status</h3>
                        <div className="flex flex-col">
                            {hasIssues ? (
                                <>
                                    {stats.overdue > 0 && <span className="text-lg font-extrabold text-red-600"> {stats.overdue} Overdue!</span>}
                                    {(stats.damaged + stats.lost > 0) && (
                                        <span className={`text-xs font-bold ${stats.overdue > 0 ? 'text-red-400' : 'text-lg font-extrabold text-red-600'}`}>
                                            {stats.damaged + stats.lost} Issues Detected
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-lg font-extrabold text-green-600">All Good</span>
                            )}
                        </div>
                        {stats.lossValue > 0 && <p className="text-xs text-red-400 font-bold mt-1">Est. Loss: -{formatMoney(stats.lossValue)}</p>}
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasIssues ? 'bg-red-100 dark:bg-red-900/40 text-red-500' : 'bg-green-100 dark:bg-green-900/40 text-green-500'}`}>
                        {stats.overdue > 0 ? <Clock size={24} /> : (hasIssues ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />)}
                    </div>
                </div>

                {/* LOCATIONS GRID */}
                <div>
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Rooms</h2>
                        <button onClick={() => setIsCreateModalOpen(true)} className="text-primary text-xs font-bold hover:underline">+ New Room</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div onClick={() => setIsCreateModalOpen(true)} className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-32">
                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm"><Plus size={20} /></div>
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Add Room</span>
                        </div>
                        {locations.map(loc => (
                            <div key={loc.id} onClick={() => navigate(`/location/${loc.id}`)} className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.96] transition-all relative h-32 flex flex-col justify-between group">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 bg-[#F0FDF4] dark:bg-green-900/30 rounded-xl flex items-center justify-center text-primary">
                                        <LayoutGrid size={20} />
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === loc.id ? null : loc.id); }} className="p-1 -mr-2 -mt-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 dark:text-white text-sm truncate">{loc.name}</h3>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">{loc.itemCount || 0} items</p>
                                </div>
                                {openMenuId === loc.id && (
                                    <div className="absolute right-2 top-10 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 w-32 py-1 animate-in zoom-in-95 duration-100 origin-top-right">
                                        <button onClick={(e) => { e.stopPropagation(); openEditModal('rename', loc); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"><Edit2 size={12} /> Rename</button>
                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                        <button onClick={(e) => { e.stopPropagation(); openEditModal('delete', loc); }} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"><Trash2 size={12} /> Delete</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Items */}
                <div>
                    <h2 className="text-lg font-extrabold text-slate-800 dark:text-white mb-4 px-1">Recently Added</h2>
                    <div className="space-y-3">
                        {recentItems.map(item => (
                            <div key={item.id} className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/item/${item.id}`)}>
                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Box size={20} className="text-slate-400 dark:text-slate-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate">{item.name}</h3>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5 truncate">{item.location?.name || item.Location?.name || 'Unknown'}</p>
                                </div>
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">New</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 🟢 Render Scanner if active */}
            {showScanner && <Scanner onClose={() => setShowScanner(false)} />}

            {/* --- MODALS --- */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">New Room</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateLocation}>
                            <input autoFocus type="text" placeholder="e.g. Garage" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none font-bold text-slate-800 dark:text-white" value={newLocName} onChange={(e) => setNewLocName(e.target.value)} />
                            <button type="submit" disabled={!newLocName.trim() || isProcessing} className="w-full mt-6 bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50">{isProcessing ? 'Creating...' : 'Create'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Rename/Delete Modal */}
            {editModalType && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEditModal}></div>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10">
                        {editModalType === 'rename' && (
                            <>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Rename Room</h3>
                                <input autoFocus type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none font-bold text-slate-800 dark:text-white" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                <div className="flex gap-3 mt-6">
                                    <button onClick={closeEditModal} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
                                    <button onClick={handleRename} disabled={isProcessing} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg">{isProcessing ? 'Saving...' : 'Save'}</button>
                                </div>
                            </>
                        )}
                        {editModalType === 'delete' && (
                            <>
                                <h3 className="text-lg font-bold text-red-600 mb-2">Delete Room?</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">Deleting <span className="font-bold">{selectedLocation?.name}</span> will also delete all items inside.</p>
                                <div className="flex gap-3">
                                    <button onClick={closeEditModal} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
                                    <button onClick={handleDelete} disabled={isProcessing} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg">{isProcessing ? 'Deleting...' : 'Delete All'}</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Status Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStatusModal(false)}></div>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-extrabold text-red-600 flex items-center gap-2"><AlertTriangle size={24} /> Attention Needed</h3>
                            <button onClick={() => setShowStatusModal(false)} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400"><X size={20} /></button>
                        </div>

                        {stats.lossValue > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl mb-4 text-center">
                                <div className="text-xs text-red-400 font-bold uppercase">Total Financial Loss</div>
                                <div className="text-3xl font-extrabold text-red-600 mt-1">-{formatMoney(stats.lossValue)}</div>
                            </div>
                        )}

                        <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                            {abnormalItems.map(item => {
                                const isItemOverdue = item.status === 'lent' && item.due_date && (new Date() > new Date(item.due_date));
                                if (item.status === 'lent' && !isItemOverdue) return null;

                                return (
                                    <div key={item.id} className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-3 rounded-xl cursor-pointer" onClick={() => { setShowStatusModal(false); navigate(`/item/${item.id}`); }}>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-slate-800 dark:text-white truncate">{item.name}</div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500">{item.location?.name || item.Location?.name || 'Unknown'}</div>
                                        </div>
                                        <div className="text-right ml-3">
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-extrabold uppercase ${item.status === 'lost' ? 'bg-slate-800 text-white' :
                                                isItemOverdue ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
                                                }`}>
                                                {isItemOverdue ? 'Overdue' : item.status}
                                            </span>
                                            {item.status !== 'lent' && <div className="text-xs font-bold text-red-500 mt-1">-{formatMoney(item.price || 0)}</div>}
                                            {isItemOverdue && <div className="text-[10px] font-bold text-red-400 mt-1">Due {new Date(item.due_date).toLocaleDateString()}</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}