import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search as SearchIcon, Package, MapPin, ChevronDown, ChevronRight, Loader2, FolderOpen, Folder, Plus, X, Tag, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ItemsPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [manualCategories, setManualCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});

    // Menu & Modal State
    const [openMenuCategory, setOpenMenuCategory] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categoryInput, setCategoryInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const handleClick = () => setOpenMenuCategory(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    async function fetchData() {
        try {
            setLoading(true);

            const itemsRes = await api.get('/items');
            const catsRes = await api.get('/categories');

            const itemsData = itemsRes.items || [];
            const catsData = catsRes.categories || [];

            setItems(itemsData);
            setManualCategories(catsData);

        } catch (error) {
            console.error('Error fetching data:', error.message);
            // alert("Failed to load items.");
        } finally {
            setLoading(false);
        }
    }

    // --- LOGIC: Grouping ---
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const groupedItems = filteredItems.reduce((acc, item) => {
        // Prefer category_details.name if available (from backend link), fallback to item.category (legacy string)
        const rawCat = item.category_details?.name || item.category || 'Uncategorized';
        const cat = rawCat.trim();
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    manualCategories.forEach(c => {
        // Create empty groups for existing categories if they match search
        if (!groupedItems[c.name]) {
            if (!searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                groupedItems[c.name] = [];
            }
        }
    });

    const categories = Object.keys(groupedItems).sort();

    // --- ACTIONS ---

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    // 1. Create
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!categoryInput.trim()) return;
        setIsProcessing(true);
        try {
            await api.post('/categories', { name: categoryInput.trim() });
            closeModal();
            fetchData();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // 2. Rename
    const handleRenameCategory = async (e) => {
        e.preventDefault();
        if (!categoryInput.trim() || categoryInput === selectedCategory) return;
        setIsProcessing(true);

        try {
            const oldName = selectedCategory;
            const newName = categoryInput.trim();

            // Step A: Update/Create Category in 'categories' table
            // Check if we are renaming 'Uncategorized' (creating new from scratch essentially)
            if (oldName === 'Uncategorized') {
                try {
                    await api.post('/categories', { name: newName });
                } catch (e) {
                    // Ignore if exists
                }
            } else {
                // Find ID of category to rename
                const catObj = manualCategories.find(c => c.name === oldName);
                if (catObj) {
                    await api.put(`/categories/${catObj.id}`, { name: newName });
                } else {
                    // Fallback if not found in list but exists in UI? Create it.
                    await api.post('/categories', { name: newName });
                }
            }

            // Step B: Bulk update items using new backend endpoint
            // This handles the string-based 'category' field on items
            await api.put('/items/batch/category', {
                oldCategoryName: oldName,
                newCategoryName: newName
            });

            closeModal();
            fetchData();

        } catch (error) {
            alert('Rename failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // 3. Delete
    const handleDeleteCategory = async () => {
        setIsProcessing(true);
        try {
            const targetName = selectedCategory;

            // Step A: Delete from 'categories' table
            const catObj = manualCategories.find(c => c.name === targetName);
            if (catObj) {
                await api.delete(`/categories/${catObj.id}`);
            }

            // Step B: Batch clear items category
            await api.put('/items/batch/clear-category', {
                categoryName: targetName
            });

            closeModal();
            fetchData();

        } catch (error) {
            alert('Delete failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- UI Helpers ---
    const openModal = (type, categoryName = '') => {
        setModalType(type);
        setSelectedCategory(categoryName);
        setCategoryInput(type === 'rename' ? categoryName : '');
        setOpenMenuCategory(null);
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedCategory('');
        setCategoryInput('');
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 dark:text-white transition-colors duration-300 pb-28 relative">

            {/* Top Search Bar */}
            <div className="bg-white dark:bg-slate-900 sticky top-0 z-10 px-4 py-4 shadow-sm">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">All Items</h1>
                    <button
                        onClick={() => openModal('create')}
                        className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center active:bg-primary/20 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-300" size={20} />
                    <input
                        type="text" placeholder="Search items or categories..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-3 pl-12 pr-4 font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" /></div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <FolderOpen size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                        <p className="text-slate-500 dark:text-slate-400">No categories found.</p>
                        <button onClick={() => openModal('create')} className="text-primary font-bold mt-2 text-sm">Create one?</button>
                    </div>
                ) : (
                    categories.map(category => {
                        const isExpanded = expandedCategories[category];
                        const count = groupedItems[category].length;

                        return (
                            <div key={category} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-visible transition-all duration-300 relative">

                                {/* Category Header */}
                                <div
                                    onClick={() => toggleCategory(category)}
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors pr-12"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isExpanded ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300'}`}>
                                            {isExpanded ? <FolderOpen size={20} /> : <Folder size={20} />}
                                        </div>
                                        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{category}</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${count === 0 ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'}`}>{count}</span>
                                        {isExpanded ? <ChevronDown size={18} className="text-slate-400 dark:text-slate-300" /> : <ChevronRight size={18} className="text-slate-400 dark:text-slate-300" />}
                                    </div>
                                </div>

                                {/* Menu Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setOpenMenuCategory(openMenuCategory === category ? null : category); }}
                                    className="absolute right-2 top-4 p-2 text-slate-300 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-10"
                                >
                                    <MoreVertical size={18} />
                                </button>

                                {/* Dropdown Menu */}
                                {openMenuCategory === category && (
                                    <div className="absolute right-4 top-12 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 w-40 py-1 animate-in zoom-in-95 duration-100 origin-top-right">
                                        <button onClick={() => openModal('rename', category)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                                            <Edit2 size={14} /> Rename
                                        </button>
                                        {category !== 'Uncategorized' && (
                                            <>
                                                <div className="h-px bg-slate-100 my-1"></div>
                                                <button onClick={() => openModal('delete', category)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2">
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Items List */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        {count === 0 ? (
                                            <div className="text-center py-6 text-slate-400 dark:text-slate-300 text-xs italic">Empty folder.</div>
                                        ) : (
                                            groupedItems[category].map(item => (
                                                <div key={item.id} onClick={() => navigate(`/location/${item.location_id}`)} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer ml-2">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.status === 'lent' ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300'}`}>
                                                        <Package size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate">{item.name}</h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {/* 🟢 Corrected prop access: item.location.name */}
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 truncate"><MapPin size={10} /> {item.location?.name || 'Unknown'}</div>
                                                            {item.status !== 'available' && <span className="bg-orange-100 text-orange-700 text-[9px] px-1.5 py-0 rounded-full font-bold uppercase">{item.status}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* MODAL */}
            {modalType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                {modalType === 'create' && <><Plus size={24} className="text-primary" /> New Category</>}
                                {modalType === 'rename' && <><Edit2 size={24} className="text-primary" /> Rename Category</>}
                                {modalType === 'delete' && <><Trash2 size={24} className="text-red-500" /> Delete Category</>}
                            </h3>
                            <button onClick={closeModal} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"><X size={20} /></button>
                        </div>

                        {(modalType === 'create' || modalType === 'rename') && (
                            <form onSubmit={modalType === 'create' ? handleCreateCategory : handleRenameCategory}>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Category Name</label>
                                <input
                                    autoFocus type="text" placeholder="e.g. Cables, Tools..."
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none text-lg font-bold text-slate-800 dark:text-white placeholder:font-normal"
                                    value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)}
                                />
                                <button type="submit" disabled={!categoryInput.trim() || isProcessing} className="w-full mt-6 bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-50">
                                    {isProcessing ? 'Saving...' : 'Save'}
                                </button>
                            </form>
                        )}

                        {modalType === 'delete' && (
                            <div>
                                <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                                    Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-white">"{selectedCategory}"</span>?
                                    <br /><br />
                                    Items in this category will become <span className="font-bold text-orange-500">Uncategorized</span>. They will NOT be deleted.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={closeModal} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
                                    <button onClick={handleDeleteCategory} disabled={isProcessing} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 disabled:opacity-50">
                                        {isProcessing ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}