import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeCard = ({ uid, name, roomNo, isPaidMode = false }) => {
  const handleSave = () => {
    const canvas = document.getElementById('student-qr-code');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `SmartDhobi-QR-${name}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className={`bg-white p-8 rounded-2xl relative group ${isPaidMode ? 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'shadow-[0_0_20px_rgba(13,148,136,0.3)]'}`}>
        <div className={`absolute inset-0 rounded-2xl border-2 border-transparent transition-colors animate-pulse-ring pointer-events-none ${isPaidMode ? 'group-hover:border-amber-400 border-amber-400/50' : 'group-hover:border-teal-400 border-teal-400/50'}`}></div>
        <QRCodeCanvas 
          id="student-qr-code"
          value={uid} 
          size={220} 
          bgColor={"#ffffff"}
          fgColor={"#0F172A"}
          level={"H"}
        />
      </div>
      
      <div className={`mt-6 text-center ${isPaidMode ? 'text-slate-800' : 'text-white'}`}>
        <h2 className="text-2xl font-bold">{name}</h2>
        <p className={`text-lg mt-1 flex items-center justify-center gap-2 ${isPaidMode ? 'text-slate-500' : 'text-slate-300'}`}>
          <span>Room:</span> <span className={`font-semibold px-2 py-1 ${isPaidMode ? 'bg-amber-100 text-amber-800' : 'bg-white/10'} rounded`}>{roomNo}</span>
        </p>
      </div>

      {!isPaidMode && (
        <button 
          onClick={handleSave}
          className="mt-8 bg-white/10 hover:bg-white/20 text-white border border-white/30 py-2.5 px-6 rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Save QR
        </button>
      )}
    </div>
  );
};

export default QRCodeCard;
