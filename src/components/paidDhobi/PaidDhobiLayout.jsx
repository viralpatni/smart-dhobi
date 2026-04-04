import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { formatStandardDate } from '../../utils/formatDate';

const PaidDhobiLayout = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  const NavItem = ({ to, icon, label, end = false }) => (
    <NavLink 
      to={to} 
      end={end}
      onClick={() => setMobileMenuOpen(false)}
      className={({isActive}) => `px-6 py-3 flex items-center gap-3 transition-all font-medium ${
        isActive 
          ? 'bg-amber-500/20 border-l-4 border-amber-500 text-amber-50' 
          : 'text-amber-100/70 hover:text-amber-50 hover:bg-white/5 border-l-4 border-transparent'
      }`}
    >
      <span className={({isActive}) => isActive ? 'text-amber-400' : 'text-amber-200/50'}>
        {icon}
      </span>
      {label}
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar - Amber Theme */}
      <div className={`fixed inset-y-0 left-0 w-[240px] bg-[#78350F] text-amber-50 flex flex-col z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 shrink-0">
          <span className="text-3xl">🧳</span>
          <div>
            <span className="font-black text-xl text-amber-400 leading-tight block">SmartDhobi</span>
            <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase">Paid Pro</span>
          </div>
        </div>
        
        <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
          <NavItem to="/paid-dhobi/dashboard" end label="Dashboard" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          } />
          <NavItem to="/paid-dhobi/orders" label="Active Orders" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          } />
          <NavItem to="/paid-dhobi/pricing" label="Pricing Manager" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
          } />
          <NavItem to="/paid-dhobi/schedules" label="Schedule Manager" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          } />
          <NavItem to="/paid-dhobi/analytics" label="Analytics" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          } />
          <NavItem to="/paid-dhobi/complaints" label="Complaints" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          } />
        </div>
        
        <div className="p-6 shrink-0 border-t border-amber-900 bg-[#652c0c] mt-auto">
          <button onClick={handleLogout} className="flex items-center gap-3 text-amber-100/70 hover:text-red-400 transition-colors w-full font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b-2 border-amber-500 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setMobileMenuOpen(true)}
               className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
             </button>
             <div className="hidden sm:block">
               <h2 className="text-xl font-bold text-slate-800">Paid Laundry Portal</h2>
               <p className="text-xs text-slate-500 font-medium">{formatStandardDate(new Date())}</p>
             </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right hidden sm:block">
               <p className="font-bold text-slate-800 text-sm leading-tight max-w-[150px] truncate">{userData?.name}</p>
               <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Paid Dhobi</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center border-2 border-amber-200 shadow-sm shrink-0">
               {userData?.name?.charAt(0) || 'P'}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-auto bg-slate-50/50">
          <Outlet />
        </div>

      </div>
    </div>
  );
};

export default PaidDhobiLayout;
