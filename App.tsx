import React, { useState } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ResultsDisplay from './components/ResultsDisplay';
import { analyzeImage } from './services/geminiService';
import { embedMetadata } from './services/metadataService';
import { AppState, SeoData } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalBase64, setOriginalBase64] = useState<string | null>(null);
  const [seoData, setSeoData] = useState<SeoData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleImageSelect = async (base64: string, mimeType: string, file: File) => {
    setAppState(AppState.ANALYZING);
    setPreviewUrl(URL.createObjectURL(file));
    setOriginalBase64(base64);
    setFileName(file.name);
    setSeoData(null);

    try {
      const result = await analyzeImage(base64, mimeType);
      
      const completeData: SeoData = {
        ...result,
        copyright: 'tamimseopro',
        filename: file.name
      };
      
      setSeoData(completeData);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
    }
  };

  const handleDownload = async (format: 'json' | 'txt' | 'image') => {
    if (!seoData) return;

    if (format === 'image') {
      if (!originalBase64) return;
      
      try {
        setIsProcessingImage(true);
        // This returns a Data URL (data:image/jpeg;base64,...)
        const newImageDataUrl = await embedMetadata(originalBase64, seoData);
        
        const link = document.createElement('a');
        link.href = newImageDataUrl;
        // Ensure we save as jpg since metadata standard used is for jpeg
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        link.download = `${nameWithoutExt}-optimized.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error("Failed to embed metadata", e);
        alert("Could not process image metadata.");
      } finally {
        setIsProcessingImage(false);
      }
      return;
    }

    // Existing Logic for JSON/TXT
    let content = '';
    let type = '';
    let extension = '';

    if (format === 'json') {
      content = JSON.stringify(seoData, null, 2);
      type = 'application/json';
      extension = 'json';
    } else {
      content = `
FILE ANALYSIS REPORT
====================
Filename: ${seoData.filename}
Date: ${new Date().toLocaleString()}

TITLE:
${seoData.title}

SUBJECT:
${seoData.subject}

RATING:
${seoData.rating} / 5 Stars

COPYRIGHT:
${seoData.copyright}

COMMENTS/DESCRIPTION:
${seoData.comments}

TAGS (100):
${seoData.tags}
      `.trim();
      type = 'text/plain';
      extension = 'txt';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    link.download = `seo-${nameWithoutExt}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setPreviewUrl(null);
    setSeoData(null);
    setOriginalBase64(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Intro Section */}
        {appState === AppState.IDLE && (
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Optimize Your Images for Search
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Upload an image to automatically generate titles, subjects, tags, and ratings powered by Google Gemini.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Upload & Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Upload Image</h3>
              <ImageUploader 
                onImageSelected={handleImageSelect} 
                isLoading={appState === AppState.ANALYZING} 
              />
              
              {appState === AppState.ANALYZING && (
                <div className="mt-6 flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mb-3"></div>
                  <p className="text-brand-600 font-medium animate-pulse">Analyzing image aesthetics...</p>
                  <p className="text-xs text-slate-400 mt-1">Generating 100+ tags</p>
                </div>
              )}

              {appState === AppState.ERROR && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <span className="font-bold">Error:</span> Could not analyze image. Please ensure your API Key is set correctly and try again.
                  <button onClick={handleReset} className="block mt-2 underline text-red-800">Try Again</button>
                </div>
              )}
            </div>

            {previewUrl && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Preview</h3>
                <img 
                  src={previewUrl} 
                  alt="Uploaded preview" 
                  className="w-full h-auto rounded-lg object-contain bg-slate-100 max-h-[400px]" 
                />
                {appState === AppState.SUCCESS && (
                    <button 
                        onClick={handleReset}
                        className="w-full mt-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-sm transition-colors"
                    >
                        Upload Different Image
                    </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            {appState === AppState.SUCCESS && seoData && (
              <ResultsDisplay 
                data={seoData} 
                onDownload={handleDownload} 
                isProcessingImage={isProcessingImage}
              />
            )}
            
            {appState === AppState.IDLE && (
              <div className="hidden lg:flex h-full items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="text-center text-slate-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l5.414 5.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z"/></svg>
                  <p>Results will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;