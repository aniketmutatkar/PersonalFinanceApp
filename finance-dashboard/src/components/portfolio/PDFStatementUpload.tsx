// src/components/portfolio/PDFStatementUpload.tsx
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

interface UploadResponse {
  statement_id?: number;
  extracted_data: ExtractedData;
  requires_review: boolean;
  confidence_score: number;
  message: string;
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
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [reviewData, setReviewData] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const queryClient = useQueryClient();

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setUploadResponse(null);
      setReviewData(null);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

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

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setErrorMessage('File size must be less than 10MB.');
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

      // If high confidence and no review needed, auto-populate review form
      if (!result.requires_review && result.extracted_data.ending_balance) {
        setReviewData({
          account_id: result.extracted_data.matched_account?.id || '',
          balance_date: result.extracted_data.statement_period_end || '',
          balance_amount: result.extracted_data.ending_balance,
          notes: `Auto-extracted from ${file.name}`,
          confidence_score: result.confidence_score,
          original_filename: file.name
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmExtraction = async () => {
    if (!reviewData) return;

    setIsConfirming(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://192.168.1.226:8000/api/portfolio/statements/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save balance');
      }

      const result = await response.json();
      setSuccessMessage(result.message);

      // Refresh portfolio data
      queryClient.invalidateQueries({ queryKey: ['portfolioOverview'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioTrends'] });

      if (onBalanceAdded) {
        onBalanceAdded();
      }

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Confirmation error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save balance');
    } finally {
      setIsConfirming(false);
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
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
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

        <div className="p-6">
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
                    {isUploading ? 'Processing PDF...' : 'Drop PDF statement here or click to browse'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Supports: Wealthfront, Schwab, Robinhood, Acorns, ADP statements
                  </p>
                </div>
                
                {isUploading && (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-blue-400 text-sm">Extracting data...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Extraction Results */}
          {uploadResponse && (
            <div className="space-y-6">
              {/* Confidence Score */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">Extraction Results</span>
                  <span className={`text-sm font-medium ${getConfidenceColor(uploadResponse.confidence_score)}`}>
                    {getConfidenceLabel(uploadResponse.confidence_score)} ({(uploadResponse.confidence_score * 100).toFixed(1)}%)
                  </span>
                </div>
                <p className="text-white text-sm">{uploadResponse.message}</p>
              </div>

              {/* Extracted Data */}
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
                  
                  <div>
                    <label className="text-gray-400 text-xs">Account Number</label>
                    <div className="text-white font-medium">
                      {uploadResponse.extracted_data.account_number || 'Not detected'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs">Statement Period</label>
                    <div className="text-white font-medium">
                      {uploadResponse.extracted_data.statement_period_start && uploadResponse.extracted_data.statement_period_end
                        ? `${formatDate(uploadResponse.extracted_data.statement_period_start)} - ${formatDate(uploadResponse.extracted_data.statement_period_end)}`
                        : 'Not detected'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-gray-400 text-xs">Beginning Balance</label>
                    <div className="text-white font-medium">
                      {uploadResponse.extracted_data.beginning_balance 
                        ? formatCurrency(uploadResponse.extracted_data.beginning_balance)
                        : 'Not detected'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-gray-400 text-xs">Ending Balance</label>
                    <div className="text-green-400 font-bold text-lg">
                      {uploadResponse.extracted_data.ending_balance 
                        ? formatCurrency(uploadResponse.extracted_data.ending_balance)
                        : 'Not detected'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Matching */}
              {uploadResponse.extracted_data.matched_account && (
                <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-green-300 font-medium text-sm">Account Matched</span>
                  </div>
                  <div className="text-white">
                    {uploadResponse.extracted_data.matched_account.name} ({uploadResponse.extracted_data.matched_account.institution})
                  </div>
                </div>
              )}

              {/* Review Form (for auto-extracted data) */}
              {reviewData && (
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4">Confirm Balance Entry</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Account</label>
                      <div className="text-white font-medium">
                        {uploadResponse.extracted_data.matched_account?.name}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Date</label>
                      <div className="text-white font-medium">
                        {formatDate(reviewData.balance_date)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">Amount</label>
                      <div className="text-green-400 font-bold">
                        {formatCurrency(reviewData.balance_amount)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-400 text-xs mb-1">Notes</label>
                    <textarea
                      value={reviewData.notes}
                      onChange={(e) => setReviewData({...reviewData, notes: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                      rows={2}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setUploadResponse(null);
                        setReviewData(null);
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Upload Different File
                    </button>
                    <button
                      onClick={handleConfirmExtraction}
                      disabled={isConfirming}
                      className="flex-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-6 py-2 rounded transition-colors flex items-center justify-center space-x-2"
                    >
                      {isConfirming ? (
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
              )}

              {/* Manual Review Required */}
              {uploadResponse.requires_review && !reviewData && (
                <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-yellow-400">⚠️</span>
                    <span className="text-yellow-300 font-medium text-sm">Manual Review Required</span>
                  </div>
                  <p className="text-yellow-200 text-sm mb-4">{uploadResponse.message}</p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setUploadResponse(null);
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Try Different File
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Manual Entry Instead
                    </button>
                  </div>
                </div>
              )}
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