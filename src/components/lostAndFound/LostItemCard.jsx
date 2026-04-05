import React, { useState } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatStandardDate } from '../../utils/formatDate';
import LostItemTimeline from './LostItemTimeline';
import toast from 'react-hot-toast';

const statusConfig = {
  open:        { label: 'Open — Awaiting Review', color: 'bg-red-100 text-red-800 border-red-200' },
  underReview: { label: 'Under Review', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  found:       { label: 'Item Located!', color: 'bg-green-100 text-green-800 border-green-200' },
  notFound:    { label: 'Not Found', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  closed:      { label: 'Closed', color: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const colorSwatches = {
  White: '#FFFFFF', Black: '#000000', Gray: '#6B7280', Red: '#EF4444',
  Blue: '#3B82F6', Green: '#22C55E', Yellow: '#EAB308', Pink: '#EC4899',
  Brown: '#92400E', Navy: '#1E3A5A'
};

const LostItemCard = ({ complaint, currentUserId }) => {
  const [showTimeline, setShowTimeline] = useState(false);
  const [collecting, setCollecting] = useState(false);

  const shortId = complaint.id ? complaint.id.substring(0, 8).toUpperCase() : '';
  const config = statusConfig[complaint.status] || statusConfig.open;

  const handleMarkCollected = async () => {
    setCollecting(true);
    try {
      const ref = doc(db, 'lostAndFound', complaint.id);
      await updateDoc(ref, {
        status: 'closed',
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'lostAndFound', complaint.id, 'timeline'), {
        event: 'Student confirmed collection',
        by: 'student',
        note: 'Item picked up from laundry counter.',
        timestamp: serverTimestamp()
      });

      toast.success('Marked as collected!');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 relative overflow-hidden">
      {/* Left accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        complaint.status === 'found' ? 'bg-emerald-400' : 
        complaint.status === 'open' ? 'bg-red-400' : 
        complaint.status === 'underReview' ? 'bg-amber-400' : 'bg-slate-300'
      }`}></div>

      <div className="pl-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* Color swatch */}
              <div
                className="w-5 h-5 rounded-full border border-slate-200 shrink-0"
                style={{ backgroundColor: colorSwatches[complaint.itemColor] || '#94A3B8' }}
              ></div>
              <h3 className="font-semibold text-slate-800">
                {complaint.itemColor} {complaint.itemType}
                {complaint.quantity > 1 && <span className="text-slate-500 text-sm ml-1">×{complaint.quantity}</span>}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{complaint.relatedTokenId}</span>
              <span>•</span>
              <span>{complaint.createdAt ? formatStandardDate(complaint.createdAt) : ''}</span>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
            {config.label}
          </span>
        </div>

        {/* Complaint ID */}
        <p className="text-[11px] text-slate-400 mb-2">Complaint ID: <span className="font-mono font-medium">{shortId}</span></p>

        {/* Description snippet */}
        {complaint.itemDescription && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{complaint.itemDescription}</p>
        )}

        {/* Found success banner */}
        {complaint.status === 'found' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">🎉</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">Your item has been found!</p>
                {complaint.foundLocation && (
                  <p className="text-xs text-emerald-700 mt-0.5">Location: {complaint.foundLocation}</p>
                )}
                {complaint.resolutionNote && (
                  <p className="text-xs text-emerald-600 mt-0.5">{complaint.resolutionNote}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleMarkCollected}
              disabled={collecting}
              className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {collecting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Mark as Collected
                </>
              )}
            </button>
          </div>
        )}

        {/* Not found message */}
        {complaint.status === 'notFound' && complaint.resolutionNote && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
            <p className="text-xs text-slate-600">{complaint.resolutionNote}</p>
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
          <div className="mt-3 pt-3 border-t border-slate-100">
            <LostItemTimeline complaintId={complaint.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LostItemCard;
