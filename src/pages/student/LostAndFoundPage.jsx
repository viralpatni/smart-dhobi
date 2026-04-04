import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudentComplaints } from '../../hooks/useLostAndFound';
import { useNotifications } from '../../hooks/useNotifications';
import LostItemCard from '../../components/lostAndFound/LostItemCard';
import FileLostItemForm from '../../components/lostAndFound/FileLostItemForm';
import Loader from '../../components/common/Loader';
import { Link } from 'react-router-dom';

const LostAndFoundPage = () => {
  const { currentUser } = useAuth();
  const { complaints, loading } = useStudentComplaints(currentUser?.uid);
  const [activeTab, setActiveTab] = useState('complaints');

  useNotifications(currentUser?.uid);

  const handleFormSuccess = () => {
    setActiveTab('complaints');
  };

  return (
    <div className="bg-slate-50 min-h-screen flex justify-center w-full">
      <div className="w-full max-w-[420px] bg-white min-h-screen shadow-lg relative pb-20">

        {/* Header */}
        <div className="pt-8 pb-4 px-6 sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Link to="/student/dashboard" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Lost & Found</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-2">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'complaints'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            My Complaints
            {complaints.length > 0 && (
              <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                activeTab === 'complaints' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'
              }`}>{complaints.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'file'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            File New Complaint
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'complaints' && (
            <>
              {loading ? (
                <Loader />
              ) : complaints.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-700 mb-1">No lost item complaints yet</h3>
                  <p className="text-sm text-slate-500">We hope your laundry always comes back complete!</p>
                  <button
                    onClick={() => setActiveTab('file')}
                    className="mt-4 text-sm font-medium text-teal-600 hover:text-teal-700"
                  >
                    File a complaint →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((c) => (
                    <LostItemCard key={c.id} complaint={c} currentUserId={currentUser?.uid} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'file' && (
            <FileLostItemForm onSuccess={handleFormSuccess} />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 w-full max-w-[420px] bg-white border-t border-slate-200 px-4 py-3 flex justify-between items-center z-20 pb-safe">
          <Link to="/student/dashboard" className="flex flex-col items-center text-slate-400 hover:text-teal-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
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
          <Link to="/student/lost-and-found" className="flex flex-col items-center text-teal-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11 2a9 9 0 106.32 15.906l3.387 3.387a1 1 0 001.414-1.414l-3.387-3.387A9 9 0 0011 2zm0 2a7 7 0 110 14 7 7 0 010-14zm-1 3a1 1 0 012 0v2h2a1 1 0 010 2h-2v2a1 1 0 01-2 0v-2H8a1 1 0 010-2h2V7z"></path></svg>
            <span className="text-[10px] font-medium mt-1">Lost & Found</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default LostAndFoundPage;
