import React from 'react';
import QRCodeCard from '../../components/student/QRCodeCard';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const StudentQRPage = () => {
  const { userData } = useAuth();

  return (
    <div className="bg-slate-900 min-h-screen flex justify-center w-full">
      <div className="w-full max-w-[420px] min-h-screen relative flex flex-col pt-8 pb-20">
        
        {/* Header */}
        <div className="px-6 flex items-center justify-between mb-12">
          <Link to="/student/dashboard" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <h1 className="text-white font-semibold flex-1 text-center pr-10">Your QR Pass</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <QRCodeCard 
            uid={userData.uid} 
            name={userData.name} 
            roomNo={userData.roomNo} 
          />
          <p className="mt-8 text-slate-400 text-sm text-center max-w-[250px]">
            Show this code at the laundry counter to drop off your clothes.
          </p>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 w-full max-w-[420px] bg-slate-900 border-t border-slate-800 px-6 py-3 flex justify-between items-center z-20 pb-safe">
          <Link to="/student/dashboard" className="flex flex-col items-center text-slate-400 hover:text-teal-400 transition-colors">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
             <span className="text-[10px] font-medium mt-1">Home</span>
          </Link>
          <Link to="/student/qr" className="flex flex-col items-center text-teal-400">
             <div className="bg-teal-500 rounded-full p-3 -mt-8 shadow-lg shadow-teal-500/30 text-white border-4 border-slate-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
             </div>
             <span className="text-[10px] font-medium mt-1">QR Code</span>
          </Link>
          <Link to="/student/history" className="flex flex-col items-center text-slate-400 hover:text-teal-400 transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             <span className="text-[10px] font-medium mt-1">History</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentQRPage;
