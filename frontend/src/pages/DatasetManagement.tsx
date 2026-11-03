import React, { useState, useEffect } from 'react';
import {
  Database,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  Table,
  Eye,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { evApi } from '../services/api';
import { DatasetItem } from '../types';

export const DatasetManagement: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const res = await evApi.getDatasets();
      setDatasets(res.datasets);
      if (res.datasets.length > 0 && !previewData) {
        loadPreview(res.datasets[0].id);
      }
    } catch (e) {
      console.error('Failed to load datasets', e);
    }
  };

  const loadPreview = async (datasetId: number) => {
    setLoadingPreview(true);
    try {
      const res = await evApi.getDatasetPreview(datasetId);
      setPreviewData(res);
    } catch (e) {
      console.error('Failed to load dataset preview', e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDatasetName(file.name.replace(/\.csv$/i, ''));
      setUploadError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (datasetName) {
      formData.append('name', datasetName);
    }

    try {
      const res = await evApi.uploadDataset(formData);
      setUploadResult(res.data);
      setSelectedFile(null);
      setDatasetName('');
      await loadDatasets();
      if (res.data.dataset_id) {
        await loadPreview(res.data.dataset_id);
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.error || err.message || 'CSV validation and upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (datasetId: number) => {
    if (!confirm('Are you sure you want to remove this dataset?')) return;
    try {
      await evApi.deleteDataset(datasetId);
      await loadDatasets();
      if (previewData?.record?.id === datasetId) {
        setPreviewData(null);
      }
    } catch (e) {
      console.error('Failed to delete dataset', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-sky-500/15">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Dataset Ingestion & Validation
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              CSV Pipeline
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Upload proprietary CSV datasets, inspect missing values and duplicates, preview data, and verify schema compliance.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-sky-500/20 px-3 py-1.5 rounded-xl text-xs text-gray-300">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Active Catalogs: {datasets.length}</span>
        </div>
      </div>

      {/* Upload Box and Validation Report Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Drag & Drop / File Selector */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              Upload New CSV Dataset
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">Max 32MB</span>
          </div>

          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            {/* File Dropzone */}
            <div className="border-2 border-dashed border-sky-500/30 hover:border-cyan-400 rounded-2xl p-6 text-center bg-slate-950/60 transition-colors cursor-pointer relative group">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center space-y-2 pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="font-bold text-cyan-300 text-sm">{selectedFile.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-gray-200">
                      Click or drag CSV file here to upload
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Supports Charging Stations, Country Growth, or EV Models
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Name */}
            {selectedFile && (
              <div>
                <label className="font-semibold text-gray-300 block mb-1">Dataset Label</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="e.g. Europe Q4 Station Network"
                  className="w-full bg-slate-950 border border-sky-500/25 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {/* Upload Button */}
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-950 flex items-center justify-center space-x-2 transition-all disabled:opacity-40"
            >
              <Upload className={`w-4 h-4 ${uploading ? 'animate-bounce' : ''}`} />
              <span>{uploading ? 'Validating & Ingesting...' : 'Validate and Ingest Dataset'}</span>
            </button>
          </form>

          {/* Error Message */}
          {uploadError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Validation Error:</span>
                <p className="mt-0.5 leading-relaxed">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Upload Success Report */}
          {uploadResult && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Dataset Cleaned & Ingested into Database!</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-800/40 font-mono">
                <div>Type: <strong>{uploadResult.dataset_type}</strong></div>
                <div>Cleaned Rows: <strong>{uploadResult.cleaned_row_count}</strong></div>
                <div>Duplicates Dropped: <strong>{uploadResult.duplicates_removed}</strong></div>
                <div>Missing Imputed: <strong>{uploadResult.total_missing_values}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Active Datasets & Version Tracking */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                Active Dataset Versions
              </h3>
              <button
                onClick={loadDatasets}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800"
                title="Refresh datasets"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800 overflow-y-auto max-h-72">
              {datasets.map((d) => (
                <div
                  key={d.id}
                  className="py-3 flex items-center justify-between text-xs hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-200">{d.name}</span>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-mono ${
                          d.is_synthetic
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        }`}
                      >
                        {d.is_synthetic ? 'Synthetic Demo' : 'Live Verified'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {d.filename} • {d.row_count} rows • {d.dataset_type}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => loadPreview(d.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                      title="Preview Rows"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={`/api/datasets/${d.id}/download`}
                      download
                      className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                      title="Download Cleaned CSV"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {!d.is_synthetic && (
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete Dataset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {datasets.length === 0 && (
                <div className="py-6 text-center text-gray-500 text-xs">
                  No datasets currently registered.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Preview Table */}
      {previewData && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-sky-500/15 glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Table className="w-4 h-4 text-cyan-400" />
              Dataset Data Preview: <span className="text-cyan-300">{previewData.record.name}</span>
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              Showing first {previewData.preview.length} of {previewData.total_rows} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="text-[10px] uppercase font-mono text-gray-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  {previewData.columns.map((col: string, idx: number) => (
                    <th key={idx} className="px-3 py-2.5 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-sans">
                {previewData.preview.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                    {previewData.columns.map((col: string, cIdx: number) => (
                      <td key={cIdx} className="px-3 py-2 whitespace-nowrap font-mono text-[11px]">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
