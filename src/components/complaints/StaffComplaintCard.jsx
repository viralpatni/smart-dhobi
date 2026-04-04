import React, { useState } from 'react';
import { format } from 'date-fns';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import ComplaintThread from './ComplaintThread';
import { useAuth } from '../../context/AuthContext';

const StaffComplaintCard = ({ complaint }) => {
  const { userData, currentUser } = useAuth();
  const [showThread, setShowThread] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [processing, setProcessing] = useState(false);

  const shortId = complaint.id.substring(0, 8).toUpperCase();
  const isComplaint = complaint.type === 'complaint';

  const handleAcknowledge = async () => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'complaints', complaint.id), {
        status: 'acknowledged'
      });
      toast.success('Complaint acknowledged');
    } catch (e) {
      console.error(e);
      toast.error('Failed to acknowledge');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkInReview = async () => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'complaints', complaint.id), {
        status: 'inReview'
      });
      toast.success('Complaint marked as In Review');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handleResolve = async () => {
    if (!responseMsg.trim() || !resolutionSummary.trim()) {
      toast.error("Please provide both a response and a resolution summary.");
      return;
    }
    setProcessing(true);
    try {
      await updateDoc(doc(db, 'complaints', complaint.id), {
        status: 'resolvedByStaff',
        staffResponse: responseMsg.trim(),
        resolutionSummary: resolutionSummary.trim(),
        staffRespondedAt: serverTimestamp(),
        staffRespondedBy: currentUser.uid
      });
      toast.success('Complaint resolved successfully!');
      setShowResponseForm(false);
      setShowThread(true);
    } catch (e) {
      console.error(e);
      toast.error('Failed to resolve');
    } finally {
      setProcessing(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'urgent': return 'bg-red-600 text-white animate-pulse';
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': 
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden mb-4 ${isComplaint ? 'border-red-200' : 'border-teal-200'}`}>
      <div className="p-4 sm:p-5">
        
        {/* Top Row / Identifier */}
        <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
              #{shortId}
            </span>
            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-wider ${isComplaint ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'}`}>
              {complaint.type}
            </span>
            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-wider ${getPriorityBadge(complaint.priority)}`}>
              {complaint.priority} Priority
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {complaint.createdAt ? format(complaint.createdAt.toDate(), 'dd MMM, hh:mm a') : ''}
          </span>
        </div>

        {/* Student Details Context */}
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Filed By</p>
            {complaint.isAnonymous ? (
              <p className="font-bold text-amber-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                Anonymous Student
              </p>
            ) : (
              <p className="font-bold text-slate-800">{complaint.studentName} <span className="font-normal text-slate-500">({complaint.studentRoom})</span></p>
            )}
          </div>
          
          {complaint.relatedTokenId && (
            <div className="flex-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
               <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Related Order</p>
               <p className="font-bold font-mono text-indigo-700">{complaint.relatedTokenId}</p>
            </div>
          )}
        </div>

        {/* Issue Specs */}
        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 flex items-center gap-2">
           {complaint.title}
        </h3>
        <span className="inline-block text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded mb-2">
          Category: {complaint.category}
        </span>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          {complaint.description}
        </p>

        {complaint.suggestedSolution && (
          <div className="bg-teal-50 border border-teal-100 rounded p-3 mb-4">
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block mb-1">Student's Suggested Fix</span>
            <p className="text-sm text-teal-800 font-medium">{complaint.suggestedSolution}</p>
          </div>
        )}

        {/* Resolution State (if resolved) */}
        {(complaint.status === 'resolvedByStaff' || complaint.status === 'closed') && (
           <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
              <span className="text-xs font-bold text-green-800 uppercase tracking-wider flex items-center gap-1 mb-1">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                 Resolution Applied
              </span>
              <p className="text-sm text-green-900 border-b border-green-200/50 pb-2 mb-2">{complaint.resolutionSummary}</p>
              {complaint.studentSatisfied === true ? (
                 <p className="text-xs font-bold text-green-700">✓ Student confirmed satisfaction</p>
              ) : complaint.studentSatisfied === false ? (
                 <p className="text-xs font-bold text-red-600">⚠ Student was unsatisfied with this resolution</p>
              ) : (
                 <p className="text-xs font-medium text-slate-500">Waiting for student rating...</p>
              )}
           </div>
        )}

        {/* Staff Action Controls */}
        <div className="bg-slate-50 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 mt-4 p-4 sm:p-5 border-t border-slate-100">
           
           {!showResponseForm && complaint.status !== 'resolvedByStaff' && complaint.status !== 'closed' && (
              <div className="flex flex-wrap gap-2 mb-4">
                {complaint.status === 'submitted' && (
                  <button 
                    onClick={handleAcknowledge}
                    disabled={processing}
                    className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    Acknowledge Receipt
                  </button>
                )}

                {(complaint.status === 'acknowledged' || complaint.status === 'inReview') && (
                  <>
                    {complaint.status === 'acknowledged' && (
                      <button 
                        onClick={handleMarkInReview}
                        disabled={processing}
                        className="bg-amber-500 text-white px-4 py-2 rounded font-bold text-sm hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
                      >
                        Mark 'In Review'
                      </button>
                    )}
                    <button 
                      onClick={() => setShowResponseForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-green-700 transition-colors shadow-sm"
                    >
                      Write Resolution & Close
                    </button>
                  </>
                )}
              </div>
           )}

           {showResponseForm && (
             <div className="bg-white border text-left border-green-200 rounded-lg p-4 mb-4 shadow-sm animate-fade-in-up">
               <h4 className="font-bold text-green-800 text-sm mb-3">Resolve Ticket</h4>
               
               <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Detailed Response to Student</label>
               <textarea 
                 value={responseMsg}
                 onChange={e => setResponseMsg(e.target.value)}
                 className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 min-h-[80px] mb-3"
                 placeholder="Explain what happened and what steps you are taking..."
               />

               <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Short Resolution Summary (For Records)</label>
               <input 
                 type="text"
                 value={resolutionSummary}
                 onChange={e => setResolutionSummary(e.target.value)}
                 className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 mb-4"
                 placeholder="e.g. Apologized and issued a replacement shirt."
               />

               <div className="flex items-center gap-2">
                 <button 
                   onClick={handleResolve}
                   disabled={processing || !responseMsg.trim() || !resolutionSummary.trim()}
                   className="flex-1 bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                 >
                   {processing ? 'Resolving...' : 'Submit Resolution'}
                 </button>
                 <button 
                   onClick={() => setShowResponseForm(false)}
                   className="px-4 py-2 border border-slate-300 text-slate-600 font-bold rounded hover:bg-slate-50 transition-colors"
                 >
                   Cancel
                 </button>
               </div>
             </div>
           )}

           {/* Thread toggle */}
           <button 
             onClick={() => setShowThread(!showThread)}
             className={`w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-bold transition-colors ${showThread ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
             {showThread ? 'Hide Discussion Thread' : 'Open Discussion & Internal Notes'}
           </button>

           {showThread && (
             <ComplaintThread 
               complaintId={complaint.id} 
               viewerRole={userData.role} 
               complaintStatus={complaint.status} 
             />
           )}

        </div>
      </div>
    </div>
  );
};

export default StaffComplaintCard;
