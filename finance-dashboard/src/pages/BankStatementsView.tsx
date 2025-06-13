// finance-dashboard/src/pages/BankStatementsView.tsx (Simplified)
import React, { useState, useEffect } from 'react';
import {TrendingUp, TrendingDown, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';

interface BankBalance {
  id: number;
  account_name: string;
  account_number?: string;
  statement_month: string;
  beginning_balance: number;
  ending_balance: number;
  deposits_additions?: number;
  withdrawals_subtractions?: number;
  statement_date: string;
  data_source: string;
  confidence_score: number;
  created_at?: string;
}

const getApiBaseUrl = () => {
  const host = process.env.REACT_APP_API_HOST || 'localhost';
  const port = process.env.REACT_APP_API_PORT || '8000';
  return `http://${host}:${port}`;
};

export default function BankStatementsView() {
  const [bankBalances, setBankBalances] = useState<BankBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBankBalances();
  }, []);

  const fetchBankBalances = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/api/portfolio/bank-balances`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bank balances');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBankBalances(data.balances);
      } else {
        throw new Error('API returned error');
      }
    } catch (err) {
      console.error('Error fetching bank balances:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate simple metrics
  const latestBalance = bankBalances.length > 0 
    ? bankBalances.reduce((latest, current) => 
        new Date(current.statement_date) > new Date(latest.statement_date) ? current : latest
      )
    : null;

  const totalStatements = bankBalances.length;
  const avgBalance = bankBalances.length > 0 
    ? bankBalances.reduce((sum, b) => sum + b.ending_balance, 0) / bankBalances.length
    : 0;

  // Calculate trend (last 3 months)
  const recentBalances = bankBalances
    .sort((a, b) => new Date(b.statement_date).getTime() - new Date(a.statement_date).getTime())
    .slice(0, 3);
  
  const balanceTrend = recentBalances.length >= 2 
    ? recentBalances[0].ending_balance - recentBalances[recentBalances.length - 1].ending_balance
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        <span className="ml-3 text-gray-400">Loading bank statements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-600 rounded-lg p-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-red-400">Error Loading Bank Statements</h3>
        </div>
        <p className="text-red-300 mt-2">{error}</p>
        <button 
          onClick={fetchBankBalances}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (bankBalances.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Bank Statements</h1>
            <p className="text-gray-400 mt-2">Track your Wells Fargo account balances and cash flow</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Bank Statements"
        subtitle="Track your Wells Fargo account balances and cash flow"
      />

      {/* Simple Metrics - Same style as transaction page */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Current Balance</h3>
          </div>
          <p className="text-2xl font-bold text-white">
            ${latestBalance?.ending_balance.toLocaleString() || '0'}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Total Statements</h3>
          </div>
          <p className="text-2xl font-bold text-white">{totalStatements}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Average Balance</h3>
          </div>
          <p className="text-2xl font-bold text-white">${avgBalance.toLocaleString()}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 ${balanceTrend >= 0 ? 'bg-green-600' : 'bg-red-600'} rounded-lg flex items-center justify-center`}>
              {balanceTrend >= 0 ? <TrendingUp className="w-5 h-5 text-white" /> : <TrendingDown className="w-5 h-5 text-white" />}
            </div>
            <h3 className="text-sm font-medium text-gray-400">3-Month Trend</h3>
          </div>
          <p className={`text-2xl font-bold ${balanceTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {balanceTrend >= 0 ? '+' : ''}${balanceTrend.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Simple Table - Same style as transaction page */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Statements</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-sm font-medium text-gray-400 p-4">Date</th>
                <th className="text-left text-sm font-medium text-gray-400 p-4">Account</th>
                <th className="text-right text-sm font-medium text-gray-400 p-4">Beginning</th>
                <th className="text-right text-sm font-medium text-gray-400 p-4">Ending</th>
                <th className="text-right text-sm font-medium text-gray-400 p-4">Change</th>
                <th className="text-center text-sm font-medium text-gray-400 p-4">Source</th>
              </tr>
            </thead>
            <tbody>
              {bankBalances
                .sort((a, b) => new Date(b.statement_date).getTime() - new Date(a.statement_date).getTime())
                .map((balance) => {
                  const netChange = balance.ending_balance - balance.beginning_balance;
                  return (
                    <tr key={balance.id} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{balance.statement_month}</p>
                          <p className="text-gray-400 text-sm">{new Date(balance.statement_date).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white">{balance.account_name}</p>
                          {balance.account_number && (
                            <p className="text-gray-400 text-sm">#{balance.account_number}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-right text-white p-4 font-medium">
                        ${balance.beginning_balance.toLocaleString()}
                      </td>
                      <td className="text-right text-white font-bold p-4">
                        ${balance.ending_balance.toLocaleString()}
                      </td>
                      <td className={`text-right p-4 font-medium ${netChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {netChange >= 0 ? '+' : ''}${netChange.toLocaleString()}
                      </td>
                      <td className="text-center p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          balance.data_source === 'pdf_statement' 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-blue-900/30 text-blue-400'
                        }`}>
                          {balance.data_source === 'pdf_statement' ? 'PDF' : 'Manual'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        
        {/* Simple Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <p className="text-sm text-gray-400 text-center">
            {bankBalances.length} statement{bankBalances.length !== 1 ? 's' : ''} • Last updated {latestBalance ? new Date(latestBalance.statement_date).toLocaleDateString() : 'Never'}
          </p>
        </div>
      </div>
    </div>
  );
}