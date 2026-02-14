import React, { useState, useRef } from 'react';
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import jsQR from "jsqr"; // 🟢 引入新安装的库
import { useNavigate } from 'react-router-dom';
import { X, Camera, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';

const Scanner = ({ onClose }) => {
  const navigate = useNavigate();
  const [scanError, setScanError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // 处理图片时的 loading 状态
  const fileInputRef = useRef(null);

  // 🟢 处理解析结果的统一函数
  const handleScanResult = (text) => {
    if (!text) return;
    try {
      const data = JSON.parse(text);
      if (data.app === "asset-tracker" && data.id) {
        onClose();
        navigate(`/item/${data.id}`);
      } else {
        setScanError("QR code not recognized as Asset Tag");
      }
    } catch (e) {
      setScanError("Invalid QR code format");
    }
  };

  // 🟢 处理文件上传逻辑
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setScanError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 创建一个看不见的 Canvas 来读取图片像素
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 使用 jsQR 解析像素数据
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          handleScanResult(code.data);
        } else {
          setScanError("No QR code found in this image.");
        }
        setIsProcessing(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-md">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Camera size={20} />
            </div>
            <h3 className="font-extrabold text-slate-800 dark:text-white">Scan Asset Tag</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950 flex flex-col items-center">
          
          <div className="overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 w-full aspect-square relative bg-black flex items-center justify-center">
            
            {!scanError ? (
              <BarcodeScannerComponent
                width={500}
                height={500}
                onUpdate={(err, result) => {
                  if (result) handleScanResult(result.text);
                }}
                onError={(error) => {
                  console.error(error);
                  setScanError("Camera access denied.");
                }}
              />
            ) : (
              <div className="text-center p-4">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <p className="text-red-500 font-bold text-sm">{scanError}</p>
                <button 
                  onClick={() => setScanError(null)}
                  className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Scanning Animation */}
            {!scanError && !isProcessing && (
              <div className="absolute inset-0 pointer-events-none border-t-2 border-primary/70 opacity-50 animate-[scan_2s_infinite]"></div>
            )}

            {/* Processing Loading State */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
                <Loader2 className="animate-spin mb-2" size={32} />
                <span className="text-xs font-bold">Processing Image...</span>
              </div>
            )}
          </div>
          
          {/* 🟢 底部操作栏：增加上传按钮 */}
          <div className="mt-6 flex items-center gap-4 w-full">
            <p className="flex-1 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              Align QR code within frame
            </p>
            
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ImageIcon size={18} className="text-primary" />
              <span className="text-xs font-bold text-slate-700 dark:text-white">Upload</span>
            </button>
            
            {/* 隐藏的文件输入框 */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload}
            />
          </div>

        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(300px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Scanner;