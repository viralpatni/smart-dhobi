import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComplaintThread, addThreadMessage } from '../../hooks/useComplaints';
import Loader from '../common/Loader';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ComplaintThread = ({ complaintId, viewerRole, complaintStatus }) => {
  const { userData, currentUser } = useAuth();
  const isStaffOrAdmin = ['staff', 'paidStaff', 'admin'].includes(viewerRole);
  const { messages, loading } = useComplaintThread(complaintId, isStaffOrAdmin);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      await addThreadMessage(complaintId, {
        authorId: currentUser.uid,
        authorName: userData.name,
        authorRole: viewerRole,
        message: newMessage.trim(),
        isInternal: isInternal && isStaffOrAdmin
      });
      setNewMessage('');
      setIsInternal(false);
    } catch (err) {
      toast.error('Failed to send message');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="py-4 flex justify-center"><Loader /></div>;

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white mt-4 max-h-[500px]">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center z-10">
        <h4 className="font-bold text-sm text-slate-700">Discussion Thread</h4>
        <span className="text-xs text-slate-500 font-medium">{messages.length} messages</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-4">No messages yet.</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.authorId === currentUser.uid;
            
            // Define bubble colors based on role (unless internal)
            let bubbleColor = "bg-slate-100 text-slate-800"; // default fallback
            let alignment = "justify-start";
            
            if (msg.authorRole === 'student') {
              bubbleColor = "bg-teal-50 text-teal-900 border border-teal-100";
              alignment = isMe ? "justify-end" : "justify-start";
            } else if (msg.authorRole === 'admin') {
              bubbleColor = "bg-purple-100 text-purple-900 border border-purple-200";
              alignment = isMe ? "justify-end" : "justify-start";
            } else if (['staff', 'paidStaff'].includes(msg.authorRole)) {
               bubbleColor = msg.authorRole === 'paidStaff' 
                  ? "bg-amber-50 border border-amber-200 text-amber-900"
                  : "bg-slate-100 border border-slate-200 text-slate-800";
               alignment = isMe ? "justify-end" : "justify-start";
            }

            if (msg.isInternal) {
              bubbleColor = "bg-amber-100 border border-amber-300 text-amber-900 shadow-sm";
            }

            return (
              <div key={msg.id} className={`flex w-full ${alignment}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${bubbleColor} ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                  
                  {/* Header info */}
                  <div className="flex items-center gap-2 mb-1 border-b border-black/5 pb-1">
                    <span className="text-xs font-bold truncate">{isMe ? 'You' : msg.authorName}</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold opacity-60">
                      {msg.authorRole === 'paidStaff' ? 'Paid Pro' : msg.authorRole}
                    </span>
                    {msg.isInternal && (
                      <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded text-[8px] font-bold ml-auto uppercase tracking-wider">
                        Internal Note
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  
                  <p className="text-[10px] opacity-50 mt-1 text-right font-medium">
                    {msg.createdAt ? format(msg.createdAt.toDate(), 'dd MMM, hh:mm a') : 'Just now'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      {complaintStatus !== 'closed' && (
        <form onSubmit={handleSend} className="bg-slate-50 border-t border-slate-200 p-3">
          {isStaffOrAdmin && (
             <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-200">
               <input 
                 type="checkbox" 
                 id="internalCheck" 
                 checked={isInternal} 
                 onChange={(e) => setIsInternal(e.target.checked)}
                 className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
               />
               <label htmlFor="internalCheck" className="text-xs font-bold text-amber-700 cursor-pointer">
                 Internal Note (Hidden from Student)
               </label>
             </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isInternal ? "Write a private note..." : "Type your message..."}
              className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              disabled={sending}
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim() || sending}
              className="bg-teal-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ComplaintThread;
