import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudentOrder } from '../../hooks/useOrders';
import { useStudentSchedule } from '../../hooks/useSchedule';
import LiveStatusTracker from '../../components/student/LiveStatusTracker';
import OnMyWayButton from '../../components/student/OnMyWayButton';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import Loader from '../../components/common/Loader';

const StudentDashboard = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const { order, loading: orderLoading } = useStudentOrder(currentUser?.uid);
  const { schedule, allMyDates, monthName, loading: scheduleLoading } = useStudentSchedule(currentUser?.uid);

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  if (orderLoading || scheduleLoading) return <Loader fullScreen />;

  const hasActiveOrder = order && order.status !== 'collected';

  const upcomingDates = allMyDates.filter(d => d.isFuture);
  const pastDates = allMyDates.filter(d => d.isPast);
  const nextLaundry = upcomingDates.length > 0 ? upcomingDates[0] : null;

  return (
    <div className="bg-slate-50 min-h-screen flex justify-center w-full">
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
          <div className={`rounded-2xl p-5 text-white mb-6 shadow-md relative overflow-hidden ${schedule ? 'bg-gradient-to-br from-teal-600 to-teal-500 shadow-teal-500/20' : 'bg-gradient-to-br from-slate-600 to-slate-500 shadow-slate-500/20'}`}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
             
             {schedule ? (
               <>
                 <div className="flex items-center gap-2 mb-3">
                   <span className="text-xl">🧺</span>
                   <h3 className="font-medium text-teal-50">Your Laundry is Today!</h3>
                 </div>
                 <div className="space-y-1">
                   <p className="text-2xl font-bold">🟢 Active</p>
                   <p className="text-teal-100 text-sm">{schedule.hostelBlock} • Rooms {schedule.roomRange}</p>
                   <p className="text-teal-200 text-xs mt-1">Tap "I'm On My Way" when you're ready to drop off your clothes.</p>
                 </div>
               </>
             ) : (
               <div className="flex flex-col items-center justify-center py-4 text-center">
                 <span className="text-3xl mb-2">😴</span>
                 <p className="font-medium">No laundry scheduled today.</p>
                 {nextLaundry ? (
                   <p className="text-slate-300 text-sm mt-1">Next laundry: <strong>{nextLaundry.fullDate} ({nextLaundry.dayName})</strong></p>
                 ) : (
                   <p className="text-slate-300 text-sm mt-1">No upcoming schedule found this month.</p>
                 )}
               </div>
             )}
          </div>

          {/* Status Region */}
          {hasActiveOrder ? (
            <LiveStatusTracker currentStatus={order.status} rackNo={order.rackNo} order={order} />
          ) : (
             schedule && <OnMyWayButton scheduleId={schedule.id} />
          )}

          {/* ── Monthly Schedule Timeline ── */}
          {allMyDates.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <span>📅</span> My Laundry Schedule
                </h2>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{monthName}</span>
              </div>

              <div className="space-y-2">
                {allMyDates.map((d) => (
                  <div
                    key={d.date} 
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      d.isToday 
                        ? 'bg-teal-50 border-teal-300 shadow-sm shadow-teal-100' 
                        : d.isPast 
                          ? 'bg-slate-50 border-slate-100 opacity-60' 
                          : 'bg-white border-slate-200 hover:border-teal-200'
                    }`}
                  >
                    {/* Date Circle */}
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                      d.isToday 
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30' 
                        : d.isPast 
                          ? 'bg-slate-200 text-slate-500' 
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      <span className="text-lg font-bold leading-none">{d.date}</span>
                      <span className="text-[9px] uppercase font-semibold mt-0.5">{d.dayName}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${d.isToday ? 'text-teal-700' : 'text-gray-700'}`}>
                        {d.isToday ? '🟢 Today — Your Laundry Day!' : d.isPast ? 'Completed' : 'Upcoming'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {userData.hostelBlock} • Rooms {d.roomRange}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${
                      d.isToday 
                        ? 'bg-teal-600 text-white' 
                        : d.isPast 
                          ? 'bg-slate-200 text-slate-500 line-through' 
                          : 'bg-blue-50 text-blue-600'
                    }`}>
                      {d.isToday ? 'TODAY' : d.isPast ? 'DONE' : d.fullDate}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats Footer */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-lg font-bold text-slate-800">{allMyDates.length}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase">Total Days</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                  <p className="text-lg font-bold text-teal-700">{upcomingDates.length}</p>
                  <p className="text-[10px] text-teal-600 font-medium uppercase">Upcoming</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-lg font-bold text-slate-500">{pastDates.length}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Completed</p>
                </div>
              </div>
            </div>
          )}

          {/* No schedule at all message */}
          {allMyDates.length === 0 && !schedule && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
              <span className="text-3xl">📋</span>
              <p className="font-semibold text-amber-800 mt-2">No schedule uploaded yet</p>
              <p className="text-sm text-amber-600 mt-1">Your Dhobi hasn't uploaded this month's schedule. Check back soon!</p>
            </div>
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
