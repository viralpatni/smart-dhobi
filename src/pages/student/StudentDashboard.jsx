import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudentOrder } from '../../hooks/useOrders';
import { useStudentSchedule } from '../../hooks/useSchedule';
import LiveStatusTracker from '../../components/student/LiveStatusTracker';
import OnMyWayButton from '../../components/student/OnMyWayButton';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import Loader from '../../components/common/Loader';
import { formatStandardDate } from '../../utils/formatDate';

const StudentDashboard = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const { order, loading: orderLoading } = useStudentOrder(currentUser?.uid);
  const { schedule, loading: scheduleLoading } = useStudentSchedule(currentUser?.uid);

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  if (orderLoading || scheduleLoading) return <Loader fullScreen />;

  const hasActiveOrder = order && order.status !== 'collected';

  return (
    <div className="bg-surface min-h-screen flex justify-center w-full">
      <div className="w-full max-w-[420px] bg-white min-h-screen shadow-lg relative pb-20">
        
        {/* Header */}
        <div className="pt-8 pb-4 px-6 fixed top-0 w-full max-w-[420px] bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-500 text-sm">Good morning,</p>
              <h1 className="text-xl font-bold text-gray-800">{userData.name.split(' ')[0]} 👋</h1>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleLogout}
                className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors px-2 py-1 rounded border border-slate-200"
              >
                Logout
              </button>
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border border-teal-200 shadow-sm">
                {userData.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-6 pt-24 pb-6">
          
          {/* Today's Slot Card */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-500 rounded-2xl p-5 text-white mb-6 shadow-md shadow-teal-500/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
             
             {schedule ? (
               <>
                 <div className="flex items-center gap-2 mb-3">
                   <span className="text-xl">📅</span>
                   <h3 className="font-medium text-teal-50">Today's Laundry Slot</h3>
                 </div>
                 <div className="space-y-1">
                   <p className="text-2xl font-bold">{schedule.slotTime}</p>
                   <p className="text-teal-100 text-sm">{schedule.hostelBlock}</p>
                 </div>
               </>
             ) : (
               <div className="flex flex-col items-center justify-center py-4 text-center">
                 <span className="text-3xl mb-2">🧺</span>
                 <p className="font-medium">No laundry scheduled today.</p>
                 <p className="text-teal-100 text-sm mt-1">Check back on your scheduled day.</p>
               </div>
             )}
          </div>

          {/* Status Region */}
          {hasActiveOrder ? (
            <LiveStatusTracker currentStatus={order.status} rackNo={order.rackNo} />
          ) : (
             schedule && <OnMyWayButton scheduleId={schedule.id} />
          )}

        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 w-full max-w-[420px] bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-20 pb-safe">
          <Link to="/student/dashboard" className="flex flex-col items-center text-teal-600">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
             <span className="text-[10px] font-medium mt-1">Home</span>
          </Link>
          <Link to="/student/qr" className="flex flex-col items-center text-slate-400 hover:text-teal-600 transition-colors">
             <div className="bg-teal-500 rounded-full p-3 -mt-8 shadow-lg shadow-teal-500/30 text-white border-4 border-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
             </div>
             <span className="text-[10px] font-medium mt-1">QR Code</span>
          </Link>
          <Link to="/student/history" className="flex flex-col items-center text-slate-400 hover:text-teal-600 transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             <span className="text-[10px] font-medium mt-1">History</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
