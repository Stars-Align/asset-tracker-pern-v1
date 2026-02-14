import React, { useRef } from 'react';
import QRCode from "react-qr-code";
import { Download, X } from 'lucide-react';

export default function ItemQRCode({ item, onClose }) {
  const svgRef = useRef(null);

  // 下载二维码为 PNG 图片
  const downloadQRCode = () => {
    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    // 设置图片包含 ID 信息
    const svgSize = 256;
    canvas.width = svgSize;
    canvas.height = svgSize + 40; // 留出底部文字空间

    img.onload = () => {
      // 绘制白色背景
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // 绘制二维码
      ctx.drawImage(img, 0, 0);
      // 绘制物品名称和 ID (底部备注)
      ctx.font = "12px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.fillText(item.name.substring(0, 20), canvas.width / 2, svgSize + 15);
      ctx.font = "10px Monospace";
      ctx.fillStyle = "#666";
      ctx.fillText(item.id.split('-')[0], canvas.width / 2, svgSize + 30);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${item.name}_${item.id.slice(0,4)}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in-95 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
          <X size={20} />
        </button>
        
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2">Asset Tag</h3>
        <p className="text-xs text-slate-400 mb-6">Print and stick this on your item.</p>

        <div className="p-4 bg-white rounded-xl border-2 border-slate-100">
          {/* 这里的 value 是一个 JSON 字符串，包含 ID 和特定标识符 */}
          <QRCode 
            ref={svgRef}
            size={200}
            value={JSON.stringify({ app: "asset-tracker", id: item.id })} 
            viewBox={`0 0 256 256`}
          />
        </div>

        <div className="mt-4 text-center">
            <div className="font-bold text-slate-800 dark:text-white">{item.name}</div>
            <div className="text-xs font-mono text-slate-400 uppercase">{item.id}</div>
        </div>

        <button 
          onClick={downloadQRCode}
          className="mt-6 w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors"
        >
          <Download size={18} /> Download Label
        </button>
      </div>
    </div>
  );
}