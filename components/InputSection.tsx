import React, { useState } from 'react';
import { UserPortfolio, AssetAllocation, RiskTolerance, InvestmentHorizon, Strategy, Holding } from '../types';
import { ASSET_LABELS } from '../constants';

interface InputSectionProps {
  portfolio: UserPortfolio;
  setPortfolio: React.Dispatch<React.SetStateAction<UserPortfolio>>;
  onSubmit: () => void;
  isLoading: boolean;
}

// Sub-component for managing a list of tickers with percentages
const HoldingManager: React.FC<{
  title: string;
  holdings: Holding[];
  onChange: (holdings: Holding[]) => void;
  max?: number;
  targetTotal: number;
}> = ({ title, holdings, onChange, max = 10, targetTotal }) => {
  const [tickerInput, setTickerInput] = useState('');
  const [percentInput, setPercentInput] = useState('');
  const [error, setError] = useState('');

  const currentTotal = holdings.reduce((sum, h) => sum + h.percentage, 0);
  // Precision check for floating point
  const isMatch = Math.abs(currentTotal - targetTotal) < 0.01;
  const isOver = currentTotal > targetTotal;

  const validateTicker = (t: string) => {
    return /^[A-Z.]{1,6}$/.test(t);
  };

  const handleAdd = () => {
    const formattedTicker = tickerInput.trim().toUpperCase();
    const percentVal = parseFloat(percentInput);

    if (!formattedTicker) return;

    if (!validateTicker(formattedTicker)) {
      setError('Invalid ticker format (e.g. AAPL).');
      return;
    }
    if (holdings.some(h => h.ticker === formattedTicker)) {
      setError('Ticker already added.');
      return;
    }
    if (holdings.length >= max) {
      setError(`Maximum ${max} holdings allowed.`);
      return;
    }
    if (isNaN(percentVal) || percentVal <= 0) {
      setError('Enter a valid percentage.');
      return;
    }

    // Check if adding this exceeds total?
    // User requested "Totals must equal", so intermediate states can be whatever, 
    // but usually we don't want to exceed 100 or exceed the category target significantly? 
    // We will allow adding and show validation error at the list level.

    onChange([...holdings, { ticker: formattedTicker, percentage: percentVal }]);
    setTickerInput('');
    setPercentInput('');
    setError('');
  };

  const handleRemove = (tickerToRemove: string) => {
    onChange(holdings.filter(h => h.ticker !== tickerToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="mt-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-slate-300">
          {title} <span className="text-slate-500 text-xs">(Max {max})</span>
        </label>
        <div className={`text-xs font-mono font-bold px-2 py-1 rounded ${
            holdings.length === 0 ? 'text-slate-500' :
            isMatch ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
          Sum: {currentTotal.toFixed(1)}% / Target: {targetTotal.toFixed(1)}%
        </div>
      </div>
      
      {holdings.length > 0 && !isMatch && (
         <p className="text-xs text-red-400 mb-3">
           * The sum of specific holdings ({currentTotal}%) must match the asset class allocation ({targetTotal}%). 
           {currentTotal < targetTotal && " Please add more holdings or an 'OTHER' category."}
           {currentTotal > targetTotal && " Please reduce allocations."}
         </p>
      )}

      <div className="space-y-2 mb-3">
        {holdings.map(h => (
          <div key={h.ticker} className="flex justify-between items-center bg-slate-800/80 px-3 py-2 rounded border border-slate-700">
            <span className="text-blue-400 font-medium">{h.ticker}</span>
            <div className="flex items-center space-x-3">
              <span className="text-white text-sm">{h.percentage}%</span>
              <button 
                onClick={() => handleRemove(h.ticker)}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {holdings.length === 0 && (
          <span className="text-sm text-slate-600 italic">No specific holdings added yet (Optional)</span>
        )}
      </div>

      <div className="flex gap-2 items-start">
        <div className="flex-grow grid grid-cols-3 gap-2">
          <div className="col-span-2 relative">
             <input
              type="text"
              value={tickerInput}
              onChange={(e) => {
                setTickerInput(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ticker"
              className={`w-full bg-slate-800 border ${error && !validateTicker(tickerInput) ? 'border-red-500' : 'border-slate-600'} rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 uppercase`}
            />
          </div>
          <div className="col-span-1">
             <input
              type="number"
              value={percentInput}
              onChange={(e) => setPercentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="%"
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={!tickerInput || !percentInput || holdings.length >= max}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded font-medium disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
};

const InputSection: React.FC<InputSectionProps> = ({ portfolio, setPortfolio, onSubmit, isLoading }) => {
  
  const handleAllocationChange = (
    type: 'currentAllocation' | 'desiredAllocation',
    asset: keyof AssetAllocation,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setPortfolio(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [asset]: numValue
      }
    }));
  };

  const calculateTotal = (alloc: AssetAllocation) => Object.values(alloc).reduce((a, b) => a + b, 0);

  const currentTotal = calculateTotal(portfolio.currentAllocation);
  const desiredTotal = calculateTotal(portfolio.desiredAllocation);

  // Validation logic for holdings
  const validateHoldings = (holdings: Holding[], target: number) => {
    if (holdings.length === 0) return true; // Optional
    const sum = holdings.reduce((a, b) => a + b.percentage, 0);
    return Math.abs(sum - target) < 0.01;
  };

  const etfValid = validateHoldings(portfolio.etfHoldings, portfolio.currentAllocation.mutualFunds);
  const stockValid = validateHoldings(portfolio.stockHoldings, portfolio.currentAllocation.stocks);
  const isFormValid = currentTotal === 100 && desiredTotal === 100 && etfValid && stockValid;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Core Profile */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
          <span className="bg-blue-500/10 p-2 rounded-lg mr-3">1</span> 
          Investor Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Total Assets ($)</label>
            <input 
              type="number" 
              value={portfolio.totalAssetValue}
              onChange={(e) => setPortfolio({...portfolio, totalAssetValue: parseFloat(e.target.value)})}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Risk Tolerance</label>
             <select 
               value={portfolio.riskTolerance}
               onChange={(e) => setPortfolio({...portfolio, riskTolerance: e.target.value as RiskTolerance})}
               className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
             >
               {Object.values(RiskTolerance).map(v => <option key={v} value={v}>{v}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Investment Horizon</label>
             <select 
               value={portfolio.horizon}
               onChange={(e) => setPortfolio({...portfolio, horizon: e.target.value as InvestmentHorizon})}
               className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
             >
               {Object.values(InvestmentHorizon).map(v => <option key={v} value={v}>{v}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Primary Strategy</label>
             <select 
               value={portfolio.strategy}
               onChange={(e) => setPortfolio({...portfolio, strategy: e.target.value as Strategy})}
               className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
             >
               {Object.values(Strategy).map(v => <option key={v} value={v}>{v}</option>)}
             </select>
          </div>
        </div>
      </div>

      {/* 2. Allocation Matrix */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
          <span className="bg-emerald-500/10 p-2 rounded-lg mr-3">2</span> 
          Asset Allocation & Holdings
        </h2>
        
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="p-3 font-medium">Asset Class</th>
                <th className="p-3 font-medium">Current %</th>
                <th className="p-3 font-medium">Desired %</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(ASSET_LABELS).map((key) => (
                <tr key={key} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="p-3 text-slate-200">{ASSET_LABELS[key as keyof AssetAllocation]}</td>
                  <td className="p-3">
                    <input 
                      type="number"
                      min="0" max="100"
                      value={portfolio.currentAllocation[key as keyof AssetAllocation]}
                      onChange={(e) => handleAllocationChange('currentAllocation', key as keyof AssetAllocation, e.target.value)}
                      className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-center focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <input 
                      type="number"
                      min="0" max="100"
                      value={portfolio.desiredAllocation[key as keyof AssetAllocation]}
                      onChange={(e) => handleAllocationChange('desiredAllocation', key as keyof AssetAllocation, e.target.value)}
                      className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-center focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </td>
                </tr>
              ))}
              <tr className="font-bold text-slate-100">
                <td className="p-3 text-right">Total:</td>
                <td className={`p-3 text-center ${currentTotal !== 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {currentTotal}%
                </td>
                <td className={`p-3 text-center ${desiredTotal !== 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {desiredTotal}%
                </td>
              </tr>
            </tbody>
          </table>
          {(currentTotal !== 100 || desiredTotal !== 100) && (
            <p className="text-red-400 text-sm mt-3 text-center">Totals must equal 100%</p>
          )}
        </div>

        {/* Specific Tickers Section */}
        <div className="border-t border-slate-700 pt-6">
          <h3 className="text-md font-semibold text-slate-300 mb-2">Specific Holdings Breakdown</h3>
          <p className="text-sm text-slate-500 mb-4">
            Optionally breakdown your Mutual Funds and Stocks. 
            <span className="text-amber-400"> If provided, percentages must sum up to the Asset Class total.</span>
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HoldingManager 
              title="Mutual Funds / ETFs"
              holdings={portfolio.etfHoldings}
              onChange={(newHoldings) => setPortfolio({...portfolio, etfHoldings: newHoldings})}
              targetTotal={portfolio.currentAllocation.mutualFunds}
            />
            
            <HoldingManager 
              title="Individual Stocks"
              holdings={portfolio.stockHoldings}
              onChange={(newHoldings) => setPortfolio({...portfolio, stockHoldings: newHoldings})}
              targetTotal={portfolio.currentAllocation.stocks}
            />
          </div>
        </div>
      </div>

      {/* 3. Watchlist */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center">
          <span className="bg-purple-500/10 p-2 rounded-lg mr-3">3</span> 
          Additional Watchlist
        </h2>
        <div className="space-y-2">
           <label className="block text-sm font-medium text-slate-400">Other Tickers to Analyze (Comma Separated)</label>
           <textarea 
             value={portfolio.watchlist}
             onChange={(e) => setPortfolio({...portfolio, watchlist: e.target.value})}
             placeholder="e.g. BTC-USD, GLD, Stocks you are watching but don't own yet..."
             className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
           />
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onSubmit}
          disabled={isLoading || !isFormValid}
          className={`
            px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all transform hover:scale-105
            ${isLoading || !isFormValid
              ? 'bg-slate-600 cursor-not-allowed opacity-50' 
              : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white'}
          `}
        >
          {isLoading ? 'Analyzing Market Data...' : 'Generate Expert Analysis'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="mt-12 pt-6 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-500 max-w-3xl mx-auto leading-relaxed">
          <strong>Disclaimer:</strong> Harmonia Finance is an AI-powered analytical tool designed for informational purposes only. 
          It does not constitute professional financial advice, specific investment recommendations, or a solicitation to buy or sell any securities. 
          Market data may be delayed or estimated. All investments involve risk, including the loss of principal. 
          Please consult with a qualified financial advisor and conduct your own due diligence before making any investment decisions.
        </p>
      </div>
    </div>
  );
};

export default InputSection;