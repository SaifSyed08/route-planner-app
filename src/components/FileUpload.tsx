import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertTriangle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  loading?: boolean;
}

export default function FileUpload({ onFileUpload, loading = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  }, [selectedFile, onFileUpload]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={loading}
        />

        <div className="flex flex-col items-center space-y-4">
          {selectedFile ? (
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{selectedFile.name}</p>
                <p className="text-sm text-slate-600">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full">
                <Upload className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {dragActive ? 'Drop your CSV file here' : 'Upload CSV file'}
                </p>
                <p className="text-sm text-slate-600">
                  Drag and drop or click to select
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <AlertTriangle className="w-4 h-4" />
            <span>Make sure your CSV contains exactly 37 coordinate pairs</span>
          </div>
          
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Process File</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}