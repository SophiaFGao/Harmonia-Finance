import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { AssetAllocation } from '../types';
import { ASSET_LABELS } from '../constants';

interface AllocationChartProps {
  current: AssetAllocation;
  desired: AssetAllocation;
}

const getShortLabel = (key: string, label: string) => {
  switch(key) {
    case 'fixedIncome': return 'Fixed Inc';
    case 'mutualFunds': return 'Funds/ETF';
    case 'stocks': return 'Stocks';
    case 'cash': return 'Cash';
    case 'crypto': return 'Crypto';
    case 'other': return 'RE/Other';
    default: return label.split(' ')[0];
  }
};

const AllocationChart: React.FC<AllocationChartProps> = ({ current, desired }) => {
  // Use keys from ASSET_LABELS to ensure consistent order and all categories are present
  const data = (Object.keys(ASSET_LABELS) as Array<keyof AssetAllocation>).map((key) => {
    return {
      name: getShortLabel(key, ASSET_LABELS[key]),
      fullName: ASSET_LABELS[key],
      Current: current[key] || 0,
      Desired: desired[key] || 0,
      key: key
    };
  });

  return (
    <div className="w-full h-80 bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">Allocation Gap Analysis (%)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: -20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={11} 
            interval={0} 
            tickMargin={8}
          />
          <YAxis stroke="#94a3b8" fontSize={11} />
          <Tooltip 
            cursor={{fill: '#334155', opacity: 0.4}}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
            itemStyle={{ color: '#e2e8f0' }}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return payload[0].payload.fullName;
              }
              return label;
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Bar dataKey="Current" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
          <Bar dataKey="Desired" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AllocationChart;