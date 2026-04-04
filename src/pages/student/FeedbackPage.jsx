import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudentSubmissions } from '../../hooks/useComplaints';
import { db, storage } from '../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import TypeSelector from '../../components/complaints/TypeSelector';
import StarRating from '../../components/complaints/StarRating';
import SubmissionCard from '../../components/complaints/SubmissionCard';
import Loader from '../../components/common/Loader';

const COMPLAINT_CATEGORIES = [
  "Staff Behavior", "Clothes Quality", "Delivery / Pickup Issue", 
  "Wrong Rack", "Missing Item (Separate from Lost & Found)", 
  "Damage to Clothes", "Billing Issue (Paid Laundry)", "Other"
];

const FEEDBACK_CATEGORIES = [
  "App Suggestion", "Pricing Feedback", "Schedule Feedback", 
  "General Appreciation", "Service Improvement", "Other"
];

const FeedbackPage = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const { submissions, loading: submissionsLoading } = useStudentSubmissions(currentUser?.uid);
  
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'new'
  const [filter, setFilter] = useState('All');

  // New Submission State
  const [step, setStep] = useState(0);
  const [type, setType] = useState(null); // 'complaint' or 'feedback'
  const [serviceType, setServiceType] = useState('freeLaundry');
  const [category, setCategory] = useState('');
  
  const [hasRelatedOrder, setHasRelatedOrder] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(''); // JSON string of {id, token}
  
  const [hasAgainstStaff, setHasAgainstStaff] = useState(false);
  const [againstStaffRole, setAgainstStaffRole] = useState('staff');
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(''); // JSON string of {id, name}
  
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [suggestedSolution, setSuggestedSolution] = useState('');

  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch recent orders for linking
  useEffect(() => {
    if (activeTab === 'new' && step === 1 && hasRelatedOrder && recentOrders.length === 0) {
      const fetchOrders = async () => {
        try {
           const freeQ = query(collection(db, 'orders'), where('studentId', '==', currentUser.uid));
           const paidQ = query(collection(db, 'paidOrders'), where('studentId', '==', currentUser.uid));
           const [freeSnap, paidSnap] = await Promise.all([getDocs(freeQ), getDocs(paidQ)]);
           
           let combined = [
             ...freeSnap.docs.map(d => ({id: d.id, ...d.data(), source: 'Free'})),
             ...paidSnap.docs.map(d => ({id: d.id, ...d.data(), source: 'Paid'}))
           ];
           // Sort descending memory side
           combined.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
           setRecentOrders(combined.slice(0, 10)); // keep last 10
        } catch(e) {
           console.error("Failed to fetch recent orders:", e);
        }
      };
      fetchOrders();
    }
  }, [activeTab, step, hasRelatedOrder, currentUser, recentOrders.length]);

  // Fetch staff list for linking
  useEffect(() => {
    if (activeTab === 'new' && step === 1 && hasAgainstStaff) {
      const fetchStaff = async () => {
        try {
          const q = query(collection(db, 'users'), where('role', '==', againstStaffRole));
          const snap = await getDocs(q);
          setStaffList(snap.docs.map(d => ({id: d.id, ...d.data()})));
        } catch (e) {
          console.error("Failed to fetch staff:", e);
        }
      };
      fetchStaff();
    }
  }, [activeTab, step, hasAgainstStaff, againstStaffRole]);

  // Reset form helper
  const resetForm = () => {
    setStep(0); setType(null); setServiceType('freeLaundry'); setCategory('');
    setHasRelatedOrder(false); setSelectedOrder('');
    setHasAgainstStaff(false); setSelectedStaff('');
    setIsAnonymous(false); setTitle(''); setDescription(''); setRating(0);
    setSuggestedSolution(''); setAttachment(null); setAttachmentPreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      setAttachmentPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (type === 'complaint' && !category) { toast.error('Category is required'); return; }
    if (type === 'feedback' && !rating) { toast.error('Rating is required for feedback'); return; }
    if (title.length < 5 || description.length < 30) { toast.error('Please provide a valid title and detailed description.'); return; }

    setIsSubmitting(true);
    let attachmentUrl = null;

    try {
      if (attachment) {
        const fileRef = storageRef(storage, `complaints/${currentUser.uid}/${Date.now()}_${attachment.name}`);
        await uploadBytes(fileRef, attachment);
        attachmentUrl = await getDownloadURL(fileRef);
      }

      // Automatically determine priority based on business rules
      let priority = 'medium';
      if (type === 'feedback') {
        priority = 'low';
      } else {
        if (category === 'Staff Behavior' || category === 'Damage to Clothes') priority = 'high';
      }

      let parsedOrder = selectedOrder ? JSON.parse(selectedOrder) : null;
      let parsedStaff = selectedStaff ? JSON.parse(selectedStaff) : null;

      const payload = {
        studentId: currentUser.uid,
        studentName: userData.name,
        studentPhone: userData.phone || '',
        studentRoom: userData.roomNo || '',
        hostelBlock: userData.hostelBlock || '',
        
        type,
        category,
        serviceType,
        
        relatedOrderId: parsedOrder ? parsedOrder.id : null,
        relatedTokenId: parsedOrder ? parsedOrder.tokenId : null,
        
        againstStaffId: parsedStaff ? parsedStaff.id : null,
        againstStaffName: parsedStaff ? parsedStaff.name : null,
        againstStaffRole: parsedStaff ? againstStaffRole : null,
        
        title,
        description,
        suggestedSolution: suggestedSolution.trim() || null,
        attachmentUrl,
        rating: type === 'feedback' ? rating : null,
        
        status: 'submitted',
        priority,
        
        staffResponse: '',
        staffRespondedAt: null,
        staffRespondedBy: null,
        
        adminResponse: '',
        adminRespondedAt: null,
        adminRespondedBy: null,
        
        resolvedAt: null,
        resolutionSummary: '',
        studentSatisfied: null,
        
        isEscalated: false,
        escalatedAt: null,
        escalationReason: '',
        
        notificationLog: {
          submissionConfirmed: false, staffNotified: false,
          acknowledgedByStaff: false, resolvedNotified: false, escalationNotified: false
        },
        
        isAnonymous: isAnonymous,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'complaints'), payload);
      
      // Auto-inject first thread message
      await addDoc(collection(db, `complaints/${docRef.id}/thread`), {
        messageId: "sys_msg_1",
        authorId: "system",
        authorName: "System",
        authorRole: "admin",
        message: type === 'complaint' 
          ? "Complaint submitted successfully. The team will review this within 48 hours." 
          : "Thank you for sharing your feedback with us!",
        attachmentUrl: null,
        isInternal: false,
        createdAt: serverTimestamp()
      });

      toast.success(type === 'complaint' ? `Complaint submitted (Ref: ${docRef.id.substring(0,8).toUpperCase()})` : "Feedback submitted successfully!");
      resetForm();
      setActiveTab('list');

    } catch (e) {
      console.error(e);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendering Helper: Step 1 (Details)
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-xl font-bold text-slate-800">What is this about?</h2>
      
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Service Type</label>
        <div className="flex gap-3">
           <button onClick={() => setServiceType('freeLaundry')} className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 ${serviceType === 'freeLaundry' ? (type==='complaint'?'border-red-500 bg-red-50 text-red-700':'border-teal-500 bg-teal-50 text-teal-700') : 'border-slate-200 text-slate-500'}`}>Free Laundry</button>
           <button onClick={() => setServiceType('paidLaundry')} className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 ${serviceType === 'paidLaundry' ? (type==='complaint'?'border-red-500 bg-red-50 text-red-700':'border-teal-500 bg-teal-50 text-teal-700') : 'border-slate-200 text-slate-500'}`}>Paid Laundry</button>
           <button onClick={() => setServiceType('general')} className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 ${serviceType === 'general' ? (type==='complaint'?'border-red-500 bg-red-50 text-red-700':'border-teal-500 bg-teal-50 text-teal-700') : 'border-slate-200 text-slate-500'}`}>General</button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)} className={`w-full p-3 rounded-lg border-2 focus:outline-none ${type === 'complaint' ? 'focus:border-red-500' : 'focus:border-teal-500'}`}>
           <option value="">Select a category...</option>
           {(type === 'complaint' ? COMPLAINT_CATEGORIES : FEEDBACK_CATEGORIES).map(cat => (
             <option key={cat} value={cat}>{cat}</option>
           ))}
        </select>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
         <div className="flex justify-between items-center mb-3">
           <div>
             <label className="font-bold text-slate-800 text-sm">Link to a specific order?</label>
             <p className="text-xs text-slate-500">(Optional but helpful)</p>
           </div>
           <div className="flex bg-slate-200 rounded-full p-1">
             <button onClick={() => {setHasRelatedOrder(true); setSelectedOrder('');}} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${hasRelatedOrder ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Yes</button>
             <button onClick={() => {setHasRelatedOrder(false); setSelectedOrder('');}} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${!hasRelatedOrder ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>No</button>
           </div>
         </div>
         {hasRelatedOrder && (
           <select value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)} className="w-full text-sm p-2 bg-white border border-slate-300 rounded focus:outline-none">
             <option value="">Select an order...</option>
             {recentOrders.map(o => (
               <option key={o.id} value={JSON.stringify({id: o.id, tokenId: o.tokenId})}>
                 [{o.tokenId} | {o.source}] — {o.createdAt ? format(o.createdAt.toDate(), 'dd MMM yyyy') : 'Recent'}
               </option>
             ))}
           </select>
         )}
      </div>

      {type === 'complaint' && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
           <div className="flex justify-between items-center mb-3">
             <div>
               <label className="font-bold text-slate-800 text-sm">Is this about a specific staff member?</label>
               <p className="text-xs text-slate-500">(Optional)</p>
             </div>
             <div className="flex bg-slate-200 rounded-full p-1">
               <button onClick={() => {setHasAgainstStaff(true); setSelectedStaff('');}} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${hasAgainstStaff ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Yes</button>
               <button onClick={() => {setHasAgainstStaff(false); setSelectedStaff('');}} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${!hasAgainstStaff ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>No</button>
             </div>
           </div>
           
           {hasAgainstStaff && (
             <div className="mt-3">
               <div className="flex gap-2 mb-2">
                 <button onClick={() => {setAgainstStaffRole('staff'); setSelectedStaff('');}} className={`flex-1 py-1.5 text-xs font-bold rounded border ${againstStaffRole === 'staff' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}>Free Dhobi</button>
                 <button onClick={() => {setAgainstStaffRole('paidStaff'); setSelectedStaff('');}} className={`flex-1 py-1.5 text-xs font-bold rounded border ${againstStaffRole === 'paidStaff' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-500'}`}>Paid Dhobi</button>
               </div>
               <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} className="w-full text-sm p-2 bg-white border border-slate-300 rounded focus:outline-none">
                 <option value="">Select staff member...</option>
                 {staffList.map(s => (
                   <option key={s.id} value={JSON.stringify({id: s.id, name: s.name})}>{s.name} ({s.hostelBlock})</option>
                 ))}
               </select>
             </div>
           )}
        </div>
      )}

      {type === 'complaint' && (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
           <div>
             <label className="font-bold text-amber-900 text-sm">Submit Anonymously</label>
             <p className="text-xs text-amber-700 mt-0.5">Hidden from staff. Admin can still trace details.</p>
           </div>
           <button 
             onClick={() => setIsAnonymous(!isAnonymous)}
             className={`w-12 h-6 rounded-full p-1 transition-colors relative ${isAnonymous ? 'bg-amber-500' : 'bg-slate-300'}`}
           >
             <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-0'}`} />
           </button>
        </div>
      )}

      <button 
        onClick={() => setStep(2)}
        disabled={!category}
        className={`w-full py-3 rounded-xl font-bold text-white transition-opacity ${!category ? 'opacity-50 cursor-not-allowed' : ''} ${type === 'complaint' ? 'bg-red-600' : 'bg-teal-600'}`}
      >
        Next
      </button>
    </div>
  );

  // Rendering Helper: Step 2 (Describe)
  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-xl font-bold text-slate-800">Tell us more</h2>
      
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Give your submission a short title</label>
        <input 
          type="text" 
          value={title}
          onChange={e => setTitle(e.target.value.substring(0, 80))}
          placeholder={type === 'complaint' ? 'e.g. Staff was rude during collection' : 'e.g. Suggestion to add Sunday pickup slot'}
          className={`w-full p-3 rounded-lg border-2 focus:outline-none ${type === 'complaint' ? 'focus:border-red-500' : 'focus:border-teal-500'}`}
        />
        <p className="text-right text-xs text-slate-400 mt-1">{title.length} / 80</p>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Describe in detail</label>
        <textarea 
          value={description}
          onChange={e => setDescription(e.target.value.substring(0, 1000))}
          placeholder="Be as specific as possible — include dates, times, and exactly what happened."
          className={`w-full p-3 rounded-lg border-2 focus:outline-none h-32 resize-none ${type === 'complaint' ? 'focus:border-red-500' : 'focus:border-teal-500'}`}
        />
        <p className="text-right text-xs text-slate-400 mt-1">{description.length} / 1000 (Min. 30 chars)</p>
      </div>

      {type === 'feedback' && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
           <label className="block text-sm font-bold text-slate-700 mb-3">How would you rate your overall experience?</label>
           <div className="flex justify-center">
             <StarRating rating={rating} onChange={setRating} />
           </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Do you have a solution in mind? <span className="text-slate-400 font-normal">(Optional)</span></label>
        <textarea 
          value={suggestedSolution}
          onChange={e => setSuggestedSolution(e.target.value.substring(0, 500))}
          placeholder="e.g. Send a reminder WhatsApp 1 hour before pickup closes."
          className={`w-full p-3 rounded-lg border-2 focus:outline-none h-20 resize-none ${type === 'complaint' ? 'focus:border-red-500' : 'focus:border-teal-500'}`}
        />
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold bg-slate-200 text-slate-700">Back</button>
        <button 
          onClick={() => setStep(3)}
          disabled={title.length < 5 || description.length < 30 || (type === 'feedback' && !rating)}
          className={`flex-[2] py-3 rounded-xl font-bold text-white transition-opacity ${title.length < 5 || description.length < 30 || (type === 'feedback' && !rating) ? 'opacity-50 cursor-not-allowed' : ''} ${type === 'complaint' ? 'bg-red-600' : 'bg-teal-600'}`}
        >
          Next
        </button>
      </div>
    </div>
  );

  // Rendering Helper: Step 3 (Review & Submit)
  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-xl font-bold text-slate-800">Add a photo <span className="text-slate-400 font-normal">(Optional)</span></h2>
      
      <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center relative bg-slate-50 ${type === 'complaint' ? 'border-red-300' : 'border-teal-300'}`}>
         {attachmentPreview ? (
           <div className="relative w-full aspect-video">
             <img src={attachmentPreview} alt="Preview" className="w-full h-full object-contain bg-black/5 rounded-lg" />
             <button onClick={() => {setAttachment(null); setAttachmentPreview(null);}} className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1.5 shadow-lg">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
           </div>
         ) : (
           <>
             <span className="text-4xl mb-2">📸</span>
             <p className="text-sm font-bold text-slate-600">Tap to upload a photo</p>
             <p className="text-xs text-slate-400 mt-1">JPEG, PNG only (Max 2MB)</p>
             <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
           </>
         )}
      </div>

      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
         <h4 className="font-bold border-b border-slate-200 pb-2 mb-3 text-sm text-slate-800 uppercase tracking-wider">Review Summary</h4>
         
         <div className="grid grid-cols-2 gap-4 mb-4">
           <div><p className="text-[10px] uppercase font-bold text-slate-500">Service</p><p className="text-sm font-medium">{serviceType}</p></div>
           <div><p className="text-[10px] uppercase font-bold text-slate-500">Category</p><p className="text-sm font-medium">{category}</p></div>
         </div>
         
         {type === 'feedback' && rating > 0 && (
           <div className="mb-4">
               <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Your Rating</p>
               <StarRating rating={rating} readOnly size="small" />
           </div>
         )}
         
         <h3 className="font-bold text-slate-800 mb-1">{title}</h3>
         <p className="text-xs text-slate-600 italic">"{description.length > 80 ? description.substring(0, 80) + '...' : description}"</p>

         {isAnonymous && type === 'complaint' && (
           <div className="mt-4 bg-amber-100 text-amber-800 font-bold p-2 text-xs rounded border border-amber-300">
             ⚠️ You are submitting anonymously. Admin can still trace details.
           </div>
         )}
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep(2)} className="flex-[1] py-3 rounded-xl font-bold bg-slate-200 text-slate-700 disabled:opacity-50" disabled={isSubmitting}>Back</button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`flex-[2] py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-opacity ${isSubmitting ? 'opacity-70 cursor-wait' : ''} ${type === 'complaint' ? 'bg-red-600' : 'bg-teal-600'}`}
        >
          {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
          {isSubmitting ? 'Submitting...' : type === 'complaint' ? 'Submit Complaint' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );

  const filteredSubmissions = filter === 'All' 
    ? submissions 
    : filter === 'Complaints' 
      ? submissions.filter(s => s.type === 'complaint')
      : filter === 'Feedback'
        ? submissions.filter(s => s.type === 'feedback')
        : filter === 'Open'
          ? submissions.filter(s => !['closed', 'resolvedByStaff', 'resolvedByAdmin'].includes(s.status))
          : filter === 'Resolved'
            ? submissions.filter(s => ['closed', 'resolvedByStaff', 'resolvedByAdmin'].includes(s.status))
            : submissions;

  return (
    <div className="bg-slate-50 min-h-screen flex justify-center w-full">
      <div className="w-full max-w-[420px] bg-white min-h-screen shadow-lg relative pb-20 flex flex-col">
        
        {/* Header Options */}
        <div className="pt-6 pb-2 px-6 bg-white shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Feedback Center</h1>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button 
               onClick={() => { setActiveTab('list'); resetForm(); }}
               className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'list' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
             >
               My Submissions
             </button>
             <button 
               onClick={() => setActiveTab('new')}
               className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'new' ? 'bg-white shadow text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
             >
               New Submission
             </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
          
          {activeTab === 'list' && (
             <div className="animate-fade-in-up">
               {/* Filters */}
               <div className="flex overflow-x-auto gap-2 pb-2 mb-4 snap-x hide-scrollbar">
                 {['All', 'Complaints', 'Feedback', 'Open', 'Resolved'].map(f => (
                   <button 
                     key={f} 
                     onClick={() => setFilter(f)} 
                     className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-colors snap-start ${filter === f ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                   >
                     {f}
                   </button>
                 ))}
               </div>

               {submissionsLoading ? (
                 <Loader /> 
               ) : filteredSubmissions.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl">📭</div>
                    <h3 className="font-bold text-slate-700">No submissions found.</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-[200px]">We value your feedback. Use the other tab to file a report or give feedback.</p>
                 </div>
               ) : (
                 <div className="pb-10">
                   {filteredSubmissions.map(sub => <SubmissionCard key={sub.id} submission={sub} />)}
                 </div>
               )}
             </div>
          )}

          {activeTab === 'new' && (
             <div className="pb-6">
                
                {/* Step Indicator */}
                {step > 0 && (
                  <div className="flex items-center justify-center mb-8 gap-2">
                    {[1,2,3].map(st => (
                      <div key={st} className="flex flex-col items-center flex-1">
                        <div className={`h-1.5 w-full rounded-full transition-colors ${st <= step ? (type==='complaint'?'bg-red-500':'bg-teal-500') : 'bg-slate-200'}`}></div>
                        <span className={`text-[10px] uppercase font-bold mt-2 ${st <= step ? (type==='complaint'?'text-red-600':'text-teal-600') : 'text-slate-400'}`}>
                           {st === 1 ? 'Details' : st === 2 ? 'Description' : 'Submit'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {step === 0 && (
                  <div className="animate-fade-in-up">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">How can we help?</h2>
                    <TypeSelector selectedType={type} onSelect={t => setType(t)} />
                    <button 
                      onClick={() => setStep(1)}
                      disabled={!type}
                      className={`w-full mt-6 py-3 rounded-xl font-bold text-white transition-opacity delay-75 ${!type ? 'opacity-50 cursor-not-allowed bg-slate-400' : type === 'complaint' ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                    >
                      Continue
                    </button>
                  </div>
                )}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

             </div>
          )}

        </div>

        {/* Existing Student Bottom Nav - Need to align with existing style exactly */}
        <div className="absolute bottom-0 w-full bg-white border-t border-slate-200 px-4 py-3 flex justify-between items-center z-20 pb-safe">
          <Link to="/student/dashboard" className="flex flex-col items-center text-slate-400 hover:text-teal-600 transition-colors">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
             <span className="text-[10px] font-medium mt-1">Home</span>
          </Link>
          <Link to="/student/qr" className="flex flex-col items-center text-slate-400 hover:text-teal-600 transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
             <span className="text-[10px] font-medium mt-1">QR Code</span>
          </Link>
          <Link to="/student/history" className="flex flex-col items-center text-slate-400 hover:text-teal-600 transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             <span className="text-[10px] font-medium mt-1">History</span>
          </Link>
          <Link to="/student/lost-and-found" className="flex flex-col items-center text-slate-400 hover:text-teal-600 transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
             <span className="text-[10px] font-medium mt-1">Lost & Found</span>
          </Link>
          <Link to="/student/feedback" className="flex flex-col items-center text-teal-600">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"></path></svg>
             <span className="text-[10px] font-medium mt-1">Feedback</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default FeedbackPage;
