import React, { useState, useEffect } from 'react';
import { getComplaintTimeline } from '../../hooks/useLostAndFound';
import { formatStandardDate } from '../../utils/formatDate';

const LostItemTimeline = ({ complaintId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!complaintId) return;
    const fetch = async () => {
      try {
        const data = await getComplaintTimeline(complaintId);
        setEvents(data);
      } catch (err) {
        console.error('Error loading timeline:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [complaintId]);

  const getDotColor = (by, event) => {
    if (event?.toLowerCase().includes('found')) return 'bg-emerald-500';
    if (by === 'student') return 'bg-teal-500';
    return 'bg-amber-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-3">No timeline events yet.</p>
    );
  }

  return (
    <div className="relative pl-6 space-y-4 py-2">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-200"></div>

      {events.map((ev, idx) => (
        <div key={ev.id || idx} className="relative flex items-start gap-3">
          {/* Dot */}
          <div className={`absolute left-[-24px] top-1 w-3 h-3 rounded-full ring-2 ring-white ${getDotColor(ev.by, ev.event)}`}></div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800">{ev.event}</p>
            {ev.note && (
              <p className="text-xs text-slate-500 mt-0.5">{ev.note}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              {ev.timestamp ? formatStandardDate(ev.timestamp) : ''}
              {ev.by && <span className="ml-2 text-slate-300">• {ev.by}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LostItemTimeline;
