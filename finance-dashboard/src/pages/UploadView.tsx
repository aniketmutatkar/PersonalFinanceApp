// src/pages/UploadView.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle } from 'lucide-react';
import { useFileUpload } from '../hooks/useUploadData';
import FileUploadZone from '../components/upload/FileUploadZone';
import TransactionReview from '../components/upload/TransactionReview';
import UploadSummary from '../components/upload/UploadSummary';
import { CategoryUpdate } from '../types/api';

type UploadStep = 'upload' | 'review' | 'summary';

export default function UploadView() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const {
    isLoading,
    previewData,
    confirmData,
    error,
    uploadPreview,
    confirmUpload,
    reset
  } = useFileUpload();

  // Handle file selection
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  // Handle upload start
  const handleStartUpload = () => {
    if (selectedFiles.length === 0) {
      return;
    }
    
    uploadPreview(selectedFiles, {
      onSuccess: (response) => {
        if (response.data.requires_review) {
          setCurrentStep('review');
        } else {
          // No review needed, automatically confirm
          confirmUpload({
            session_id: response.data.session_id,
            category_updates: []
          }, {
            // ✅ ADD THIS SUCCESS CALLBACK
            onSuccess: () => {
              setCurrentStep('summary');
            }
          });
        }
      }
    });
  };

  // Handle category updates from review
  const handleCategoryUpdates = (updates: CategoryUpdate[]) => {
    if (!previewData?.data.session_id) {
      return;
    }

    confirmUpload({
      session_id: previewData.data.session_id,
      category_updates: updates
    }, {
      onSuccess: () => {
        setCurrentStep('summary');
      }
    });
  };

  // Handle skip review
  const handleSkipReview = () => {
    if (!previewData?.data.session_id) {
      return;
    }

    confirmUpload({
      session_id: previewData.data.session_id,
      category_updates: []
    }, {
      onSuccess: () => {
        setCurrentStep('summary');
      }
    });
  };

  // Handle upload more files
  const handleUploadMore = () => {
    setCurrentStep('upload');
    setSelectedFiles([]);
    reset();
  };

  // Handle view monthly analysis
  const handleViewMonthly = () => {
    navigate('/monthly');
  };

  // Get step indicator
  const getStepIndicator = () => {
    const steps = [
      { key: 'upload', label: 'Upload Files', active: currentStep === 'upload' },
      { key: 'review', label: 'Review Categories', active: currentStep === 'review' },
      { key: 'summary', label: 'Summary', active: currentStep === 'summary' }
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
              ${step.active 
                ? 'bg-blue-600 text-white' 
                : currentStep === 'summary' && index < 2
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }
            `}>
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${step.active 
                  ? 'bg-white text-blue-600' 
                  : currentStep === 'summary' && index < 2
                    ? 'bg-white text-green-600'
                    : 'bg-gray-600 text-gray-300'
                }
              `}>
                {currentStep === 'summary' && index < 2 ? '✓' : index + 1}
              </div>
              <span className="font-medium text-sm">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`
                w-8 h-px transition-colors duration-200
                ${currentStep === 'summary' || (currentStep === 'review' && index === 0)
                  ? 'bg-green-400' 
                  : 'bg-gray-600'
                }
              `} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Bank Files</h1>
        <p className="text-gray-300">
          Upload your bank CSV files to automatically import and categorize transactions
        </p>
      </div>

      {/* Step Indicator */}
      {getStepIndicator()}

      {/* Content based on current step */}
      <div className="min-h-[500px]">
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <FileUploadZone
              onFilesSelected={handleFilesSelected}
              isLoading={isLoading}
              error={error?.message || null}
            />
            
            {selectedFiles.length > 0 && !isLoading && (
              <div className="flex justify-center">
                <button
                  onClick={handleStartUpload}
                  disabled={selectedFiles.length === 0}
                  className="flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  <span>Process {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}</span>
                </button>
              </div>
            )}

            {/* Upload Instructions */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
              <h3 className="text-white font-medium text-lg mb-4">Supported File Formats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="text-blue-400 font-medium mb-2">Chase Bank</h4>
                  <p className="text-gray-400">Standard CSV export from Chase online banking</p>
                </div>
                <div>
                  <h4 className="text-blue-400 font-medium mb-2">Wells Fargo</h4>
                  <p className="text-gray-400">Transaction export in CSV format</p>
                </div>
                <div>
                  <h4 className="text-blue-400 font-medium mb-2">Citi Bank</h4>
                  <p className="text-gray-400">Account activity download as CSV</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'review' && previewData?.data && (
          <TransactionReview
            transactions={previewData.data.misc_transactions}
            onCategoryUpdates={handleCategoryUpdates}
            onSkip={handleSkipReview}
          />
        )}

        {currentStep === 'summary' && confirmData?.data && (
          <UploadSummary
            summary={confirmData.data}
            onViewMonthly={handleViewMonthly}
            onUploadMore={handleUploadMore}
          />
        )}
      </div>

      {/* Error Display */}
      {error && currentStep !== 'upload' && (
        <div className="mt-6 bg-red-900/20 border border-red-800/30 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-400 font-medium text-sm">Upload Error</h4>
              <p className="text-red-300 text-sm mt-1">{error.message}</p>
              <button
                onClick={handleUploadMore}
                className="mt-3 text-red-400 hover:text-red-300 text-sm underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-md mx-4">
            <div className="flex items-center space-x-4">
              <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
              <div>
                <h3 className="text-white font-medium">
                  {currentStep === 'upload' ? 'Processing Files...' : 'Saving Transactions...'}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {currentStep === 'upload' 
                    ? 'Analyzing transactions and detecting categories' 
                    : 'Updating your financial data'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}