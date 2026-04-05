import React from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0D9488', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6'];

const AnalyticsPanel = ({ analytics, activeOrders = [] }) => {
  if (!analytics) return null;

  const pending = analytics.totalDropOffs - analytics.totalCollected;
  
  // Daily calculation for mainly 3 categories
  const processingCount = activeOrders.filter(o => ['onTheWay', 'droppedOff', 'washing'].includes(o.status)).length;
  const washedCount = activeOrders.filter(o => o.status === 'readyInRack').length;
  const collectedCount = analytics.totalCollected || 0;

  const rawData = [
    { name: 'Total Drop-offs', value: processingCount },
    { name: 'Total Washed', value: washedCount },
    { name: 'Total Washed and Collected', value: collectedCount }
  ];
  
  const data = rawData.filter(d => d.value > 0);
  
  const trendData = [
    { name: 'Start of Day', dropoffs: 0, washed: 0, collected: 0 },
    { name: 'Current', dropoffs: processingCount, washed: washedCount, collected: collectedCount }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm mb-1">Today's Drop-offs</p>
              <h3 className="text-3xl font-bold text-teal-600">{analytics.totalDropOffs}</h3>
            </div>
            <div className="p-2 bg-teal-50 rounded-lg text-teal-600">🧺</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm mb-1">Collected</p>
              <h3 className="text-3xl font-bold text-green-600">{analytics.totalCollected}</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">✅</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm mb-1">Pending (Active)</p>
              <h3 className="text-3xl font-bold text-amber-500">{pending}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-500">⏳</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm mb-1">Missing Reports</p>
              <h3 className="text-3xl font-bold text-red-500">{analytics.totalMissingReports}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-500">⚠️</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-6">Daily Order Distribution</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
        <h3 className="font-bold text-gray-800 mb-6">Process Trends (Line Chart)</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="dropoffs" name="Drop-offs" stroke="#0D9488" strokeWidth={3} dot={{r: 6, strokeWidth: 2}} activeDot={{r: 8}} />
              <Line type="monotone" dataKey="washed" name="Clothes Washed" stroke="#EAB308" strokeWidth={3} dot={{r: 6, strokeWidth: 2}} activeDot={{r: 8}} />
              <Line type="monotone" dataKey="collected" name="Washed & Collected" stroke="#F97316" strokeWidth={3} dot={{r: 6, strokeWidth: 2}} activeDot={{r: 8}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
