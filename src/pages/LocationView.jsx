import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import {
    ArrowLeft, Package, Plus, MoreVertical, Edit2, Trash2,
    FolderInput, User, AlertTriangle, ChevronRight,
    Search, Clock, ArrowUpRight, Box, LayoutGrid, Tag, CheckCircle2,
    Folder, Home, ChevronLeft, PlusCircle, DollarSign, Calendar
} from 'lucide-react';

export default function LocationView() {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- Data State ---
    const [currentLocation, setCurrentLocation] = useState(null);
    const [parentPath, setParentPath] = useState([]);
    const [subLocations, setSubLocations] = useState([]);
    const [items, setItems] = useState([]);
    const [subLocationPreviews, setSubLocationPreviews] = useState({});
    const [loading, setLoading] = useState(true);

    // Raw locations for the Move Modal
    const [rawAllLocations, setRawAllLocations] = useState([]);

    // --- UI State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    // --- Menus & Modals ---
    const [openMenuId, setOpenMenuId] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [targetObject, setTargetObject] = useState(null);
    const [isTargetLocation, setIsTargetLocation] = useState(false);

    // --- Move Modal Navigation State ---
    const [moveCurrentFolder, setMoveCurrentFolder] = useState(null);
    const [moveBreadcrumbs, setMoveBreadcrumbs] = useState([]);
    const [isCreatingInModal, setIsCreatingInModal] = useState(false);
    const [newSubInModalName, setNewSubInModalName] = useState('');

    // --- Form Inputs ---
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [borrowerName, setBorrowerName] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [isCreatingSub, setIsCreatingSub] = useState(false);
    const [newSubName, setNewSubName] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    useEffect(() => {
        const closeMenu = () => setOpenMenuId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    async function fetchData() {
        try {
            setLoading(true);

            // 1. Fetch Current Location
            const locRes = await api.get(`/locations/${id}`);
            const locData = locRes.location || locRes;
            setCurrentLocation(locData);

            // 2. Fetch Parent Path (if exists)
            if (locData?.parent_id) {
                try {
                    // Note: Ideally backend returns parent info, but we can fetch it separately for now
                    const parentRes = await api.get(`/locations/${locData.parent_id}`);
                    setParentPath(parentRes.location ? [parentRes.location] : []);
                } catch (e) {
                    console.warn("Could not fetch parent location", e);
                    setParentPath([]);
                }
            } else {
                setParentPath([]);
            }

            // 3. Fetch Sub-locations
            const subRes = await api.get(`/locations?parent_id=${id}`);
            const subData = subRes.locations || [];
            setSubLocations(subData);

            // 4. Fetch Items
            const itemsRes = await api.get(`/items?location_id=${id}`);
            setItems(itemsRes.items || []);

            // 5. Fetch Previews for Sub-locations
            if (subData && subData.length > 0) {
                const subIds = subData.map(s => s.id);
                // 🟢 Optimization: Backend supports comma-separated location_ids
                const previewRes = await api.get(`/items?location_id=${subIds.join(',')}`);
                const previewData = previewRes.items || [];

                const previews = {};
                previewData.forEach(item => {
                    if (!previews[item.location_id]) previews[item.location_id] = [];
                    previews[item.location_id].push(item);
                });
                setSubLocationPreviews(previews);
            }

            // 6. Fetch All Locations for Move Modal (Lazy load later? For now keep simple)
            const allLocsRes = await api.get('/locations');
            setRawAllLocations(allLocsRes.locations || []);

        } catch (error) {
            console.error("Fetch Data Error:", error);
            // alert("Failed to load location data."); // Optional: Don't spam alert on load
        } finally {
            setLoading(false);
        }
    }

    // --- CRUD LOGIC ---
    const refreshData = async () => { await fetchData(); closeModal(); };

    const handleRename = async () => {
        if (!newName.trim()) return;
        try {
            if (isTargetLocation) {
                await api.put(`/locations/${targetObject.id}`, { name: newName });
            } else {
                await api.put(`/items/${targetObject.id}`, { name: newName });
            }
            refreshData();
        } catch (error) {
            alert("Rename failed: " + error.message);
        }
    };

    const handleMove = async () => {
        if (!isTargetLocation && !moveCurrentFolder) {
            alert("Items must be placed inside a room, not in the 'Root' list.");
            return;
        }
        const targetId = moveCurrentFolder ? moveCurrentFolder.id : null;
        if (isTargetLocation && targetId === targetObject.id) {
            alert("Cannot move a space into itself!");
            return;
        }

        try {
            if (isTargetLocation) {
                await api.put(`/locations/${targetObject.id}`, { parent_id: targetId });
            } else {
                await api.put(`/items/${targetObject.id}`, { location_id: targetId });
            }
            refreshData();
        } catch (error) {
            alert("Move failed: " + error.message);
        }
    };

    const handleCreateSubInModal = async (e) => {
        e.preventDefault();
        if (!newSubInModalName.trim()) return;

        try {
            const parentId = moveCurrentFolder ? moveCurrentFolder.id : null;
            await api.post('/locations', {
                name: newSubInModalName.trim(),
                parent_id: parentId
            });

            setNewSubInModalName('');
            setIsCreatingInModal(false);
            // Refresh all locations list
            const allLocsRes = await api.get('/locations');
            setRawAllLocations(allLocsRes.locations || []);
        } catch (error) {
            alert("Create sub-folder failed: " + error.message);
        }
    };

    const handleDelete = async () => {
        try {
            if (isTargetLocation) {
                await api.delete(`/locations/${targetObject.id}`);
            } else {
                await api.delete(`/items/${targetObject.id}`);
            }
            refreshData();
        } catch (error) {
            alert("Delete failed: " + error.message);
        }
    };

    const handleCreateSub = async (e) => {
        e.preventDefault();
        if (!newSubName.trim()) return;

        try {
            await api.post('/locations', {
                name: newSubName.trim(),
                parent_id: id
            });
            setNewSubName('');
            setIsCreatingSub(false);
            fetchData();
        } catch (error) {
            alert("Create unit failed: " + error.message);
        }
    };

    const handleCategoryChange = async () => {
        try {
            await api.put(`/items/${targetObject.id}`, { category: newCategory });
            refreshData();
        } catch (error) {
            alert("Update category failed: " + error.message);
        }
    };

    const handleLend = async () => {
        try {
            // Use the dedicated lend endpoint
            await api.post(`/items/${targetObject.id}/lend`, {
                borrower: borrowerName,
                due_date: dueDate ? new Date(dueDate).toISOString() : null
            });
            refreshData();
        } catch (error) {
            alert("Lend failed: " + error.message);
        }
    };

    const handleStatusChange = async () => {
        try {
            await api.put(`/items/${targetObject.id}`, { status: newStatus });
            refreshData();
        } catch (error) {
            alert("Update status failed: " + error.message);
        }
    };

    const handlePriceChange = async () => {
        try {
            await api.put(`/items/${targetObject.id}`, { price: parseFloat(newPrice) || 0 });
            refreshData();
        } catch (error) {
            alert("Update price failed: " + error.message);
        }
    };

    // --- UI HELPERS ---
    const openModal = (type, object, isLocation = false) => {
        setModalType(type);
        setTargetObject(object);
        setIsTargetLocation(isLocation);
        setOpenMenuId(null);

        if (type === 'rename') setNewName(object.name);
        if (type === 'category') setNewCategory(object.category || '');

        if (type === 'move') {
            setMoveCurrentFolder(null);
            setMoveBreadcrumbs([]);
            setIsCreatingInModal(false);
        }

        if (type === 'lend') {
            setBorrowerName('');
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            setDueDate(nextWeek.toISOString().split('T')[0]);
        }

        if (type === 'status') setNewStatus(object.status);
        if (type === 'price') setNewPrice(object.price || '');
    };

    const closeModal = () => { setModalType(null); setTargetObject(null); };

    const navigateToFolder = (folder) => {
        setMoveBreadcrumbs([...moveBreadcrumbs, moveCurrentFolder]);
        setMoveCurrentFolder(folder);
    };

    const navigateUp = () => {
        if (moveBreadcrumbs.length === 0) {
            setMoveCurrentFolder(null);
            return;
        }
        const prev = moveBreadcrumbs[moveBreadcrumbs.length - 1];
        setMoveBreadcrumbs(moveBreadcrumbs.slice(0, -1));
        setMoveCurrentFolder(prev);
    };

    const formatCurrency = (amount) => {
        return amount ? `$${amount}` : '';
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = activeFilter === 'all'
            ? true
            : activeFilter === 'recent'
                ? (new Date() - new Date(item.created_at) < 7 * 24 * 60 * 60 * 1000)
                : activeFilter === 'borrowed'
                    ? item.status === 'lent'
                    : true;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-32 font-sans text-slate-900">

            {/* HEADER */}
            <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 px-4 pt-6 pb-4 shadow-sm sticky top-0 z-20">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ArrowLeft size={24} /></button>
                    <h1 className="text-xl font-extrabold text-slate-800 dark:text-white dark:text-white">{currentLocation?.name || 'Loading...'}</h1>
                    <div className="w-8"></div>
                </div>

                {parentPath.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-bold mb-4 px-1">
                        <Link to="/" className="hover:text-primary">Home</Link>
                        <ChevronRight size={10} />
                        <Link to={`/location/${parentPath[0].id}`} className="hover:text-primary">{parentPath[0].name}</Link>
                        <ChevronRight size={10} />
                        <span className="text-slate-800 dark:text-white dark:text-white">{currentLocation?.name}</span>
                    </div>
                )}

                <div className="relative mb-4">
                    <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder={`Search in ${currentLocation?.name}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button onClick={() => setActiveFilter('all')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold transition-colors ${activeFilter === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}>All Items</button>
                    <button onClick={() => setActiveFilter('recent')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold transition-colors flex items-center gap-1 ${activeFilter === 'recent' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}><Clock size={12} /> Recently Added</button>
                    <button onClick={() => setActiveFilter('borrowed')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold transition-colors flex items-center gap-1 ${activeFilter === 'borrowed' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}><ArrowUpRight size={12} /> Borrowed</button>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* SUB-SPACES */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Storage Units</h2>
                        <button onClick={() => setIsCreatingSub(true)} className="text-primary text-xs font-bold hover:underline">+ Add Unit</button>
                    </div>

                    {isCreatingSub && (
                        <form onSubmit={handleCreateSub} className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                            <input autoFocus type="text" placeholder="e.g. Desk Drawer" className="flex-1 bg-white dark:bg-slate-900 dark:bg-slate-800 border border-primary rounded-xl px-3 py-3 text-sm font-bold text-slate-700 dark:text-white shadow-sm outline-none" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} />
                            <button type="submit" className="bg-primary text-white px-4 rounded-xl font-bold text-xs shadow-md">Add</button>
                            <button type="button" onClick={() => setIsCreatingSub(false)} className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 dark:text-slate-500 px-3 rounded-xl font-bold text-xs">Cancel</button>
                        </form>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {subLocations.map(sub => {
                            const previewItems = subLocationPreviews[sub.id] || [];
                            const count = previewItems.length;

                            return (
                                <div key={sub.id} className="bg-white dark:bg-slate-900 dark:bg-slate-800 p-5 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 dark:border-slate-700 relative group active:scale-[0.99] transition-all">
                                    <div className="flex items-start justify-between mb-3" onClick={() => navigate(`/location/${sub.id}`)}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#F0FDF4] rounded-2xl flex items-center justify-center text-primary">
                                                <LayoutGrid size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white dark:text-white leading-tight">{sub.name}</h3>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1">{count} items inside</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-4" onClick={() => navigate(`/location/${sub.id}`)}>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5"><Box size={12} /> X-Ray Peek</div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2">
                                            {count === 0 ? <span className="text-slate-300 dark:text-slate-400 dark:text-slate-500 italic">Empty storage unit</span> : `Contains: ${previewItems.map(i => i.name).join(', ')}...`}
                                        </p>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(count * 10, 100)}%` }}></div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === sub.id ? null : sub.id); }} className="absolute top-4 right-4 p-2 text-slate-300 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 dark:text-slate-500 rounded-full hover:bg-slate-50 dark:bg-slate-800">
                                        <MoreVertical size={20} />
                                    </button>
                                    {openMenuId === sub.id && (
                                        <div className="absolute right-4 top-12 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 dark:border-slate-700 z-30 w-40 py-1 animate-in zoom-in-95 duration-100 origin-top-right">
                                            <button onClick={() => openModal('rename', sub, true)} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 flex items-center gap-2"><Edit2 size={14} /> Rename</button>
                                            <button onClick={() => openModal('move', sub, true)} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 flex items-center gap-2"><FolderInput size={14} /> Move</button>
                                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                            <button onClick={() => openModal('delete', sub, true)} className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* LOOSE ITEMS (UPDATED) */}
                {filteredItems.length > 0 && (
                    <div className="space-y-3 pt-4">
                        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">Loose Items</h2>
                        {filteredItems.map(item => {
                            const isBadState = item.status === 'damaged' || item.status === 'lost';

                            // overdue check
                            const isOverdue = item.status === 'lent' && item.due_date && new Date() > new Date(item.due_date);

                            const containerClass = isBadState || isOverdue
                                ? "bg-red-50 border-red-100"
                                : "bg-white dark:bg-slate-900 dark:bg-slate-800 border-slate-100 dark:border-slate-800 dark:border-slate-700";

                            return (
                                <div key={item.id} className={`${containerClass} p-3 rounded-2xl border shadow-sm flex items-center gap-3 relative transition-colors`}>
                                    <div className="w-12 h-12 bg-white dark:bg-slate-900 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                                        {item.photo_url ? <img src={item.photo_url} className="w-full h-full object-cover rounded-xl" /> : <Package size={20} className="text-slate-300 dark:text-slate-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`text-sm font-bold truncate ${isBadState || isOverdue ? 'text-red-700' : 'text-slate-800 dark:text-white dark:text-white'}`}>{item.name}</h3>
                                            {item.price > 0 && (
                                                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${isBadState || isOverdue ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-50'}`}>
                                                    {formatCurrency(item.price)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${isBadState || isOverdue ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`}><Tag size={10} /> {item.category_details?.name || item.category || 'Uncategorized'}</span>
                                            {item.status !== 'available' && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${isOverdue ? 'bg-red-500 text-white' :
                                                    item.status === 'lent' ? 'bg-blue-100 text-blue-700' :
                                                        item.status === 'damaged' ? 'bg-orange-100 text-orange-700' :
                                                            item.status === 'lost' ? 'bg-slate-800 text-white' : ''
                                                    }`}>
                                                    {isOverdue ? 'Overdue' : item.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => openModal('item-menu', item)} className="p-2 text-slate-300 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 dark:text-slate-500"><MoreVertical size={18} /></button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="fixed bottom-24 right-6">
                <button onClick={() => navigate('/scan')} className="bg-primary text-white w-14 h-14 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"><Plus size={28} /></button>
            </div>

            {/* MODALS */}
            {modalType && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">

                        <h3 className="text-lg font-extrabold text-slate-800 dark:text-white dark:text-white mb-4 flex items-center gap-2">
                            {modalType === 'item-menu' ? targetObject?.name :
                                modalType === 'price' ? 'Update Price' :
                                    modalType === 'rename' ? 'Rename' :
                                        modalType === 'move' ? 'Move' :
                                            modalType === 'delete' ? 'Delete' :
                                                modalType === 'category' ? 'Category' :
                                                    modalType === 'lend' ? 'Lend Item' :
                                                        modalType === 'status' ? 'Update Status' : 'Action'}
                        </h3>

                        {/* ITEM MENU */}
                        {modalType === 'item-menu' && (
                            <div className="flex flex-col gap-2">
                                <button onClick={() => openModal('price', targetObject)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700"><DollarSign size={18} className="text-slate-400 dark:text-slate-500" /> Edit Value</button>
                                <button onClick={() => openModal('lend', targetObject)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700"><User size={18} className="text-slate-400 dark:text-slate-500" /> Lend to...</button>
                                <button onClick={() => openModal('status', targetObject)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700"><AlertTriangle size={18} className="text-slate-400 dark:text-slate-500" /> Mark Status</button>
                                <button onClick={() => openModal('category', targetObject)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700"><Tag size={18} className="text-slate-400 dark:text-slate-500" /> Edit Category</button>
                                <button onClick={() => openModal('rename', targetObject)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700"><Edit2 size={18} className="text-slate-400 dark:text-slate-500" /> Rename</button>
                                <button onClick={() => openModal('move', targetObject)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700"><FolderInput size={18} className="text-slate-400 dark:text-slate-500" /> Move</button>
                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                <button onClick={() => openModal('delete', targetObject)} className="w-full text-left p-4 bg-red-50 text-red-500 rounded-xl font-bold flex items-center gap-3 hover:bg-red-100"><Trash2 size={18} /> Delete</button>
                            </div>
                        )}

                        {/* PRICE MODAL */}
                        {modalType === 'price' && (
                            <>
                                <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-2 font-medium">Set value for <span className="text-slate-800 dark:text-white dark:text-white font-bold">{targetObject.name}</span>:</p>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-4 text-slate-300" size={20} />
                                    <input autoFocus type="number" className="w-full py-3.5 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white dark:text-white outline-none focus:ring-2 focus:ring-primary" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0.00" />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={closeModal} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:bg-slate-800 rounded-xl">Cancel</button>
                                    <button onClick={handlePriceChange} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Save</button>
                                </div>
                            </>
                        )}

                        {/* MOVE MODAL */}
                        {modalType === 'move' && (
                            <div className="flex flex-col h-[60vh] -mx-6 -my-4 p-6">
                                <div className="flex items-center gap-1 mb-4 text-xs font-bold text-slate-500">
                                    <button onClick={() => setMoveCurrentFolder(null)} className={`hover:text-primary ${!moveCurrentFolder ? 'text-slate-800 dark:text-white' : ''}`}><Home size={14} /></button>
                                    {moveCurrentFolder && <><ChevronRight size={12} /><span className="text-slate-800 dark:text-white line-clamp-1">{moveCurrentFolder.name}</span></>}
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {isCreatingInModal ? (
                                        <form onSubmit={handleCreateSubInModal} className="flex gap-2 mb-2 p-1">
                                            <input autoFocus type="text" placeholder="New folder name" className="flex-1 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 border border-primary rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-white outline-none" value={newSubInModalName} onChange={(e) => setNewSubInModalName(e.target.value)} />
                                            <button type="submit" className="bg-primary text-white px-3 py-2 rounded-lg text-xs font-bold">Save</button>
                                        </form>
                                    ) : (
                                        <button onClick={() => setIsCreatingInModal(true)} className="w-full text-left p-3 rounded-xl border border-dashed border-primary/30 text-primary font-bold text-sm flex items-center gap-2 hover:bg-primary/5"><PlusCircle size={16} /> Create New Space</button>
                                    )}
                                    {rawAllLocations.filter(l => l.parent_id === (moveCurrentFolder ? moveCurrentFolder.id : null) && l.id !== targetObject.id).map(loc => (
                                        <button key={loc.id} onClick={() => navigateToFolder(loc)} className="w-full bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-4 rounded-xl flex items-center justify-between group">
                                            <div className="flex items-center gap-3"><div className="bg-white dark:bg-slate-900 dark:bg-slate-700 p-2 rounded-lg text-amber-500 shadow-sm"><Folder size={18} fill="currentColor" className="opacity-80" /></div><span className="font-bold text-slate-700 dark:text-slate-300">{loc.name}</span></div><ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-primary" />
                                        </button>
                                    ))}
                                    {moveCurrentFolder && <button onClick={navigateUp} className="w-full text-left p-3 text-slate-400 dark:text-slate-500 font-bold text-xs flex items-center gap-2 hover:text-slate-600 dark:hover:text-slate-400 dark:text-slate-500 mt-2"><ChevronLeft size={14} /> Back to parent</button>}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 dark:border-slate-700">
                                    <div className="flex gap-3">
                                        <button onClick={closeModal} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
                                        <button onClick={handleMove} disabled={!isTargetLocation && !moveCurrentFolder} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{moveCurrentFolder ? `Move to ${moveCurrentFolder.name}` : (isTargetLocation ? 'Move to Home' : 'Select a Room')}</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {modalType === 'rename' && (<><input autoFocus type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white dark:text-white outline-none focus:ring-2 focus:ring-primary" value={newName} onChange={e => setNewName(e.target.value)} /><div className="flex gap-3 mt-6"><button onClick={closeModal} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-xl">Cancel</button><button onClick={handleRename} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Save</button></div></>)}
                        {modalType === 'delete' && (<><p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-6 font-medium">Are you sure you want to delete <span className="text-slate-800 dark:text-white dark:text-white font-bold">{targetObject.name}</span>?</p><div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-xl">Cancel</button><button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/30">Delete</button></div></>)}
                        {modalType === 'category' && (<><input autoFocus type="text" placeholder="e.g. Cables, Tools" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white dark:text-white outline-none focus:ring-2 focus:ring-primary" value={newCategory} onChange={e => setNewCategory(e.target.value)} /><div className="flex gap-3 mt-6"><button onClick={closeModal} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-xl">Cancel</button><button onClick={handleCategoryChange} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Save</button></div></>)}

                        {/* LEND MODAL */}
                        {modalType === 'lend' && (
                            <>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Borrower Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-3.5 text-slate-300 dark:text-slate-500" size={18} />
                                            <input autoFocus type="text" placeholder="Friend's Name" className="w-full p-3.5 pl-11 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white dark:text-white outline-none focus:ring-2 focus:ring-primary" value={borrowerName} onChange={e => setBorrowerName(e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 ml-1">Return Due Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-3.5 text-slate-300 dark:text-slate-500" size={18} />
                                            <input type="date" className="w-full p-3.5 pl-11 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white dark:text-white outline-none focus:ring-2 focus:ring-primary" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={closeModal} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:bg-slate-800 rounded-xl">Cancel</button>
                                    <button onClick={handleLend} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Confirm</button>
                                </div>
                            </>
                        )}

                        {modalType === 'status' && (<><div className="space-y-2">{['available', 'damaged', 'lost'].map(status => (<button key={status} onClick={() => setNewStatus(status)} className={`w-full p-4 rounded-xl font-bold text-left flex justify-between items-center ${newStatus === status ? 'bg-primary/10 text-primary border-2 border-primary' : 'bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-transparent'}`}><span className="capitalize">{status}</span>{newStatus === status && <CheckCircle2 size={20} />}</button>))}</div><div className="flex gap-3 mt-6"><button onClick={closeModal} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-xl">Cancel</button><button onClick={handleStatusChange} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg">Save</button></div></>)}

                    </div>
                </div>
            )}

        </div>
    );
}