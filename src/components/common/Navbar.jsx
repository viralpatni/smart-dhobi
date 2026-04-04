import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ title }) => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl" role="img" aria-label="laundry">🧺</span>
        <span className="font-bold text-teal-600 text-lg">SmartDhobi</span>
        {title && <span className="ml-2 pl-2 border-l border-slate-300 text-slate-500 font-medium hidden sm:inline">{title}</span>}
      </div>
      
      {userData && (
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold">{userData.name}</span>
            <span className="text-xs text-slate-500 capitalize">{userData.role}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
            {userData.name.charAt(0)}
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-500 font-medium ml-2"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
