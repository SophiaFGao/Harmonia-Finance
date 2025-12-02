import React from 'react';
import { UserPortfolio } from '../types';
import AllocationChart from './AllocationChart';
import ChatWidget from './ChatWidget';

interface AnalysisViewProps {
  portfolio: UserPortfolio;
  analysis: string;
  onReset: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ portfolio, analysis, onReset }) => {
  
  // Custom Markdown Table Renderer
  const renderTable = (rows: string[], keyPrefix: number) => {
    if (rows.length < 2) return null;

    // Filter out delimiter row (e.g. |---|---|)
    const dataRows = rows.filter(row => !row.includes('---'));
    if (dataRows.length === 0) return null;

    const parseRow = (row: string) => {
      return row.split('|')
        .map(cell => cell.trim())
        .filter((cell, index, array) => index !== 0 && index !== array.length - 1); // remove leading/trailing empty strings from split
    };

    const headers = parseRow(dataRows[0]);
    const bodyRows = dataRows.slice(1).map(parseRow);

    return (
      <div key={`table-${keyPrefix}`} className="overflow-x-auto my-6 rounded-lg border border-slate-700 shadow-xl">
        <table className="min-w-full divide-y divide-slate-700 bg-slate-800">
          <thead className="bg-slate-700/50">
            <tr>
              {headers.map((header, i) => (
                <th key={i} className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {bodyRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'}>
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-4 text-sm text-slate-300 whitespace-pre-wrap">
                    {/* Check if cell contains bold text for simple formatting */}
                    {cell.includes('**') ? (
                      <span dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Improved text formatter that handles blocks
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let inTable = false;

    const flushTable = (index: number) => {
      if (tableBuffer.length > 0) {
        elements.push(renderTable(tableBuffer, index));
        tableBuffer = [];
        inTable = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Table Detection
      if (trimmedLine.startsWith('|')) {
        inTable = true;
        tableBuffer.push(trimmedLine);
        continue;
      } else if (inTable) {
        flushTable(i);
      }

      // H1
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mt-10 mb-6 border-b border-slate-700 pb-3">
            {line.replace('# ', '')}
          </h1>
        );
        continue;
      }
      // H2
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-xl font-bold text-indigo-300 mt-8 mb-4 flex items-center">
            {line.replace('## ', '')}
          </h2>
        );
        continue;
      }
      // Bold List Item
      if (trimmedLine.startsWith('- **')) {
        const content = trimmedLine.replace('- ', '');
        const parts = content.split('**');
        elements.push(
          <li key={i} className="ml-4 mb-3 text-slate-300 list-disc list-outside pl-2">
            <span className="font-bold text-slate-100">{parts[1]}</span>
            {parts[2]}
          </li>
        );
        continue;
      }
      // Regular List Item
      if (trimmedLine.startsWith('- ')) {
        elements.push(
          <li key={i} className="ml-4 mb-2 text-slate-300 list-disc list-outside pl-2">
            {trimmedLine.replace('- ', '')}
          </li>
        );
        continue;
      }
      // Disclaimer
      if (line.toLowerCase().includes('disclaimer')) {
        elements.push(
          <p key={i} className="text-xs text-slate-500 mt-12 italic border-t border-slate-800 pt-6">
            {line}
          </p>
        );
        continue;
      }
      // Empty line
      if (trimmedLine === '') {
        elements.push(<div key={i} className="h-2"></div>);
        continue;
      }
      // Default paragraph with bold support
      elements.push(
        <p key={i} className="text-slate-300 mb-2 leading-relaxed">
          {line.split('**').map((part, idx) => 
            idx % 2 === 1 ? <strong key={idx} className="text-slate-100">{part}</strong> : part
          )}
        </p>
      );
    }
    
    // Final flush if text ends with table
    flushTable(lines.length);

    return elements;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
            <button 
                onClick={onReset}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-700 hover:border-slate-600"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Edit Inputs</span>
            </button>
            <h2 className="text-2xl font-bold text-white hidden sm:block">Analysis Report</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chart */}
        <div className="lg:col-span-1 space-y-6">
          <AllocationChart 
            current={portfolio.currentAllocation} 
            desired={portfolio.desiredAllocation} 
          />
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Portfolio Context</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Value</span>
                <span className="text-slate-200 font-mono">${portfolio.totalAssetValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Risk</span>
                <span className="text-slate-200">{portfolio.riskTolerance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Strategy</span>
                <span className="text-slate-200">{portfolio.strategy}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Report */}
        <div className="lg:col-span-2 bg-slate-800/50 p-8 rounded-xl border border-slate-700 shadow-inner">
          <div className="text-slate-200">
            {renderContent(analysis)}
          </div>
        </div>
      </div>
      
      {/* Floating Chat Widget */}
      <ChatWidget portfolio={portfolio} analysisContext={analysis} />
    </div>
  );
};

export default AnalysisView;