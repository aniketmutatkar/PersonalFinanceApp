// src/components/portfolio/PDFStatementUpload.tsx - Enhanced with Larger Review Interface
import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface ExtractedData {
  institution?: string;
  account_type?: string;
  account_number?: string;
  statement_period_start?: string;
  statement_period_end?: string;
  beginning_balance?: number;
  ending_balance?: number;
  matched_account?: {
    id: number;
    name: string;
    institution: string;
  };
  account_suggestions?: Array<{
    id: number;
    name: string;
    institution: string;
    match_reason: string;
  }>;
  extraction_notes?: string[];
}

interface DuplicateCheck {
  is_duplicate: boolean;
  conflict_type: string;
  message: string;
  existing_balance?: any;
  similarity_percentage: number;
  recommendation: string;
}

interface UploadResponse {
  statement_id: number;
  extracted_data: ExtractedData;
  confidence_score: number;
  relevant_page: number;
  total_pages: number;
  requires_review: boolean;
  message: string;
  can_quick_save: boolean;
  duplicate_check?: DuplicateCheck;
}

interface ReviewFormData {
  account_id: string;
  balance_date: string;
  balance_amount: string;
  notes: string;
}

interface PDFStatementUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceAdded?: () => void;
}

export default function PDFStatementUpload({ 
  isOpen, 
  onClose, 
  onBalanceAdded 
}: PDFStatementUploadProps) {
  // States
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [showReviewMode, setShowReviewMode] = useState(false);
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [isReviewSaving, setIsReviewSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);

  const queryClient = useQueryClient();

  // Form data for review mode
  const [reviewData, setReviewData] = useState<ReviewFormData>({
    account_id: '',
    balance_date: '',
    balance_amount: '',
    notes: ''
  });

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setUploadResponse(null);
      setShowReviewMode(false);
      setErrorMessage('');
      setSuccessMessage('');
      setShowDuplicateConfirm(false);
      setReviewData({
        account_id: '',
        balance_date: '',
        balance_amount: '',
        notes: ''
      });
    }
  }, [isOpen]);

  // Update review data when upload response changes
  React.useEffect(() => {
    if (uploadResponse?.extracted_data) {
      const data = uploadResponse.extracted_data;
      setReviewData({
        account_id: data.matched_account?.id.toString() || '',
        balance_date: data.statement_period_end || '',
        balance_amount: data.ending_balance?.toString() || '',
        notes: `Auto-extracted from ${uploadResponse.extracted_data.institution || 'PDF'} statement`
      });
    }
  }, [uploadResponse]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please upload a PDF file only.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) { // 25MB limit
      setErrorMessage('File size must be less than 25MB.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setUploadResponse(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://192.168.1.226:8000/api/portfolio/statements/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result: UploadResponse = await response.json();
      setUploadResponse(result);

      console.log('📊 Upload result:', result);

    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuickSave = async (confirmDuplicates = false) => {
    if (!uploadResponse) return;

    setIsQuickSaving(true);
    setErrorMessage('');

    try {
      const response = await fetch(
        `http://192.168.1.226:8000/api/portfolio/statements/${uploadResponse.statement_id}/quick-save`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm_duplicates: confirmDuplicates }),
        }
      );

      const result = await response.json();

      if (result.requires_confirmation && !confirmDuplicates) {
        setShowDuplicateConfirm(true);
        return;
      }

      if (result.success) {
        setSuccessMessage('Balance saved successfully via quick save!');
        
        queryClient.invalidateQueries({ queryKey: ['portfolioOverview'] });
        queryClient.invalidateQueries({ queryKey: ['portfolioTrends'] });

        if (onBalanceAdded) {
          onBalanceAdded();
        }

        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(result.message || 'Quick save failed');
      }

    } catch (error) {
      console.error('Quick save error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Quick save failed');
    } finally {
      setIsQuickSaving(false);
    }
  };

  const handleReviewSave = async () => {
    if (!uploadResponse || !reviewData.account_id || !reviewData.balance_amount || !reviewData.balance_date) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsReviewSaving(true);
    setErrorMessage('');

    try {
      const response = await fetch(
        `http://192.168.1.226:8000/api/portfolio/statements/${uploadResponse.statement_id}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_id: parseInt(reviewData.account_id),
            balance_date: reviewData.balance_date,
            balance_amount: parseFloat(reviewData.balance_amount),
            notes: reviewData.notes
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Review save failed');
      }

      const result = await response.json();
      setSuccessMessage(result.message);

      queryClient.invalidateQueries({ queryKey: ['portfolioOverview'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioTrends'] });

      if (onBalanceAdded) {
        onBalanceAdded();
      }

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Review save error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Review save failed');
    } finally {
      setIsReviewSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-800 border border-gray-700 rounded-lg ${
        showReviewMode 
          ? 'w-full max-w-[95vw] h-[95vh] overflow-hidden flex flex-col' 
          : 'w-full max-w-3xl max-h-[90vh] overflow-y-auto'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-medium text-white">Upload PDF Statement</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`p-6 ${showReviewMode ? 'flex-1 overflow-hidden flex flex-col' : ''}`}>
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-800/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-green-300 text-sm">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-400">✕</span>
                <span className="text-red-300 text-sm">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Duplicate Confirmation Dialog */}
          {showDuplicateConfirm && uploadResponse?.duplicate_check && (
            <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400">⚠️</span>
                  <span className="text-yellow-300 font-medium">Duplicate Detected</span>
                </div>
                <p className="text-yellow-200 text-sm">{uploadResponse.duplicate_check.message}</p>
                
                {uploadResponse.duplicate_check.existing_balance && (
                  <div className="bg-gray-900/50 rounded p-3">
                    <div className="text-xs text-gray-300 mb-2">Existing Balance:</div>
                    <div className="text-white font-bold">
                      {formatCurrency(uploadResponse.duplicate_check.existing_balance.balance_amount)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(uploadResponse.duplicate_check.existing_balance.balance_date)} 
                      ({uploadResponse.duplicate_check.existing_balance.data_source})
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => handleQuickSave(true)}
                    disabled={isQuickSaving}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white px-3 py-2 rounded text-sm"
                  >
                    Override & Save
                  </button>
                  <button
                    onClick={() => setShowDuplicateConfirm(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!uploadResponse && (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-900/10' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              
              <div className="space-y-4">
                <div className="text-4xl">📄</div>
                <div>
                  <p className="text-white font-medium">
                    {isUploading ? 'Processing PDF with page detection...' : 'Drop PDF statement here or click to browse'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Enhanced with smart page detection • Supports: Wealthfront, Schwab, Robinhood, Acorns, ADP
                  </p>
                </div>
                
                {isUploading && (
                  <div className="flex flex-col items-center space-y-2">
                    <svg className="animate-spin h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="text-center">
                      <div className="text-blue-400 text-sm font-medium">Analyzing PDF...</div>
                      <div className="text-gray-400 text-xs">Detecting relevant page and extracting data</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processing Results & User Choice */}
          {uploadResponse && !showReviewMode && (
            <div className="space-y-6">
              {/* Page Detection Results */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-400 text-xl">📑</span>
                    <div>
                      <div className="text-white font-medium">Page Detection Results</div>
                      <div className="text-gray-400 text-sm">
                        Found key data on page {uploadResponse.relevant_page} of {uploadResponse.total_pages}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${getConfidenceColor(uploadResponse.confidence_score)} bg-gray-800`}>
                    {getConfidenceLabel(uploadResponse.confidence_score)} ({(uploadResponse.confidence_score * 100).toFixed(1)}%)
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{uploadResponse.message}</p>
              </div>

              {/* Extracted Data Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs">Institution</label>
                    <div className="text-white font-medium capitalize">
                      {uploadResponse.extracted_data.institution || 'Not detected'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-gray-400 text-xs">Account Type</label>
                    <div className="text-white font-medium">
                      {uploadResponse.extracted_data.account_type || 'Not detected'}
                    </div>
                  </div>
                  
                  {uploadResponse.extracted_data.matched_account && (
                    <div className="bg-green-900/20 border border-green-800/30 rounded p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-green-400">✓</span>
                        <span className="text-green-300 font-medium text-sm">Account Matched</span>
                      </div>
                      <div className="text-white text-sm">
                        {uploadResponse.extracted_data.matched_account.name}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {uploadResponse.extracted_data.matched_account.institution}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs">Statement Period</label>
                    <div className="text-white font-medium">
                      {uploadResponse.extracted_data.statement_period_end
                        ? formatDate(uploadResponse.extracted_data.statement_period_end)
                        : 'Not detected'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-gray-400 text-xs">Ending Balance</label>
                    <div className="text-green-400 font-bold text-xl">
                      {uploadResponse.extracted_data.ending_balance 
                        ? formatCurrency(uploadResponse.extracted_data.ending_balance)
                        : 'Not detected'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* User Choice Buttons */}
              <div className="bg-gray-900/30 rounded-lg p-6">
                <h4 className="text-white font-medium mb-4 text-center">Choose Your Next Step</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quick Save Option */}
                  <button
                    onClick={() => handleQuickSave(false)}
                    disabled={!uploadResponse.can_quick_save || isQuickSaving || showDuplicateConfirm}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      uploadResponse.can_quick_save 
                        ? 'border-green-600 bg-green-900/20 hover:bg-green-900/40 cursor-pointer' 
                        : 'border-gray-600 bg-gray-900/20 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-2xl">⚡</div>
                      <div className={`font-medium ${uploadResponse.can_quick_save ? 'text-green-400' : 'text-gray-500'}`}>
                        Quick Save
                      </div>
                      <div className="text-sm text-gray-400">
                        {uploadResponse.can_quick_save 
                          ? `Save ${formatCurrency(uploadResponse.extracted_data.ending_balance || 0)} immediately`
                          : 'Review required due to low confidence or conflicts'
                        }
                      </div>
                      {isQuickSaving && (
                        <div className="flex items-center justify-center mt-2">
                          <svg className="animate-spin h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Review Option */}
                  <button
                    onClick={() => setShowReviewMode(true)}
                    className="p-4 rounded-lg border-2 border-blue-600 bg-blue-900/20 hover:bg-blue-900/40 transition-all"
                  >
                    <div className="text-center space-y-2">
                      <div className="text-2xl">📝</div>
                      <div className="text-blue-400 font-medium">Review & Edit</div>
                      <div className="text-sm text-gray-400">
                        View PDF side-by-side and verify extracted data
                      </div>
                    </div>
                  </button>
                </div>

                {/* Duplicate Warning */}
                {uploadResponse.duplicate_check?.is_duplicate && (
                  <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800/30 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-400">⚠️</span>
                      <span className="text-yellow-300 text-sm font-medium">Potential Duplicate Detected</span>
                    </div>
                    <p className="text-yellow-200 text-sm mt-1">{uploadResponse.duplicate_check.message}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Mode - ENHANCED FULL SCREEN */}
          {showReviewMode && uploadResponse && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h4 className="text-white font-medium">Review Extracted Data</h4>
                <button
                  onClick={() => setShowReviewMode(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-sm">← Back to Options</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Left: PDF Viewer - 75% width */}
                <div className="lg:col-span-3 border border-gray-600 rounded-lg flex flex-col">
                    <div className="p-4 border-b border-gray-600 bg-gray-900/50 flex-shrink-0">
                    <h5 className="text-white font-medium">Statement Preview</h5>
                    <p className="text-gray-400 text-sm">
                        Page {uploadResponse.relevant_page} of {uploadResponse.total_pages} • Key data detected
                    </p>
                    </div>
                    <div className="flex-1 min-h-0">
                    <iframe
                        src={`http://192.168.1.226:8000/api/portfolio/statements/${uploadResponse.statement_id}/page-pdf#zoom=100`}
                        className="w-full h-full border-0"
                        title={`Statement Page ${uploadResponse.relevant_page}`}
                    />
                    </div>
                </div>

                {/* Right: Review Form - ENHANCED */}
                <div className="lg:col-span-1 flex flex-col">
                  <div className="bg-gray-900/50 rounded-lg p-4 flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-white font-medium">Extracted Data</h5>
                      <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(uploadResponse.confidence_score)} bg-gray-800`}>
                        {(uploadResponse.confidence_score * 100).toFixed(1)}% confidence
                      </span>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {/* Account Selection */}
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Account *</label>
                        <select
                          value={reviewData.account_id}
                          onChange={(e) => setReviewData({...reviewData, account_id: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        >
                          <option value="">Select account...</option>
                          {uploadResponse.extracted_data.matched_account && (
                            <option value={uploadResponse.extracted_data.matched_account.id}>
                              {uploadResponse.extracted_data.matched_account.name} ({uploadResponse.extracted_data.matched_account.institution})
                            </option>
                          )}
                          {uploadResponse.extracted_data.account_suggestions?.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} ({acc.institution})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Statement Date *</label>
                        <input
                          type="date"
                          value={reviewData.balance_date}
                          onChange={(e) => setReviewData({...reviewData, balance_date: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        />
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Ending Balance *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={reviewData.balance_amount}
                            onChange={(e) => setReviewData({...reviewData, balance_amount: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 rounded pl-8 pr-3 py-2 text-white"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Notes</label>
                        <textarea
                          value={reviewData.notes}
                          onChange={(e) => setReviewData({...reviewData, notes: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - FIXED POSITION */}
                  <div className="flex space-x-3 mt-4 flex-shrink-0">
                    <button
                      onClick={() => setShowReviewMode(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReviewSave}
                      disabled={!reviewData.account_id || !reviewData.balance_amount || !reviewData.balance_date || isReviewSaving}
                      className="flex-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded transition-colors flex items-center justify-center space-x-2"
                    >
                      {isReviewSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Balance</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Close button for initial state */}
          {!uploadResponse && !isUploading && (
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}