import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ArrowLeft, MapPin, Tag, DollarSign, Calendar,
  Trash2, Edit2, Save, X, Loader2, Box, QrCode, ChevronDown, Plus, Check
} from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // 编辑表单数据
  const [formData, setFormData] = useState({});
  const [locations, setLocations] = useState([]);
  const [subLocations, setSubLocations] = useState([]);
  const [parentLocationId, setParentLocationId] = useState('');
  const [subLocationId, setSubLocationId] = useState('');

  // Creation State
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreatingSubspace, setIsCreatingSubspace] = useState(false);
  const [newSubspaceName, setNewSubspaceName] = useState('');

  useEffect(() => {
    fetchItemDetails();
    fetchRooms();
  }, [id]);

  async function fetchItemDetails() {
    try {
      setLoading(true);
      const response = await api.get(`/items/${id}`);
      if (response.data && response.data.item) {
        const itemData = response.data.item;
        if (itemData) {
          // console.log('Item details fetched:', itemData);
          // console.log('Location data:', itemData.location);
          // if (itemData.location?.parent) {
          //   console.log('Parent location:', itemData.location.parent);
          // }
        }
        setItem(itemData);
        setFormData(itemData);

        // Initial location state
        if (itemData.location?.parent_id) {
          setParentLocationId(itemData.location.parent_id);
          setSubLocationId(itemData.location_id);
          fetchSubLocations(itemData.location.parent_id);
        } else {
          setParentLocationId(itemData.location_id);
          setSubLocationId('');
        }
      } else {
        throw new Error('Item data not found');
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRooms() {
    try {
      const res = await api.get('/locations?parent_id=null');
      setLocations(res.data.locations || []);
    } catch (e) {
      console.error("Fetch rooms error", e);
    }
  }

  async function fetchSubLocations(parentId) {
    if (!parentId) {
      setSubLocations([]);
      return;
    }
    try {
      const res = await api.get(`/locations?parent_id=${parentId}`);
      setSubLocations(res.data.locations || []);
    } catch (e) {
      console.error("Fetch sub-locations error", e);
    }
  }

  const handleParentLocationChange = (e) => {
    const pid = e.target.value;
    if (pid === 'NEW_ROOM') {
      setIsCreatingRoom(true);
      setParentLocationId('');
      setSubLocationId('');
      setSubLocations([]);
    } else {
      setIsCreatingRoom(false);
      setParentLocationId(pid);
      setSubLocationId('');
      fetchSubLocations(pid);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/locations', { name: newRoomName });
      const newRoom = res.data.location;
      setLocations([...locations, newRoom]);
      setParentLocationId(newRoom.id);
      setIsCreatingRoom(false);
      setNewRoomName('');
    } catch (e) {
      alert('Failed to create room: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubLocationChange = (e) => {
    const sid = e.target.value;
    if (sid === 'NEW_SUBSPACE') {
      setIsCreatingSubspace(true);
      setSubLocationId('');
    } else {
      setIsCreatingSubspace(false);
      setSubLocationId(sid);
    }
  };

  const handleCreateSubspace = async () => {
    if (!newSubspaceName.trim() || !parentLocationId) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/locations', {
        name: newSubspaceName,
        parent_id: parentLocationId
      });
      const newSubspace = res.data.location;
      setSubLocations([...subLocations, newSubspace]);
      setSubLocationId(newSubspace.id);
      setIsCreatingSubspace(false);
      setNewSubspaceName('');
    } catch (e) {
      alert('Failed to create subspace: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  async function handleUpdate() {
    setIsProcessing(true);
    try {
      // Use subLocationId if selecting, otherwise parentLocationId (room)
      const finalLocationId = subLocationId || parentLocationId;

      if (!finalLocationId) {
        alert('Please select a location');
        setIsProcessing(false);
        return;
      }

      await api.put(`/items/${id}`, {
        name: formData.name,
        category: formData.category,
        price: formData.price,
        status: formData.status,
        description: formData.description,
        location_id: finalLocationId
      });

      // Refresh data and exit edit mode
      setIsEditing(false);
      fetchItemDetails();

    } catch (error) {
      alert('Update failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  const downloadQrCode = () => {
    const canvas = document.getElementById('item-qr-code');
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `asset-tag-${item.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this item?')) return;
    setIsProcessing(true);
    try {
      await api.delete(`/items/${id}`);
      navigate('/');
    } catch (error) {
      alert('Delete failed: ' + error.message);
      setIsProcessing(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] dark:bg-slate-950">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  if (!item) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 p-6 flex flex-col">

      {/* Header with Close Key */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Item Details</h1>
        </div>

        <div className="flex gap-3">
          {isEditing && (
            <button
              onClick={handleUpdate}
              disabled={isProcessing}
              className="p-3 bg-primary text-white rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            </button>
          )}
          <button onClick={() => setShowQrModal(true)} className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <QrCode size={24} />
          </button>
          <button onClick={() => navigate('/')} className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex-1 flex flex-col">

        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6 mx-auto shadow-sm">
          <Box size={40} />
        </div>

        {isEditing ? (
          // --- 编辑模式 ---
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Name</label>
              <input
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Category</label>
                <input
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                  value={formData.category || ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Tools"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Price</label>
                <input
                  type="number"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                  value={formData.price || ''}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Room</label>
                {isCreatingRoom ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      className="w-[60%] p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                      placeholder="New Room Name"
                      value={newRoomName}
                      onChange={e => setNewRoomName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCreateRoom();
                        if (e.key === 'Escape') setIsCreatingRoom(false);
                      }}
                    />
                    <button onClick={handleCreateRoom} disabled={!newRoomName.trim() || isProcessing} className="p-3 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-50">
                      <Check size={20} />
                    </button>
                    <button onClick={() => setIsCreatingRoom(false)} className="p-3 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center">
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary appearance-none"
                      value={parentLocationId}
                      onChange={handleParentLocationChange}
                    >
                      <option value="" disabled>Select Room...</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                      <option value="NEW_ROOM" className="font-bold text-primary">+ Create New Room</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={20} />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Subspace</label>
                {isCreatingSubspace ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      className="w-[60%] p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                      placeholder="New Subspace Name"
                      value={newSubspaceName}
                      onChange={e => setNewSubspaceName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCreateSubspace();
                        if (e.key === 'Escape') setIsCreatingSubspace(false);
                      }}
                    />
                    <button onClick={handleCreateSubspace} disabled={!newSubspaceName.trim() || isProcessing} className="p-3 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-50">
                      <Check size={20} />
                    </button>
                    <button onClick={() => setIsCreatingSubspace(false)} className="p-3 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center">
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      disabled={!parentLocationId || isCreatingRoom}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary appearance-none disabled:opacity-50"
                      value={subLocationId}
                      onChange={handleSubLocationChange}
                    >
                      <option value="">No subspace</option>
                      {subLocations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                      <option value="NEW_SUBSPACE" className="font-bold text-primary">+ Create New Subspace</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={20} />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Status</label>
              <select
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary appearance-none"
                value={formData.status || 'available'}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="available">Available</option>
                <option value="lent">Lent Out</option>
                <option value="lost">Lost</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Description</label>
              <textarea
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details about this item..."
              />
            </div>

            <div className="pt-4 flex gap-3 mt-auto">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-2xl">Cancel</button>
              <button onClick={handleUpdate} disabled={isProcessing} className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2">
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Changes
              </button>
            </div>
          </div>
        ) : (
          // --- 展示模式 ---
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">{item.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${item.status === 'lent' ? 'bg-orange-100 text-orange-600' :
                item.status === 'lost' ? 'bg-slate-800 text-white' :
                  item.status === 'damaged' ? 'bg-red-100 text-red-600' :
                    'bg-green-100 text-green-600'
                }`}>
                {/* 🟢 修复 3：展示时将 _ 替换为空格，并大写显示 */}
                {item.status ? item.status.replace('_', ' ').toUpperCase() : 'AVAILABLE'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                  <DollarSign size={14} /> Value
                </div>
                <div className="text-xl font-black text-slate-800 dark:text-white">${item.price || 0}</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                  <Tag size={14} /> Category
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-white truncate">
                  {item.category || 'Uncategorized'}
                </div>
              </div>
            </div>

            <div className="p-5 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
                <MapPin size={14} /> Location
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-300 text-lg">
                {(() => {
                  if (!item.location) return 'Unknown';
                  if (item.location.parent && item.location.parent.name) {
                    return `${item.location.parent.name} / ${item.location.name}`;
                  }
                  return item.location.name || 'Unknown';
                })()}
              </p>
            </div>

            {item.description && (
              <div className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-3xl">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Description</div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-bold text-slate-300 dark:text-slate-600 px-2 mt-auto pb-4">
              <div className="flex items-center gap-1"><Calendar size={12} /> Added {new Date(item.created_at).toLocaleDateString()}</div>
              <div className="font-mono text-[10px] uppercase">ID: {item.id.slice(0, 8)}...</div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
              <button
                onClick={() => handleDelete()}
                className="w-16 h-16 flex-none bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors active:scale-95 border border-red-100 dark:border-red-900/30"
                title="Delete Item"
              >
                <Trash2 size={24} />
              </button>

              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 h-16 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
              >
                <Edit2 size={20} />
                <span>Edit Details</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm" onClick={() => setShowQrModal(false)}>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-xl text-slate-800 dark:text-white">Asset QR Tag</h3>
              <button onClick={() => setShowQrModal(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>

            <div className="bg-white p-6 rounded-[2rem] mb-6 shadow-inner border border-slate-100 flex flex-col items-center">
              <QRCodeCanvas
                id="item-qr-code"
                value={JSON.stringify({ app: 'asset-tracker', id: item.id })}
                size={200}
                level="H"
                includeMargin={true}
              />
              <p className="mt-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest">ID: {item.id}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={downloadQrCode}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                <Save size={18} /> Download Tag
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-bold active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}