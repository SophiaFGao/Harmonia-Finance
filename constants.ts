import { AssetAllocation, UserPortfolio, RiskTolerance, InvestmentHorizon, Strategy } from './types';

export const INITIAL_ALLOCATION: AssetAllocation = {
  fixedIncome: 0,
  mutualFunds: 0,
  stocks: 0,
  cash: 0,
  crypto: 0,
  other: 0,
};

export const INITIAL_PORTFOLIO: UserPortfolio = {
  totalAssetValue: 100000,
  riskTolerance: RiskTolerance.Moderate,
  horizon: InvestmentHorizon.Medium,
  strategy: Strategy.DCA,
  currentAllocation: { ...INITIAL_ALLOCATION },
  desiredAllocation: { ...INITIAL_ALLOCATION },
  watchlist: 'SPY, QQQ, GLD, NVDA',
  etfHoldings: [],
  stockHoldings: []
};

export const ASSET_COLORS = {
  fixedIncome: '#3b82f6', // blue-500
  mutualFunds: '#10b981', // emerald-500
  stocks: '#f59e0b', // amber-500
  cash: '#64748b', // slate-500
  crypto: '#8b5cf6', // violet-500
  other: '#ec4899', // pink-500
};

export const ASSET_LABELS: Record<keyof AssetAllocation, string> = {
  fixedIncome: 'Fixed Income (Bonds/CDs)',
  mutualFunds: 'Mutual Funds / ETFs',
  stocks: 'Individual Stocks',
  cash: 'Cash / High Yield Savings',
  crypto: 'Crypto / Alt Assets',
  other: 'Real Estate / Other',
};