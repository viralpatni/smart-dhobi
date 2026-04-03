import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import KanbanBoard from '../../components/dhobi/KanbanBoard';
import QRScannerModal from '../../components/dhobi/QRScannerModal';
import ScheduleUploader from '../../components/dhobi/ScheduleUploader';
import { useAllActiveOrders } from '../../hooks/useOrders';
import Loader from '../../components/common/Loader';
import { formatStandardDate } from '../../utils/formatDate';

const DhobiDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { orders, loading } = useAllActiveOrders();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  
  // Custom incoming alerts
  const incomingAlerts = orders.filter(o => o.status === 'onTheWay');

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-[240px] bg-[#0F172A] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <span className="text-3xl">🧺</span>
          <span className="font-bold text-xl text-teal-400">SmartDhobi</span>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-2">
          <NavLink to="/dhobi/dashboard" className={({isActive}) => `px-6 py-3 flex items-center gap-3 transition-colors ${isActive ? 'bg-white/10 border-l-4 border-teal-400 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Dashboard
          </NavLink>
          <button onClick={() => setIsScannerOpen(true)} className={`px-6 py-3 flex items-center gap-3 transition-colors text-slate-400 hover:text-white hover:bg-white/5 w-full text-left`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            Scan QR
          </button>
          <button onClick={() => setIsScheduleOpen(true)} className={`px-6 py-3 flex items-center gap-3 transition-colors text-slate-400 hover:text-white hover:bg-white/5 w-full text-left`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Upload Schedule
          </button>
          <NavLink to="/dhobi/analytics" className={({isActive}) => `px-6 py-3 flex items-center gap-3 transition-colors ${isActive ? 'bg-white/10 border-l-4 border-teal-400 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Analytics
          </NavLink>
        </div>
        
        <div className="p-6 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition-colors w-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Good morning, {userData.name.split(' ')[0]}</h2>
            <p className="text-sm text-slate-500">{formatStandardDate(new Date())}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              {incomingAlerts.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center">
              {userData.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-8 bg-slate-50">
          {incomingAlerts.length > 0 && (
            <div className="mb-6 animate-pulse">
              {incomingAlerts.map(alert => (
                <div key={alert.id} className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded shadow-sm mb-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold flex items-center gap-2">⚡ Student On The Way!</span>
                    <span className="text-sm">{alert.studentName} from {alert.studentRoom} is arriving shortly.</span>
                  </div>
                  <button onClick={() => setIsScannerOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded shadow-sm text-sm font-medium">Open Scanner</button>
                </div>
              ))}
            </div>
          )}

          <div className="h-full">
            <KanbanBoard orders={orders} />
          </div>
        </div>
      </div>

      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      <ScheduleUploader isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} />
    </div>
  );
};

export default DhobiDashboard;
