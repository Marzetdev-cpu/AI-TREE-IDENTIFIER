
import React, { useState, useCallback, useMemo } from 'react';
import { identifyTree } from './services/geminiService';
import type { TreeData } from './types';

const LeafIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const Spinner = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
    <p className="text-green-700">Analyzing your tree...</p>
  </div>
);

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  previewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, previewUrl }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div className="w-full">
      <label htmlFor="file-upload" className="cursor-pointer">
        {previewUrl ? (
          <img src={previewUrl} alt="Tree preview" className="w-full h-64 md:h-80 object-cover rounded-lg shadow-md border-4 border-white" />
        ) : (
          <div className="w-full h-64 md:h-80 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <UploadIcon />
            <p className="mt-2 text-sm text-gray-600">Click to upload or take a photo</p>
            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
          </div>
        )}
      </label>
      <input
        id="file-upload"
        name="file-upload"
        type="file"
        className="sr-only"
        accept="image/png, image/jpeg"
        onChange={handleFileChange}
      />
    </div>
  );
};

interface ResultDisplayProps {
  data: TreeData;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data }) => (
  <div className="w-full bg-white p-6 rounded-lg shadow-lg animate-fade-in space-y-4">
    <div className="text-center">
      <h2 className="text-3xl font-bold text-green-800">{data.commonName}</h2>
      <p className="text-md italic text-gray-500 mt-1">{data.scientificName}</p>
    </div>
    <p className="text-gray-700 text-base leading-relaxed">{data.description}</p>
    {data.careTips && data.careTips.length > 0 && (
      <div>
        <h3 className="text-xl font-semibold text-green-700 mt-4 mb-2 border-b pb-1">Care Tips</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          {data.careTips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);


export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  const handleIdentify = useCallback(async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setTreeData(null);

    try {
      const result = await identifyTree(selectedFile);
      setTreeData(result);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);
  
  const handleReset = () => {
    setSelectedFile(null);
    setTreeData(null);
    setError(null);
    setIsLoading(false);
    if(previewUrl){
        URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-green-800 tracking-tight">
            AI Tree Identifier
          </h1>
          <p className="mt-2 text-lg text-green-600">
            Discover the trees around you with a single photo.
          </p>
        </header>

        <main className="bg-white/70 backdrop-blur-sm rounded-xl shadow-2xl p-6 space-y-6">
          <ImageUploader onImageSelect={setSelectedFile} previewUrl={previewUrl} />

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleIdentify}
              disabled={!selectedFile || isLoading}
              className="flex-grow inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            >
              <LeafIcon />
              <span className="ml-2">{isLoading ? 'Identifying...' : 'Identify Tree'}</span>
            </button>
             { (selectedFile || treeData || error) && (
                 <button
                    onClick={handleReset}
                    className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                    Start Over
                </button>
             )}
          </div>

          <div className="mt-6">
            {isLoading && <Spinner />}
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
            {treeData && <ResultDisplay data={treeData} />}
            {!isLoading && !error && !treeData && !selectedFile && (
                <div className="text-center text-gray-500 p-4 border-2 border-dashed rounded-lg">
                    <p>Upload a photo of a tree to get started!</p>
                </div>
            )}
          </div>
        </main>

        <footer className="text-center mt-8 text-sm text-gray-500">
          <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
}
