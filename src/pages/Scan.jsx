import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Camera, X, RefreshCw, Zap, Image as ImageIcon, CheckCircle2, AlertTriangle, Loader2, Plus, Box, ChevronDown } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react'; // Keep this if used, or switch to react-qr-code if consistent. But QRCodeCanvas is fine.

// AI Analysis using backend Gemini integration (Model: gemini-1.5-flash-latest)
const analyzeImageWithAI = async (base64Image) => {
    try {
        const res = await api.post('/ai/analyze', { image: base64Image });
        if (res.success) {
            return res.data;
        } else {
            throw new Error(res.message || 'AI Analysis failed');
        }
    } catch (error) {
        console.error("Gemini AI Scan Error:", error);
        throw error;
    }
};

export default function ScanPage() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [locations, setLocations] = useState([]);
    const [subLocations, setSubLocations] = useState([]);

    // Form State
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [parentLocationId, setParentLocationId] = useState('');
    const [subLocationId, setSubLocationId] = useState('');
    const [newSubLocationName, setNewSubLocationName] = useState('');
    const [newRoomName, setNewRoomName] = useState(''); // State for creating new room
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');

    // Pro / AI State
    const [isPro, setIsPro] = useState(false);
    const [aiMode, setAiMode] = useState(false);

    useEffect(() => {
        fetchLocations();
        checkUserStatus();
        startCamera();
        return () => stopCamera();
    }, []);

    async function checkUserStatus() {
        try {
            const res = await api.get('/auth/me');
            const user = res.user;
            const expiry = user.pro_expiry ? new Date(user.pro_expiry) : null;
            const now = new Date();
            setIsPro(expiry && expiry > now);
        } catch (e) {
            console.error("Auth check failed", e);
        }
    }

    async function fetchLocations() {
        try {
            const res = await api.get('/locations?parent_id=null');
            setLocations(res.locations || []);
        } catch (e) {
            console.error("Fetch locations error", e);
        }
    }

    async function fetchSubLocations(parentId) {
        if (!parentId) {
            setSubLocations([]);
            return;
        }
        try {
            const res = await api.get(`/locations?parent_id=${parentId}`);
            setSubLocations(res.locations || []);
        } catch (e) {
            console.error("Fetch sub-locations error", e);
        }
    }

    const handleParentLocationChange = (e) => {
        const id = e.target.value;
        setParentLocationId(id);
        setSubLocationId('');
        setNewSubLocationName('');

        // Don't fetch sublocations if user is creating a new room
        if (id !== 'new') {
            fetchSubLocations(id);
        } else {
            setSubLocations([]); // Clear sublocations when creating new room
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            // alert("Camera permission denied or not available.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;

        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions (max width 800px to reduce payload size)
        let width = videoRef.current.videoWidth;
        let height = videoRef.current.videoHeight;
        const MAX_WIDTH = 800;

        if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx.drawImage(videoRef.current, 0, 0, width, height);

        // Convert to base64 with reduced quality (0.8)
        const image = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(image);
        stopCamera();

        if (aiMode) {
            handleAIAnalysis(image);
        } else {
            setShowForm(true);
        }
    };

    const handleAIAnalysis = async (imageData) => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeImageWithAI(imageData); // Mock or Backend Call
            setName(result.name);
            setCategory(result.category);
            setPrice(result.price);
            setDescription(result.description);
            setShowForm(true);
        } catch (error) {
            alert("AI Analysis failed. Switching to manual.");
            setShowForm(true);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name || !parentLocationId) {
            alert("Name and Room are required.");
            return;
        }

        let actualParentLocationId = parentLocationId;
        let finalLocationId = subLocationId;

        // Handle new room creation
        if (parentLocationId === 'new') {
            if (!newRoomName) {
                alert("Please provide a name for the new room.");
                return;
            }
            try {
                // Omit parent_id for root locations to avoid validation issues
                const res = await api.post('/locations', {
                    name: newRoomName
                });
                actualParentLocationId = res.location.id;
                finalLocationId = actualParentLocationId; // Item goes directly in the new room
            } catch (error) {
                alert("Failed to create room: " + error.message);
                return;
            }
        }

        // If subLocationId is empty, it means "No subspace (direct in room)"
        if (!finalLocationId) {
            finalLocationId = actualParentLocationId;
        }

        // Handle new subspace creation
        if (subLocationId === 'new') {
            if (!newSubLocationName) {
                alert("Please provide a name for the new subspace.");
                return;
            }
            try {
                const res = await api.post('/locations', {
                    name: newSubLocationName,
                    parent_id: actualParentLocationId // Use the actual parent (could be newly created)
                });
                finalLocationId = res.location.id;
            } catch (error) {
                alert("Failed to create subspace: " + error.message);
                return;
            }
        }

        try {
            const res = await api.post('/items', {
                name,
                category,
                location_id: finalLocationId,
                price: parseFloat(price) || 0,
                description,
                photo_url: capturedImage, // Note: Sending Base64 to backend? Backend should handle it or upload to S3/Cloudinary. 
                // For now, we assume backend stores it or we send null. 
                // Sending large Base64 strings to DB is bad practice but for 'mvp' it works if payload limit allows.
                // We'll keep it for now.
            });

            if (res.success) {
                navigate(`/item/${res.item.id}`);
            }
        } catch (error) {
            alert("Save failed: " + error.message);
        }
    };

    const resetScan = () => {
        setCapturedImage(null);
        setShowForm(false);
        setName('');
        setCategory('');
        setPrice('');
        setParentLocationId('');
        setSubLocationId('');
        setNewSubLocationName('');
        startCamera();
    };

    return (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col">

            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
                <button onClick={() => navigate(-1)} className="p-2 bg-white/20 backdrop-blur-md rounded-full"><X size={20} /></button>
                <div className="flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-full">
                    <button onClick={() => setAiMode(false)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!aiMode ? 'bg-white text-black shadow-lg' : 'text-white/70'}`}>Manual</button>
                    <button
                        onClick={() => {
                            if (isPro) {
                                setAiMode(true);
                            } else {
                                alert("AI Scan is a Pro feature. Please upgrade in Profile.");
                            }
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${aiMode
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                            : isPro ? 'text-white/70' : 'text-white/40 cursor-not-allowed'
                            }`}
                    >
                        <Zap size={12} fill="currentColor" />
                        {isPro ? 'AI Scan' : 'AI Scan (Pro)'}
                    </button>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Camera View */}
            {!capturedImage ? (
                <div className="flex-1 relative overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

                    {/* Overlay UI */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl -mb-1 -mr-1"></div>
                        </div>
                        <p className="mt-8 text-white/80 font-medium text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                            Point at item to scan
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-0 w-full p-8 pb-12 flex justify-center bg-gradient-to-t from-black/90 to-transparent">
                        <button
                            onClick={capturePhoto}
                            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <div className="w-16 h-16 bg-white rounded-full"></div>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col bg-[#F8F9FB] text-slate-900 overflow-y-auto">
                    {/* Image Preview */}
                    <div className="h-64 relative shrink-0">
                        <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                        <button onClick={resetScan} className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md font-bold text-xs flex items-center gap-1">
                            <RefreshCw size={14} /> Retake
                        </button>
                    </div>

                    {/* Analysis Loading */}
                    {isAnalyzing ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                                <div className="w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" size={24} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Analyzing with Gemini...</h3>
                                <p className="text-slate-500 text-sm mt-1">Identifying features & details</p>
                            </div>
                        </div>
                    ) : (
                        /* Form */
                        <div className="flex-1 p-6 space-y-6 bg-white rounded-t-3xl -mt-6 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-500">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2"></div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Item Name</label>
                                    <input autoFocus type="text" placeholder="What is this item?" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-lg text-slate-800 outline-none focus:ring-2 focus:ring-primary" value={name} onChange={e => setName(e.target.value)} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Category</label>
                                        <input type="text" placeholder="e.g. Electronics" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary" value={category} onChange={e => setCategory(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Value ($)</label>
                                        <input type="number" placeholder="0.00" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary" value={price} onChange={e => setPrice(e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Room</label>
                                        <div className="relative">
                                            <select
                                                className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary appearance-none"
                                                value={parentLocationId}
                                                onChange={handleParentLocationChange}
                                            >
                                                <option value="">Select a room...</option>
                                                {locations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                ))}
                                                <option value="new">+ Create new room</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={20} />
                                        </div>
                                    </div>

                                    {/* New Room Name Input */}
                                    {parentLocationId === 'new' && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">New Room Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Living Room, Bedroom, Kitchen"
                                                className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={newRoomName}
                                                onChange={e => setNewRoomName(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Subspace</label>
                                        <div className="relative">
                                            <select
                                                disabled={!parentLocationId}
                                                className={`w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary appearance-none ${!parentLocationId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                value={subLocationId}
                                                onChange={e => setSubLocationId(e.target.value)}
                                            >
                                                <option value="">No subspace (Directly in room)</option>
                                                {subLocations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                ))}
                                                <option value="new">+ Create new subspace</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={20} />
                                        </div>
                                    </div>
                                </div>

                                {subLocationId === 'new' && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">New Subspace Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Desk, Closet, Shelf"
                                            className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={newSubLocationName}
                                            onChange={e => setNewSubLocationName(e.target.value)}
                                        />
                                    </div>
                                )}

                                <button onClick={handleSave} className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 active:scale-95 transition-all mt-4">
                                    Save to Inventory
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}