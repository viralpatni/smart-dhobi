import React from 'react';

const statusConfig = {
  onTheWay: { label: 'On The Way', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  droppedOff: { label: 'Dropped Off', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  washing: { label: 'Washing', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  readyInRack: { label: 'Ready in Rack', color: 'bg-green-100 text-green-800 border-green-200' },
  collected: { label: 'Collected', color: 'bg-slate-100 text-slate-600 border-slate-200' }
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
