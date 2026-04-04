import React, { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ComplaintThread from './ComplaintThread';

const AdminComplaintDetail = ({ complaint, onClose }) => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState(complaint.status);
  const [priority, setPriority] = useState(complaint.priority);
  const [adminResponse, setAdminResponse] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);

  const shortId = complaint.id.substring(0, 8).toUpperCase();

  const handleUpdateMeta = async (field, value) => {
    try {
      await supabase.from('complaints').update({ [field]: value }).eq('id', complaint.id);
      if (field === 'status') setStatus(value);
      if (field === 'priority') setPriority(value);
      toast.success(`Updated ${field}`);
    } catch (e) {
      console.error(e);
      toast.error(`Failed to update ${field}`);
    }
  };

  const handleAdminResolve = async () => {
    if (!adminResponse.trim()) {
       toast.error("Please provide an admin response."); return;
    }
    setProcessing(true);
    try {
      await supabase.from('complaints').update({
        status: 'resolvedByAdmin',
        admin_response: adminResponse.trim(),
        resolution_summary: `Admin Intervention: ${adminResponse.trim().substring(0, 100)}...`,
        admin_responded_at: new Date(),
        admin_responded_by: currentUser.uid
      }).eq('id', complaint.id);
      toast.success('Resolved as Admin');
      setStatus('resolvedByAdmin');
      setAdminResponse('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to resolve');
    } finally {
      setProcessing(false);
    }
  };

  const handleForceClose = async () => {
    if (!closingNote.trim()) {
       toast.error('Please provide a closing note for the records.'); return;
    }
    setProcessing(true);
    try {
      await supabase.from('complaints').update({
        status: 'closed',
        resolution_summary: `Force Closed by Admin: ${closingNote.trim()}`
      }).eq('id', complaint.id);
      toast.success('Ticket Force Closed');
      setStatus('closed');
      setShowCloseConfirm(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to close ticket');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
      {/* Slide-over panel */}
      <div className="w-full max-w-4xl bg-white h-full flex flex-col shadow-2xl animate-fade-in-up md:animate-none">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <span className="font-mono text-slate-500 font-bold mr-2 text-sm">#{shortId}</span>
            <span className="text-lg font-bold text-slate-800">Ticket Details</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto flex flex-col md:flex-row">
          
          {/* Left Column: Details */}
          <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-slate-200">
            
            <div className="flex flex-wrap gap-2 mb-6">
               <div className="bg-slate-100 rounded px-2 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider">{complaint.type}</div>
               <div className="bg-slate-100 rounded px-2 py-1 text-xs font-bold text-slate-600">{complaint.category}</div>
               <div className="bg-slate-100 rounded px-2 py-1 text-xs font-bold text-slate-600">{complaint.serviceType === 'freeLaundry' ? 'Free Laundry' : complaint.serviceType === 'paidLaundry' ? 'Paid Laundry' : 'General'}</div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2">{complaint.title}</h2>
            <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
              {complaint.description}
            </p>

            {complaint.suggestedSolution && (
              <div className="mb-6">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 block">Student's Suggested Fix</span>
                <p className="text-sm border-l-2 border-teal-500 pl-3 py-1 text-slate-700">{complaint.suggestedSolution}</p>
              </div>
            )}

            {complaint.attachmentUrl && (
              <div className="mb-6">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 block">Attachment</span>
                <a href={complaint.attachmentUrl} target="_blank" rel="noreferrer" className="block w-full max-w-sm rounded bg-slate-100 border border-slate-200 p-1 hover:border-indigo-400 transition-colors">
                   <img src={complaint.attachmentUrl} alt="Attachment" className="w-full h-auto rounded" />
                </a>
              </div>
            )}

            {/* Admin Only Info Box: Identity overrides anonymous */}
            <div className={`mt-6 rounded-lg p-4 border ${complaint.isAnonymous ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
               <h4 className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 mb-3">
                 <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" clipRule="evenodd"></path></svg>
                 Student Identity (Admin Override)
               </h4>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Name</p>
                   <p className="text-sm font-semibold text-slate-800">{complaint.studentName}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Phone</p>
                   <p className="text-sm font-semibold text-slate-800">{complaint.studentPhone}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Room</p>
                   <p className="text-sm font-semibold text-slate-800">{complaint.studentRoom}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Token</p>
                   <p className="text-sm font-semibold font-mono text-indigo-700">{complaint.relatedTokenId || 'N/A'}</p>
                 </div>
               </div>
               {complaint.isAnonymous && <p className="text-xs font-bold text-amber-700 mt-3 pt-2 border-t border-amber-200">This student requested anonymity from staff.</p>}
            </div>

            {/* Target Staff Context */}
            {complaint.againstStaffName && (
              <div className="mt-4 rounded-lg p-4 border border-slate-200 bg-slate-50">
                 <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Subject Staff Member</h4>
                 <p className="text-sm font-semibold text-slate-800">{complaint.againstStaffName} <span className="text-xs text-slate-500 font-normal">({complaint.againstStaffRole})</span></p>
                 <button className="text-indigo-600 text-xs font-bold hover:underline py-1 mt-1">Reassign to another staff</button>
              </div>
            )}

          </div>

          {/* Right Column: Interaction & Thread */}
          <div className="w-full md:w-1/2 flex flex-col items-stretch h-full bg-slate-50/50">
            
            {/* Meta Controllers */}
            <div className="p-4 bg-white border-b border-slate-200 grid grid-cols-2 gap-4 shrink-0">
               <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => handleUpdateMeta('status', e.target.value)}
                    className="w-full border-slate-300 rounded text-sm py-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="inReview">In Review</option>
                    <option value="resolvedByStaff">Resolved By Staff</option>
                    <option value="escalatedToAdmin">Escalated</option>
                    <option value="resolvedByAdmin">Resolved By Admin</option>
                    <option value="closed">Closed</option>
                  </select>
               </div>
               <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Priority</label>
                  <select 
                    value={priority} 
                    onChange={(e) => handleUpdateMeta('priority', e.target.value)}
                    className={`w-full border-slate-300 rounded text-sm py-1.5 focus:border-indigo-500 font-bold ${priority==='urgent'?'text-red-600':''}`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
               </div>
            </div>

            {/* Thread Area */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
               <ComplaintThread 
                 complaintId={complaint.id} 
                 viewerRole="admin" 
                 complaintStatus={status} 
               />
            </div>

            {/* Action Bar */}
            {status !== 'closed' && (
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                 {/* Admin Resolve Area */}
                 <div className="mb-4">
                   <label className="block text-xs font-bold text-slate-700 mb-2">Write Admin Response</label>
                   <textarea
                     value={adminResponse}
                     onChange={e => setAdminResponse(e.target.value)}
                     className="w-full border-slate-300 rounded p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
                     placeholder="This will be recorded as the final admin resolution."
                   />
                   <div className="flex justify-end mt-2">
                     <button onClick={handleAdminResolve} disabled={processing || !adminResponse.trim()} className="bg-indigo-600 text-white font-bold text-sm px-4 py-2 rounded shrink-0 hover:bg-indigo-700 disabled:opacity-50">
                       Resolve as Admin
                     </button>
                   </div>
                 </div>

                 {/* Force Close */}
                 <div className="border-t border-slate-100 pt-4">
                   {!showCloseConfirm ? (
                     <button onClick={() => setShowCloseConfirm(true)} className="text-red-600 font-bold text-xs hover:underline flex items-center justify-center w-full py-2">
                       Force Close Ticket (No further action)
                     </button>
                   ) : (
                     <div className="bg-red-50 p-3 rounded border border-red-200">
                       <input 
                         type="text" 
                         value={closingNote} 
                         onChange={e=>setClosingNote(e.target.value)}
                         placeholder="Reason for closing..." 
                         className="w-full border-red-200 rounded text-sm p-1.5 mb-2 focus:ring-red-400" 
                       />
                       <div className="flex gap-2">
                         <button onClick={handleForceClose} disabled={processing} className="bg-red-600 text-white flex-1 rounded font-bold text-xs py-2 hover:bg-red-700">Confirm Close</button>
                         <button onClick={() => setShowCloseConfirm(false)} className="border border-red-200 text-red-700 flex-1 rounded font-bold text-xs py-2 bg-white hover:bg-red-100">Cancel</button>
                       </div>
                     </div>
                   )}
                 </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminComplaintDetail;
