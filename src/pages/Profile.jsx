import React, { useEffect, useState, useRef } from 'react';
import api, { API_BASE_URL } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, Shield, Bell, Sparkles, ChevronRight,
    Download, Box, DollarSign, TrendingUp, Edit2, User,
    ArrowLeft, Check, X, AlertTriangle, Info, Clock, Lock, Github,
    Smartphone, Globe, Moon, BellOff, MapPin, Mail, Camera, CreditCard, Loader2, Image as ImageIcon
} from 'lucide-react';
// src/pages/Profile.jsx 顶部
import { PayPalButtons } from "@paypal/react-paypal-js";

export default function Profile() {
    // --- 修复：核心锁定义 ---
    const isFetching = useRef(false);
    const isFirstRun = useRef(true);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // --- Stats State ---
    const [stats, setStats] = useState({
        totalItems: 0, netValue: 0, lentOut: 0, issueCount: 0, lossValue: 0, overdueCount: 0
    });

    // --- UI State ---
    const [activeSetting, setActiveSetting] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [linkedProviders, setLinkedProviders] = useState([]);

    // --- Modals State ---
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showDamageModal, setShowDamageModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // --- Form Data ---
    const [formData, setFormData] = useState({
        displayName: '', gender: '', address: '', avatarUrl: '',
        darkMode: false, doNotDisturb: false, aiEnabled: true, isPro: false
    });

    const [abnormalItems, setAbnormalItems] = useState([]);

    // --- Camera State ---
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);

    // --- 新增：Auto-Categorize 状态 ---
    const [autoCategorize, setAutoCategorize] = useState(true);

    // 页面加载时读取设置
    useEffect(() => {
        const savedSetting = localStorage.getItem('pref_auto_categorize');
        // Default to true
        const initialVal = savedSetting !== 'false'; // 'true' or null => true
        setAutoCategorize(initialVal);
        setFormData(prev => ({ ...prev, aiEnabled: initialVal }));
    }, []);

    // 🟢 Enforce Auto-Categorize = TRUE for Pro Users (Requested Feature)
    useEffect(() => {
        if (formData.isPro && !autoCategorize) {
            setAutoCategorize(true);
            setFormData(prev => ({ ...prev, aiEnabled: true }));
            localStorage.setItem('pref_auto_categorize', true);
        }
    }, [formData.isPro, autoCategorize]);

    // 切换开关的处理函数
    const handleToggleAutoCat = (e) => {
        if (e) e.stopPropagation(); // prevent closing menu if any

        // 🛑 Locked for Pro Members
        if (formData.isPro) {
            alert("Auto-Categorization is permanently enabled for Pro members!");
            return;
        }

        setAutoCategorize(prev => {
            const newValue = !prev;
            localStorage.setItem('pref_auto_categorize', newValue);
            setFormData(f => ({ ...f, aiEnabled: newValue }));
            return newValue;
        });
    };

    // ...existing code...

    // --- 整合后的唯一 fetchProfileData 函数 ---
    const fetchProfileData = async () => {
        // 🟢 1. 防抖锁检查
        if (isFetching.current) return;
        isFetching.current = true;

        try {
            setLoading(true);

            // 1. Fetch fresh user data from server
            const userRes = await api.get('/auth/me');
            const userData = userRes.data?.user;

            if (userData) {
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));

                // Load form data
                const localTheme = localStorage.getItem('app_theme');
                const isDark = localTheme === 'dark';

                setFormData({
                    displayName: userData.name || userData.full_name || '',
                    gender: userData.gender || 'Not Specified',
                    address: userData.address || '',
                    avatarUrl: userData.avatar_url || '',
                    darkMode: isDark,
                    doNotDisturb: false,
                    // aiEnabled: true, // Remove hardcoded true, let useEffect handle it or keep default if loading
                    isPro: userData.pro_expiry && new Date(userData.pro_expiry) > new Date(),
                    expiryDate: userData.pro_expiry
                });

                // Set linked providers
                const providers = [];
                if (userData.google_id) providers.push('google');
                if (userData.microsoft_id) providers.push('microsoft');
                setLinkedProviders(providers);

                toggleDarkMode(isDark);
            }

            // 2. Fetch items stats
            const itemsRes = await api.get('/items');
            const items = itemsRes.data?.items || [];

            if (items) {
                const totalItems = items.length;
                const lentItems = items.filter(i => i.status === 'lent');
                const now = new Date();

                const overdueItems = lentItems.filter(item => item.due_date && new Date(item.due_date) < now);
                const badItems = items.filter(i => i.status === 'damaged' || i.status === 'lost');

                let net = 0, loss = 0;
                items.forEach(i => {
                    const p = Number(i.price) || 0;
                    (i.status === 'damaged' || i.status === 'lost') ? loss += p : net += p;
                });

                setStats({
                    totalItems, netValue: net, lentOut: lentItems.length,
                    issueCount: badItems.length, lossValue: loss, overdueCount: overdueItems.length
                });
                setAbnormalItems(badItems);

                // Generate notifications
                const notifs = [];

                // Item status notifications
                if (overdueItems.length > 0) {
                    notifs.push({ id: 'overdue', type: 'alert', title: 'Items Overdue', message: `You have ${overdueItems.length} items past due date.` });
                }
                if (badItems.length > 0) {
                    notifs.push({ id: 'damage', type: 'alert', title: 'Asset Loss Alert', message: `${badItems.length} items reported damaged or lost.` });
                }

                setNotifications(notifs);
            }
        } catch (error) {
            // Ignore AbortError
            if (error.name !== 'AbortError') {
                console.error('Fetch Profile Data Error:', error);
            }
        } finally {
            setLoading(false);
            // 🟢 2. 释放锁
            isFetching.current = false;
        }
    };

    // --- 3. 整合后的生命周期监听 ---
    useEffect(() => {
        fetchProfileData();

        // Check for OAuth success redirect
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth') === 'success') {
            alert('Account linked successfully!');
            // Clean up URL
            window.history.replaceState({}, document.title, "/profile");
        }
    }, []);

    // 🟢 修复：深色模式逻辑 (同步到 LocalStorage 以便全局生效)
    const toggleDarkMode = (isDark) => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            document.body.style.backgroundColor = '#0f172a'; // slate-950
            document.body.style.color = '#f8f9fa';
            localStorage.setItem('app_theme', 'dark'); // 💾 保存到本地
        } else {
            root.classList.remove('dark');
            document.body.style.backgroundColor = '#F8F9FB';
            document.body.style.color = '';
            localStorage.setItem('app_theme', 'light'); // 💾 保存到本地
        }
        setFormData(prev => ({ ...prev, darkMode: isDark }));
    };


    // --- Handlers ---
    // --- Helper: Upload Base64 Avatar ---
    const uploadAvatarBase64 = async (base64Image) => {
        setAvatarUploading(true);
        try {
            const res = await api.post('/auth/avatar', { avatar: base64Image });
            if (res.success) {
                const updatedUser = res.data.user || { ...user, avatar_url: base64Image };
                setUser(updatedUser);
                setFormData(prev => ({ ...prev, avatarUrl: updatedUser.avatar_url }));
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
                alert('Avatar updated successfully!');

                // Close all modals
                setShowPhotoOptions(false);
                setShowCamera(false);
                // Don't close Edit Modal, user might want to edit name etc.
            }
        } catch (error) {
            console.error("Avatar upload failed:", error);
            alert('Failed to upload avatar: ' + (error.response?.data?.message || error.message));
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validations
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit check before compression
            alert('File size too large. Please choose an image under 5MB.');
            return;
        }

        try {
            const base64Image = await compressImage(file);
            await uploadAvatarBase64(base64Image);
        } catch (error) {
            alert("Compression failed: " + error.message);
        } finally {
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // --- Camera Functions ---
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' } // Use front camera
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            alert("Camera permission denied or not available. Please allow camera access.");
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    // Trigger start camera when modal opens
    useEffect(() => {
        if (showCamera) {
            startCamera();
        } else {
            stopCamera();
        }
        // Cleanup on unmount
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [showCamera]);

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = videoRef.current.videoWidth;
        let height = videoRef.current.videoHeight;

        if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Mirror if front camera? Usually helpful but let's keep it simple.
        ctx.scale(-1, 1); // Flip horizontally for mirror effect if needed, but 'facingMode: user' usually needs it.
        ctx.drawImage(videoRef.current, -width, 0, width, height);

        const image = canvas.toDataURL('image/jpeg', 0.7);
        uploadAvatarBase64(image);
    };

    // Helper to compress image
    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800; // Limit width to 800px
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleProUpgrade = async () => {
        setIsProcessingPayment(true);

        // 🟢 1. 计算过期时间 (当前时间 + 30天)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        const expiryString = expiryDate.toISOString();

        try {
            // 🟢 2. Store Pro status in localStorage (backend integration pending)
            localStorage.setItem('pro_status', JSON.stringify({ isPro: true, expiryDate: expiryString }));

            // 更新本地状态
            setFormData(prev => ({ ...prev, isPro: true, expiryDate: expiryString }));
            setShowPaymentModal(false);
            alert(`Payment Successful! Pro valid until ${expiryDate.toLocaleDateString()}.`);
        } catch (e) {
            alert(e.message);
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            // 1. Call Backend to update profile
            const res = await api.updateProfile({
                full_name: formData.displayName,
                email: user?.email // Maintain email if needed or let controller handle
            });

            if (res.success) {
                const updatedUser = res.data.user;

                // 2. Update Local State and Storage
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Keep local UI state in sync
                setFormData(prev => ({
                    ...prev,
                    displayName: updatedUser.full_name || '',
                    avatarUrl: updatedUser.avatar_url || ''
                }));

                setIsEditOpen(false);
                alert("Profile updated successfully!");
            }
        } catch (error) {
            console.error("Profile update error:", error);
            alert("Failed to save changes: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLink = (provider) => {
        // 1. Get the JWT token to identify the current user
        const token = localStorage.getItem('token');

        if (!token) {
            alert("You must be logged in to link an account.");
            return;
        }

        // 2. Map the provider name to the correct Backend Route
        // The frontend might pass 'azure', but the backend route is likely '/auth/microsoft'
        let backendProviderRoute = provider;
        if (provider === 'azure' || provider === 'microsoft') {
            backendProviderRoute = 'microsoft';
        }

        // 3. Construct the ABSOLUTE URL to the Backend (Port 5002)
        // We attach the token so the backend knows who to link this account to
        const backendUrl = `${API_BASE_URL}/auth/${backendProviderRoute}?token=${token}`;

        console.log("Redirecting to Backend:", backendUrl); // For debugging

        // 4. Force browser redirect
        window.location.href = backendUrl;
    };

    const handleUnlink = async (providerName) => {
        if (!confirm(`Are you sure you want to disconnect ${providerName}?`)) return;
        try {
            const res = await api.post(`/auth/unlink/${providerName}`);
            if (res.success) {
                alert(`${providerName} unlinked successfully.`);
                fetchProfileData(); // Refresh user data
            }
        } catch (error) {
            alert("Unlink failed: " + error.message);
        }
    };

    const handleSignOut = async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };
    // src/pages/Profile.jsx

    const handleExportCSV = async () => {
        try {
            // Fetch items from backend API
            const res = await api.get('/items');
            const data = res.data?.items || [];

            if (!data || data.length === 0) {
                alert("No items to export.");
                return;
            }

            const headers = ['Name', 'Category', 'Location', 'Status', 'Price', 'Borrower', 'Date Added'];
            // 处理数据，处理可能为空的 location
            const rows = data.map(item => [
                `"${item.name.replace(/"/g, '""')}"`, // 防止名字里有逗号破坏格式
                item.category || '',
                item.location?.name || item.Location?.name || 'Unknown',
                item.status,
                item.price,
                item.borrower || '',
                new Date(item.created_at).toLocaleDateString()
            ]);

            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

            // 创建下载链接
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error(e); // 打印错误方便调试
            alert("Export failed: " + e.message);
        }
    };
    const formatCurrency = (num) => num >= 1000 ? '$' + (num / 1000).toFixed(1) + 'k' : '$' + num;

    // --- SUB-VIEWS COMPONENTS (Notifications, Security, AI) ---
    // 🟢 重点：这里添加了 onClick={() => setActiveSetting(null)} 让你能退出去



    // --- MAIN RENDER ---
    return (
        <div className={`min-h-screen bg-[#F8F9FB] dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-300 ${formData.darkMode ? 'dark' : ''} ${activeSetting ? 'overflow-hidden h-screen' : 'pb-28 p-6'}`}>
            {loading ? <div className="p-6 text-center text-slate-400 dark:text-slate-500">Loading...</div> : (
                <>
                    {/* Main Profile View (visually hidden if sub-view active) */}
                    <div className={`transition-opacity duration-300 ${activeSetting ? 'hidden' : 'block'}`}>

                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Profile</h1>
                            <button onClick={() => setIsEditOpen(true)} className="text-slate-400 dark:text-slate-500 hover:text-primary p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm active:scale-95 transition-transform"><Edit2 size={20} /></button>
                        </div>

                        {/* User Card */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4 border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden relative bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300">
                                    {formData.avatarUrl ? <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : (formData.displayName ? formData.displayName[0].toUpperCase() : user?.email?.[0].toUpperCase())}
                                </div>
                                <div className="absolute bottom-4 right-0 bg-green-400 p-1.5 rounded-full border-4 border-[#F8F9FB] dark:border-slate-950"><Sparkles size={12} className="text-white" fill="currentColor" /></div>
                            </div>
                            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{formData.displayName || user?.email?.split('@')[0]}</h2>
                            <p className="text-sm text-slate-400 dark:text-slate-500 font-bold mt-1">Member since {user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear()}</p>
                            <div className="mt-3">
                                {formData.isPro ? (
                                    <div className="flex flex-col items-center">
                                        <div className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Pro Plan
                                        </div>
                                        {/* 🟢 显示过期日期 */}
                                        {formData.expiryDate && (
                                            <span className="text-[10px] text-slate-400 mt-1 font-medium">
                                                Expires: {new Date(formData.expiryDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div onClick={() => setShowPaymentModal(true)} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">Free Plan (Upgrade)</div>
                                )}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <div onClick={() => navigate('/search')} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center relative overflow-hidden cursor-pointer active:scale-95 transition-transform">
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-xl text-blue-500 dark:text-blue-400 mb-2"><Box size={22} /></div>
                                <div className="text-xl font-extrabold text-slate-800 dark:text-white">{stats.totalItems}</div>
                                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">Total Items</div>
                                {stats.issueCount > 0 && <div className="absolute bottom-0 left-0 right-0 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-[8px] font-extrabold py-0.5 animate-pulse">{stats.issueCount} Issue</div>}
                            </div>
                            <div onClick={() => stats.lossValue > 0 && setShowDamageModal(true)} className={`bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center relative overflow-hidden ${stats.lossValue > 0 ? 'cursor-pointer active:scale-95' : ''}`}>
                                <div className="bg-green-50 dark:bg-green-900/30 p-2.5 rounded-xl text-green-500 dark:text-green-400 mb-2"><DollarSign size={22} /></div>
                                <div className="text-xl font-extrabold text-slate-800 dark:text-white">{formatCurrency(stats.netValue)}</div>
                                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">Net Value</div>
                                {stats.lossValue > 0 && <div className="absolute bottom-0 left-0 right-0 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-[8px] font-extrabold py-0.5 animate-pulse">Loss: -{formatCurrency(stats.lossValue)}</div>}
                            </div>
                            <div onClick={() => navigate('/lending')} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center relative overflow-hidden cursor-pointer active:scale-95 transition-transform">
                                <div className={`p-2.5 rounded-xl mb-2 ${stats.overdueCount > 0 ? 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-400'}`}><TrendingUp size={22} /></div>
                                <div className={`text-xl font-extrabold ${stats.overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>{stats.lentOut}</div>
                                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">Lent Out</div>
                                {stats.overdueCount > 0 && <div className="absolute bottom-0 left-0 right-0 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-[8px] font-extrabold py-0.5 animate-pulse">{stats.overdueCount} Overdue!</div>}
                            </div>
                        </div>

                        {/* Settings List */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">General Settings</h3>
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                <div onClick={() => setActiveSetting('security')} className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <div className="flex items-center gap-3"><div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-xl text-slate-600 dark:text-slate-300"><Shield size={18} /></div><span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Account Security</span></div>
                                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                                </div>
                                <div onClick={() => setActiveSetting('notifications')} className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-xl text-slate-600 dark:text-slate-300 relative">
                                            <Bell size={18} />
                                            {!formData.doNotDisturb && notifications.length > 0 && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></div>}
                                        </div>
                                        <div className="flex flex-col"><span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Notifications</span><span className="text-[10px] text-slate-400 dark:text-slate-500">{formData.doNotDisturb ? 'Do Not Disturb ON' : 'On'}</span></div>
                                    </div>
                                    <div className="flex items-center gap-2">{!formData.doNotDisturb && notifications.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{notifications.length}</span>}<ChevronRight size={16} className="text-slate-300 dark:text-slate-600" /></div>
                                </div>
                                <div onClick={() => setActiveSetting('ai')} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <div className="flex items-center gap-3"><div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-xl text-slate-600 dark:text-slate-300"><Sparkles size={18} /></div><div><span className="font-bold text-slate-700 dark:text-slate-200 text-sm block">AI Analysis</span><span className={`text-[10px] font-medium ${formData.aiEnabled ? 'text-green-500' : 'text-slate-400'}`}>{formData.aiEnabled ? 'Active' : 'Off'}</span></div></div>
                                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleExportCSV} className="w-full bg-white dark:bg-slate-800 border border-green-500 text-green-600 dark:text-green-400 py-4 rounded-2xl font-bold shadow-sm mb-6 flex items-center justify-center gap-2 active:bg-green-50 dark:active:bg-green-900/20 transition-colors"><Download size={20} /> Export Data to CSV</button>
                        <button onClick={handleSignOut} className="w-full text-red-500 text-sm font-bold py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">Log Out</button>
                    </div>

                    {/* 🟢 FULL SCREEN SUB-VIEW OVERLAY (Fixed z-[60] covers nav bar & everything) */}
                    {activeSetting && (
                        <div className="fixed inset-0 z-[60] bg-[#F8F9FB] dark:bg-slate-950 overflow-y-auto animate-in slide-in-from-right duration-300">
                            <div className="p-6 pb-28">
                                {activeSetting === 'notifications' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <button onClick={() => setActiveSetting(null)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                                <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                                            </button>
                                            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Notifications</h2>
                                        </div>
                                        {formData.doNotDisturb && (
                                            <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 p-4 rounded-2xl flex items-center gap-3 border border-purple-100 dark:border-purple-800">
                                                <BellOff size={20} />
                                                <div><div className="font-bold text-sm">Do Not Disturb is ON</div><div className="text-xs opacity-80">You won't receive push alerts.</div></div>
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            {notifications.length === 0 && <div className="text-center text-slate-400 dark:text-slate-500 py-10">No new notifications</div>}
                                            {notifications.map(notif => (
                                                <div key={notif.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'alert' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                                                        {notif.type === 'alert' ? <AlertTriangle size={20} /> : <Info size={20} />}
                                                    </div>
                                                    <div className="flex-1"><h3 className="font-bold text-slate-800 dark:text-white text-sm">{notif.title}</h3><p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {activeSetting === 'security' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <button onClick={() => setActiveSetting(null)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                                <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                                            </button>
                                            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Account Security</h2>
                                        </div>

                                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-2 shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                                            {[
                                                { id: 'google', name: 'Google', icon: <Globe size={18} />, color: 'text-red-500 bg-red-50', providerKey: 'google', status: 'active' },
                                                { id: 'microsoft', name: 'Microsoft', icon: <Box size={18} />, color: 'text-blue-600 bg-blue-50', providerKey: 'microsoft', status: 'active' },
                                                { id: 'apple', name: 'Apple', icon: <Box size={18} />, color: 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700', providerKey: 'apple', status: 'upcoming' },
                                                { id: 'github', name: 'GitHub', icon: <Github size={18} />, color: 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700', providerKey: 'github', status: 'upcoming' },
                                            ].map(p => {
                                                const isLinked = linkedProviders.includes(p.providerKey);
                                                const isUpcoming = p.status === 'upcoming';

                                                return (
                                                    <div key={p.id} className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-700 last:border-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-xl ${p.color}`}>{p.icon}</div>
                                                            <span className="font-bold text-slate-700 dark:text-slate-200">{p.name}</span>
                                                        </div>

                                                        {isUpcoming ? (
                                                            <button disabled className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 cursor-not-allowed">
                                                                Upcoming
                                                            </button>
                                                        ) : isLinked ? (
                                                            <button onClick={() => handleUnlink(p.providerKey)} className="px-4 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:border-green-800 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all group">
                                                                <span className="group-hover:hidden">Connected</span>
                                                                <span className="hidden group-hover:inline">Disconnect</span>
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handleLink(p.providerKey)} className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
                                                                Connect
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl flex items-start gap-3">
                                            <Lock size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-bold text-blue-700 dark:text-blue-300 text-sm">Security Status</h4>
                                                <p className="text-xs text-blue-600/80 dark:text-blue-400 mt-1">You have {linkedProviders.length} login methods connected.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeSetting === 'ai' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <button onClick={() => setActiveSetting(null)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                                <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                                            </button>
                                            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">AI Analysis</h2>
                                        </div>

                                        <div className={`bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 mb-4 ${!formData.isPro ? 'opacity-90' : ''}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-xl text-purple-600 dark:text-purple-400"><Sparkles size={24} /></div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 dark:text-white">Auto-Categorization</h3>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Use AI to tag new items</p>
                                                    </div>
                                                </div>
                                                {formData.isPro ? (
                                                    <button
                                                        onClick={handleToggleAutoCat}
                                                        className="w-14 h-8 rounded-full p-1 transition-colors duration-300 bg-purple-500 opacity-80 cursor-not-allowed"
                                                        title="Permanently enabled for Pro plan"
                                                    >
                                                        <div className="w-6 h-6 bg-white rounded-full shadow-md transform translate-x-6"></div>
                                                    </button>
                                                ) : (
                                                    <button onClick={() => setShowPaymentModal(true)} className="px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:scale-105 transition-transform shadow-lg">
                                                        Upgrade
                                                    </button>
                                                )}
                                            </div>
                                            {!formData.isPro && (
                                                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors" onClick={() => setShowPaymentModal(true)}>
                                                    <Lock size={14} /> AI features are locked. Tap to go Pro.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 🟢 GLOBAL MODALS (Fixed z-[100], on top of everything) */}

            {/* Edit Modal (Centered) */}
            {isEditOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditOpen(false)}></div>
                    <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-3xl p-6 shadow-2xl relative z-20 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Edit Profile</h3><button onClick={() => setIsEditOpen(false)} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20} /></button></div>
                        <div className="space-y-5">
                            <div className="flex justify-center"><div className="relative group cursor-pointer" onClick={() => setShowPhotoOptions(true)}><div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white dark:border-slate-800 shadow-md overflow-hidden bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300">{avatarUploading ? <Loader2 className="animate-spin" /> : (formData.avatarUrl ? <img src={formData.avatarUrl} className="w-full h-full object-cover" /> : (formData.displayName ? formData.displayName[0].toUpperCase() : 'U'))}</div><div className="absolute bottom-0 right-0 bg-slate-800 dark:bg-slate-700 p-2 rounded-full text-white border-2 border-white dark:border-slate-800"><Camera size={14} /></div><input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" /></div></div>
                            <div><label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5 ml-1">Real Name</label><div className="relative"><User className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={18} /><input type="text" className="w-full bg-slate-50 dark:bg-slate-800 pl-11 pr-4 py-3 rounded-xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} placeholder="Your Name" /></div></div>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800"><div className="flex items-center gap-3"><div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-amber-500 shadow-sm"><Sparkles size={18} /></div><span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Pro Membership</span></div><button onClick={() => !formData.isPro && setShowPaymentModal(true)} className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${formData.isPro ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${formData.isPro ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><div className="flex items-center gap-3"><div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm"><Moon size={18} /></div><span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Dark Mode</span></div><button onClick={() => toggleDarkMode(!formData.darkMode)} className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${formData.darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${formData.darkMode ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><div className="flex items-center gap-3"><div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-purple-600 shadow-sm"><BellOff size={18} /></div><span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Do Not Disturb</span></div><button onClick={() => setFormData({ ...formData, doNotDisturb: !formData.doNotDisturb })} className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${formData.doNotDisturb ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-700'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${formData.doNotDisturb ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div>
                            </div>
                            <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-primary-dark active:scale-95 transition-all mt-4 disabled:opacity-70 flex justify-center items-center gap-2">{isSaving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal (Centered) */}
            {/* src/pages/Profile.jsx 中的 Payment Modal 部分 */}



            {showPaymentModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
                    <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-3xl p-8 shadow-2xl relative z-20 animate-in zoom-in-95 duration-200">
                        {/* ... 上面的 Title 和 Price 不变 ... */}

                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-6 border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-600 dark:text-slate-300 font-bold">Total</span>
                                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">$9.99<span className="text-sm text-slate-400 dark:text-slate-500">/mo</span></span>
                            </div>
                        </div>

                        {/* src/pages/Profile.jsx -> Payment Modal 内部 */}

                        {/* 🟢 替换原来的 PayPal 按钮区域 */}
                        <div className="w-full relative z-10 min-h-[150px] flex justify-center mt-4">
                            {/* ⚠️ Provider 移到了最外层，这里只留 Buttons */}
                            <PayPalButtons
                                className="w-full"
                                style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                                createOrder={(data, actions) => {
                                    return actions.order.create({
                                        purchase_units: [{
                                            amount: { value: "9.99" },
                                            description: "Pro Membership Subscription"
                                        }]
                                    });
                                }}
                                onApprove={async (data, actions) => {
                                    try {
                                        const order = await actions.order.capture();
                                        console.log("Payment Successful:", order);

                                        // Call backend to upgrade
                                        const res = await api.post('/auth/upgrade');
                                        if (res.success) {
                                            const newExpiry = res.data.pro_expiry;

                                            // Update local storage
                                            const userStr = localStorage.getItem('user');
                                            const userData = userStr ? JSON.parse(userStr) : {};
                                            userData.pro_expiry = newExpiry;
                                            localStorage.setItem('user', JSON.stringify(userData));

                                            // Update state
                                            setFormData(prev => ({
                                                ...prev,
                                                isPro: true,
                                                expiryDate: newExpiry
                                            }));

                                            setShowPaymentModal(false);
                                            alert(`Payment Successful! Pro valid until ${new Date(newExpiry).toLocaleDateString()}.`);
                                        }
                                    } catch (err) {
                                        console.error("Capture Error:", err);
                                        alert("Payment capture failed: " + err.message);
                                    }
                                }}
                                onError={(err) => {
                                    console.error("PayPal Load Error:", err);
                                    // 这里不弹窗打扰用户，通常是网络问题或配置问题
                                }}
                            />
                        </div>

                        <button onClick={() => setShowPaymentModal(false)} className="mt-4 w-full text-slate-400 dark:text-slate-500 text-xs font-bold hover:text-slate-600">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            {/* Damage Modal (Centered) */}
            {showDamageModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDamageModal(false)}></div>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-extrabold text-red-600 flex items-center gap-2"><AlertTriangle size={24} /> Loss Report</h3><button onClick={() => setShowDamageModal(false)} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20} /></button></div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl mb-4 text-center"><div className="text-xs text-red-400 font-bold uppercase">Total Financial Loss</div><div className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1">-{formatCurrency(stats.lossValue)}</div></div>
                        <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar pr-2">{abnormalItems.map(item => (<div key={item.id} className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-xl"><div><div className="font-bold text-slate-800 dark:text-white">{item.name}</div><div className="text-xs text-slate-400">{item.locations?.name || 'Unknown'}</div></div><div className="text-right"><span className={`text-[10px] px-2 py-1 rounded-full font-extrabold uppercase ${item.status === 'lost' ? 'bg-slate-800 text-white' : 'bg-red-100 text-red-600'}`}>{item.status}</span><div className="text-xs font-bold text-red-500 mt-1">-{formatCurrency(item.price || 0)}</div></div></div>))}</div>
                    </div>
                </div>
            )}

            {/* Photo Selection Modal */}
            {showPhotoOptions && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPhotoOptions(false)}></div>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-3xl p-6 shadow-2xl relative z-20 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">Change Profile Photo</h3>
                        <div className="space-y-3">
                            <button onClick={() => { setShowPhotoOptions(false); setShowCamera(true); }} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                                <Camera size={20} /> Take Photo
                            </button>
                            <button onClick={() => { setShowPhotoOptions(false); fileInputRef.current?.click(); }} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                <ImageIcon size={20} /> Upload from Gallery
                            </button>
                            <button onClick={() => setShowPhotoOptions(false)} className="w-full text-slate-400 dark:text-slate-500 py-2 text-sm font-bold">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
                    <div className="relative w-full h-full flex flex-col">
                        <video ref={videoRef} autoPlay playsInline muted className="flex-1 w-full h-full object-cover" />

                        {/* Top Close Button */}
                        <button onClick={() => setShowCamera(false)} className="absolute top-8 right-6 p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors z-[10000]">
                            <X size={28} />
                        </button>

                        {/* Camera Controls Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 pb-32 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center">
                            {/* Empty Left Spacer since Close is now at top */}

                            <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-slate-200 shadow-lg active:scale-95 transition-transform flex items-center justify-center">
                                <div className="w-16 h-16 bg-white rounded-full border-2 border-slate-900"></div>
                            </button>

                            {/* Empty Right Spacer */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
