import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AnalyticsPanel = ({ analytics }) => {
  if (!analytics) return null;

  const pending = analytics.totalDropOffs - analytics.totalCollected;
  
  // Format data for chart
  const data = Object.keys(analytics.hourlyDropOffs).map(hour => ({
    name: `${hour}:00`,
    dropOffs: analytics.hourlyDropOffs[hour]
  }));

  // Find max for highlighting
  const maxDropOffs = Math.max(...data.map(d => d.dropOffs));

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
        <h3 className="font-bold text-gray-800 mb-6">Drop-off Activity Today (Hourly)</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip 
                cursor={{ fill: '#F1F5F9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="dropOffs" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.dropOffs === maxDropOffs && maxDropOffs > 0 ? '#F59E0B' : '#0D9488'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
