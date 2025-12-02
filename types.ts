export enum RiskTolerance {
  Conservative = 'Conservative',
  Moderate = 'Moderate',
  Aggressive = 'Aggressive',
  Speculative = 'Speculative'
}

export enum InvestmentHorizon {
  Short = '1-3 Years',
  Medium = '3-10 Years',
  Long = '10-30 Years',
  Retirement = '30+ Years'
}

export enum Strategy {
  DCA = 'Dollar Cost Averaging',
  LumpSum = 'Lump Sum Immediate',
  Value = 'Value Investing',
  Growth = 'Growth Investing',
  Income = 'Income / Dividend',
  Preservation = 'Capital Preservation'
}

export interface AssetAllocation {
  fixedIncome: number;
  mutualFunds: number;
  stocks: number;
  cash: number;
  crypto: number;
  other: number;
}

export interface Holding {
  ticker: string;
  percentage: number;
}

export interface UserPortfolio {
  totalAssetValue: number;
  riskTolerance: RiskTolerance;
  horizon: InvestmentHorizon;
  strategy: Strategy;
  currentAllocation: AssetAllocation;
  desiredAllocation: AssetAllocation;
  watchlist: string; // Comma separated tickers
  etfHoldings: Holding[]; // Specific tickers for Mutual Funds/ETFs
  stockHoldings: Holding[]; // Specific tickers for Individual Stocks
}

export interface AnalysisResponse {
  markdown: string;
}