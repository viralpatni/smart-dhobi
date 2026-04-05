import React, { useState } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatStandardDate } from '../../utils/formatDate';
import { sendNotification } from '../../utils/sendNotification';
import LostItemTimeline from './LostItemTimeline';
import toast from 'react-hot-toast';

const statusConfig = {
  open:        { label: 'Open', color: 'bg-red-100 text-red-800 border-red-200' },
  underReview: { label: 'Under Review', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  found:       { label: 'Found', color: 'bg-green-100 text-green-800 border-green-200' },
  notFound:    { label: 'Not Found', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  closed:      { label: 'Closed', color: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const priorityConfig = {
  low:    { label: 'Low', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  high:   { label: 'High', color: 'bg-red-100 text-red-700 border-red-200' },
};

const colorSwatches = {
  White: '#FFFFFF', Black: '#000000', Gray: '#6B7280', Red: '#EF4444',
  Blue: '#3B82F6', Green: '#22C55E', Yellow: '#EAB308', Pink: '#EC4899',
  Brown: '#92400E', Navy: '#1E3A5A'
};

const StaffComplaintCard = ({ complaint, dhobiName }) => {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  // Found modal
  const [showFoundModal, setShowFoundModal] = useState(false);
  const [foundLocation, setFoundLocation] = useState('');
  const [foundMessage, setFoundMessage] = useState('Good news! We found your item.');

  // Not Found modal
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [notFoundNote, setNotFoundNote] = useState('');

  const shortId = complaint.id ? complaint.id.substring(0, 8).toUpperCase() : '';
  const sConfig = statusConfig[complaint.status] || statusConfig.open;
  const pConfig = priorityConfig[complaint.priority] || priorityConfig.medium;
  const useMock = import.meta.env.VITE_USE_MOCK_NOTIFICATIONS === 'true';

  const updateComplaint = async (updates, timelineEvent) => {
    try {
      const ref = doc(db, 'lostAndFound', complaint.id);
      await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });

      if (timelineEvent) {
        await addDoc(collection(db, 'lostAndFound', complaint.id, 'timeline'), {
          ...timelineEvent,
          timestamp: serverTimestamp()
        });
      }
      return true;
    } catch (err) {
      console.error('Error updating complaint:', err);
      toast.error('Failed to update complaint.');
      return false;
    }
  };

  const handleStartReview = async () => {
    setActionLoading('review');
    const ok = await updateComplaint(
      { status: 'underReview' },
      { event: 'Status changed to Under Review', by: dhobiName || 'Staff', note: 'Staff has started investigating.' }
    );
    if (ok) {
      const msg = `Your lost item complaint (${shortId}) is now under review. We are checking for your ${complaint.itemType}. — SmartDhobi`;
      if (useMock) {
        console.log('[Mock WhatsApp → Student]:', msg);
        toast(msg, { duration: 5000, icon: '🔍' });
      } else {
        await sendNotification(complaint.studentId, msg);
      }
      toast.success('Moved to Under Review');
    }
    setActionLoading('');
  };

  const handleSetPriority = async (priority) => {
    await updateComplaint(
      { priority },
      { event: `Priority set to ${priority}`, by: dhobiName || 'Staff', note: '' }
    );
  };

  const handleSaveNote = async () => {
    if (!noteInput.trim()) return;
    setSavingNote(true);
    const ok = await updateComplaint(
      { staffNotes: noteInput },
      { event: 'Staff note added', by: dhobiName || 'Staff', note: noteInput }
    );
    if (ok) {
      setNoteInput('');
      toast.success('Note saved');
    }
    setSavingNote(false);
  };

  const handleConfirmFound = async () => {
    if (!foundLocation.trim()) { toast.error('Enter location'); return; }
    setActionLoading('found');
    const ok = await updateComplaint(
      {
        status: 'found',
        foundLocation,
        resolutionNote: foundMessage,
        resolvedAt: serverTimestamp(),
        'notificationLog.itemFound': true
      },
      { event: `Item found at ${foundLocation}`, by: dhobiName || 'Staff', note: foundMessage }
    );
    if (ok) {
      const msg = `Great news! Your missing ${complaint.itemType} has been found at ${foundLocation}. Please collect it at the laundry counter. — SmartDhobi`;
      if (useMock) {
        console.log('[Mock WhatsApp → Student]:', msg);
        toast(msg, { duration: 6000, icon: '🎉' });
      } else {
        await sendNotification(complaint.studentId, msg);
      }
      toast.success('Marked as Found!');
      setShowFoundModal(false);
    }
    setActionLoading('');
  };

  const handleConfirmNotFound = async () => {
    setActionLoading('notFound');
    const ok = await updateComplaint(
      {
        status: 'notFound',
        resolutionNote: notFoundNote || 'Item could not be located after thorough search.'
      },
      { event: 'Item marked as Not Found', by: dhobiName || 'Staff', note: notFoundNote }
    );
    if (ok) {
      const msg = `We searched thoroughly but could not locate your ${complaint.itemType}. Please visit the laundry office to discuss further. — SmartDhobi`;
      if (useMock) {
        console.log('[Mock WhatsApp → Student]:', msg);
        toast(msg, { duration: 6000, icon: '😔' });
      } else {
        await sendNotification(complaint.studentId, msg);
      }
      toast.success('Marked as Not Found');
      setShowNotFoundModal(false);
    }
    setActionLoading('');
  };

  const handleCloseComplaint = async () => {
    setActionLoading('close');
    await updateComplaint(
      { status: 'closed' },
      { event: 'Complaint closed by staff', by: dhobiName || 'Staff', note: 'Complaint resolved and closed.' }
    );
    toast.success('Complaint closed');
    setActionLoading('');
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 relative overflow-hidden">
        {/* Left accent */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          complaint.status === 'open' ? 'bg-red-400' :
          complaint.status === 'underReview' ? 'bg-amber-400' :
          complaint.status === 'found' ? 'bg-emerald-400' : 'bg-slate-300'
        }`}></div>

        {/* Header Row */}
        <div className="flex items-start justify-between mb-3 pl-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">{shortId}</span>
              <span className="text-sm font-semibold text-slate-800">{complaint.studentName}</span>
              <span className="text-xs text-slate-500">{complaint.studentRoom}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="font-mono">{complaint.relatedTokenId}</span>
              <span>•</span>
              <span>{complaint.createdAt ? formatStandardDate(complaint.createdAt) : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${pConfig.color}`}>
              {pConfig.label}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${sConfig.color}`}>
              {sConfig.label}
            </span>
          </div>
        </div>

        {/* Item details row */}
        <div className="flex items-center gap-3 mb-3 pl-2">
          <div
            className="w-6 h-6 rounded-full border border-slate-200 shrink-0"
            style={{ backgroundColor: colorSwatches[complaint.itemColor] || '#94A3B8' }}
          ></div>
          <span className="text-sm font-medium text-slate-700">
            {complaint.itemColor} {complaint.itemType}
            {complaint.quantity > 1 && ` ×${complaint.quantity}`}
          </span>
          {complaint.itemDescription && (
            <span className="text-xs text-slate-500 truncate flex-1">{complaint.itemDescription}</span>
          )}
        </div>

        {/* Staff notes preview */}
        {complaint.staffNotes && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 mb-3 ml-2 text-xs text-amber-800">
            <strong>Staff Note:</strong> {complaint.staffNotes}
          </div>
        )}

        {/* Found info */}
        {complaint.status === 'found' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mb-3 ml-2 text-xs text-emerald-800">
            <p><strong>Found at:</strong> {complaint.foundLocation}</p>
            {complaint.resolutionNote && <p className="mt-0.5">{complaint.resolutionNote}</p>}
          </div>
        )}

        {/* STAFF ACTIONS */}
        <div className="border-t border-slate-100 pt-3 mt-3 pl-2 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">

            {complaint.status === 'open' && (
              <>
                <button
                  onClick={handleStartReview}
                  disabled={actionLoading === 'review'}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {actionLoading === 'review' ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : '🔍'} Start Review
                </button>
                <select
                  value={complaint.priority}
                  onChange={(e) => handleSetPriority(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </>
            )}

            {complaint.status === 'underReview' && (
              <>
                <button
                  onClick={() => setShowFoundModal(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  ✅ Mark as Found
                </button>
                <button
                  onClick={() => setShowNotFoundModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  ❌ Not Found
                </button>
              </>
            )}

            {complaint.status === 'found' && (
              <button
                onClick={handleCloseComplaint}
                disabled={actionLoading === 'close'}
                className="bg-slate-500 hover:bg-slate-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Close Complaint
              </button>
            )}

            {/* View photo */}
            {complaint.itemPhoto && (
              <button
                onClick={() => setShowPhoto(!showPhoto)}
                className="text-xs font-medium text-teal-600 hover:text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                📷 View Photo
              </button>
            )}
          </div>

          {/* Photo lightbox */}
          {showPhoto && complaint.itemPhoto && (
            <div className="mt-2 rounded-xl overflow-hidden border border-slate-200">
              <img src={complaint.itemPhoto} alt="Item" className="w-full max-h-64 object-contain bg-slate-50" />
            </div>
          )}

          {/* Inline note input */}
          {(complaint.status === 'open' || complaint.status === 'underReview') && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Add staff note..."
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote || !noteInput.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
              >
                {savingNote ? '...' : 'Save'}
              </button>
            </div>
          )}

          {/* Timeline toggle */}
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors mt-1"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${showTimeline ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
            {showTimeline ? 'Hide Timeline' : 'View Timeline'}
          </button>

          {showTimeline && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <LostItemTimeline complaintId={complaint.id} />
            </div>
          )}
        </div>
      </div>

      {/* FOUND MODAL */}
      {showFoundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFoundModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">✅</span>
              Mark Item as Found
            </h3>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Where was the item found?</label>
            <input
              type="text"
              value={foundLocation}
              onChange={(e) => setFoundLocation(e.target.value)}
              placeholder="e.g. Rack 7, Sorting pile area"
              className="border border-slate-200 rounded-lg px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm mb-3"
            />
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Message to student</label>
            <textarea
              value={foundMessage}
              onChange={(e) => setFoundMessage(e.target.value)}
              rows={2}
              className="border border-slate-200 rounded-lg px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm resize-none mb-4"
            ></textarea>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFoundModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFound}
                disabled={actionLoading === 'found'}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === 'found' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Confirm Found'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOT FOUND MODAL */}
      {showNotFoundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNotFoundModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">❌</span>
              Mark as Not Found
            </h3>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Note to student</label>
            <textarea
              value={notFoundNote}
              onChange={(e) => setNotFoundNote(e.target.value)}
              rows={3}
              placeholder="Explain what was checked..."
              className="border border-slate-200 rounded-lg px-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm resize-none mb-4"
            ></textarea>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNotFoundModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNotFound}
                disabled={actionLoading === 'notFound'}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === 'notFound' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Confirm Not Found'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffComplaintCard;
