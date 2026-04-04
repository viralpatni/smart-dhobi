import React, { useState } from 'react';
import { format } from 'date-fns';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import ComplaintThread from './ComplaintThread';

const SubmissionCard = ({ submission }) => {
  const [showThread, setShowThread] = useState(false);
  const isComplaint = submission.type === 'complaint';

  const handleSatisfaction = async (satisfied) => {
    try {
      await updateDoc(doc(db, 'complaints', submission.id), {
        studentSatisfied: satisfied,
        status: 'closed'
      });
      toast.success(satisfied ? 'Glad we could help!' : 'Noted, the ticket is now closed.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status, isEscalated) => {
    if (isEscalated) return 'bg-red-100 text-red-700 animate-pulse border border-red-200';
    switch(status) {
      case 'submitted': return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'acknowledged': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'inReview': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'resolvedByStaff': 
      case 'resolvedByAdmin': return 'bg-green-100 text-green-700 border border-green-200';
      case 'closed': return 'bg-slate-100 text-slate-500 border border-slate-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status, isEscalated) => {
    if (isEscalated) return 'Escalated — Admin Review';
    switch(status) {
      case 'resolvedByStaff': return 'Resolved by Staff';
      case 'resolvedByAdmin': return 'Resolved by Admin';
      case 'inReview': return 'In Review';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden mb-4 ${isComplaint ? 'border-l-red-500 border-slate-200' : 'border-l-teal-500 border-slate-200'}`}>
      <div className="p-4 sm:p-5">
        
        {/* Top Row */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-wider ${isComplaint ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'}`}>
              {submission.type}
            </span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {submission.category}
            </span>
            {submission.isAnonymous && isComplaint && (
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Anonymous
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
            {submission.createdAt ? format(submission.createdAt.toDate(), 'dd MMM, yy') : ''}
          </span>
        </div>

        {/* Content */}
        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{submission.title}</h3>
        <p className="text-sm text-slate-600 line-clamp-2 md:line-clamp-none leading-relaxed">
          {submission.description}
        </p>

        {submission.rating && !isComplaint && (
           <div className="mt-3 flex items-center gap-1">
             {[1,2,3,4,5].map(s => (
               <svg key={s} className={`w-4 h-4 ${s <= submission.rating ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
             ))}
           </div>
        )}

        {/* Escalation Banner */}
        {submission.isEscalated && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-lg flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <p>This complaint was auto-escalated to admin on {submission.escalatedAt ? format(submission.escalatedAt.toDate(), 'dd MMM') : ''} due to no active staff response.</p>
          </div>
        )}

        {/* Resolution Box */}
        {(submission.status.includes('resolved') || submission.status === 'closed') && submission.resolutionSummary && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
             <h4 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-1 flex items-center gap-1">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               Resolution
             </h4>
             <p className="text-sm text-green-900 leading-relaxed font-medium pb-3 border-b border-green-200/50 mb-3">{submission.resolutionSummary}</p>
             
             {/* Satisfaction interaction */}
             {submission.studentSatisfied === null && submission.status !== 'closed' ? (
                <div>
                   <p className="text-xs font-bold text-slate-600 mb-2">Were you satisfied with this response?</p>
                   <div className="flex gap-2">
                     <button onClick={() => handleSatisfaction(true)} className="flex items-center gap-1 bg-white border border-green-300 text-green-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-green-100 transition-colors">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg>
                       Yes, satisfied
                     </button>
                     <button onClick={() => handleSatisfaction(false)} className="flex items-center gap-1 bg-white border border-red-300 text-red-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-50 transition-colors">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"></path></svg>
                       No, unresolved
                     </button>
                   </div>
                </div>
             ) : submission.studentSatisfied !== null ? (
                <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  {submission.studentSatisfied 
                    ? <span className="text-green-600 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg> Satisfied</span>
                    : <span className="text-red-500 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"></path></svg> Unresolved</span>}
                  response recorded.
                </p>
             ) : null}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${getStatusColor(submission.status, submission.isEscalated)}`}>
            {getStatusLabel(submission.status, submission.isEscalated)}
          </span>
          <button 
            onClick={() => setShowThread(!showThread)}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
            {showThread ? 'Hide Thread' : 'View Thread'}
          </button>
        </div>

        {showThread && (
          <ComplaintThread 
            complaintId={submission.id} 
            viewerRole="student" 
            complaintStatus={submission.status}
          />
        )}

      </div>
    </div>
  );
};

export default SubmissionCard;
