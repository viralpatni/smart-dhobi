import React from 'react';
import OrderCard from './OrderCard';
import RackAssignModal from './RackAssignModal';

const KanbanBoard = ({ orders }) => {
  const [selectedOrderForRack, setSelectedOrderForRack] = React.useState(null);

  const columns = [
    {
      id: 'incoming',
      title: 'Incoming',
      colors: 'bg-slate-50 border-t-amber-500',
      headerColors: 'text-amber-800 bg-amber-100',
      filter: (o) => ['onTheWay', 'droppedOff'].includes(o.status),
    },
    {
      id: 'washing',
      title: 'In Progress',
      colors: 'bg-slate-50 border-t-teal-500',
      headerColors: 'text-teal-800 bg-teal-100',
      filter: (o) => o.status === 'washing',
    },
    {
      id: 'ready',
      title: 'Ready / Done',
      colors: 'bg-slate-50 border-t-green-500',
      headerColors: 'text-green-800 bg-green-100',
      filter: (o) => ['readyInRack', 'collected'].includes(o.status),
    }
  ];

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 w-full h-full overflow-x-auto pb-4">
        {columns.map(col => {
          const colOrders = orders.filter(col.filter);
          
          return (
            <div key={col.id} className={`flex-1 min-w-[300px] border-t-4 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-160px)] ${col.colors}`}>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-lg">
                <h3 className="font-bold text-gray-800">{col.title}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${col.headerColors}`}>
                  {colOrders.length}
                </span>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                {colOrders.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-lg">
                    No orders here
                  </div>
                ) : (
                  colOrders.map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onAssignRack={(order) => setSelectedOrderForRack(order)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <RackAssignModal 
        isOpen={selectedOrderForRack !== null}
        onClose={() => setSelectedOrderForRack(null)}
        order={selectedOrderForRack}
      />
    </>
  );
};

export default KanbanBoard;
