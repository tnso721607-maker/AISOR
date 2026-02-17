
import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, ShieldAlert, Wrench, Zap, HardHat, FileText, Send, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { analyzeSiteImage } from '../services/geminiService';
import { VisionAnalysisResult } from '../types';

const VisionEstimator: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      const analysis = await analyzeSiteImage(base64Data, mimeType);
      setResult(analysis);
    } catch (err) {
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Civil': return <HardHat className="w-4 h-4" />;
      case 'Electrical': return <Zap className="w-4 h-4" />;
      case 'Mechanical': return <Wrench className="w-4 h-4" />;
      case 'Safety': return <ShieldAlert className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-600 p-2.5 rounded-xl">
            <Camera className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">AI Site Audit</h2>
            <p className="text-slate-500 text-sm">Upload maintenance photos to identify issues and generate BOMs.</p>
          </div>
        </div>

        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
          >
            <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-8 h-8 text-indigo-500" />
            </div>
            <p className="text-slate-600 font-bold text-lg">Click to upload or take a photo</p>
            <p className="text-slate-400 text-sm mt-1">Supports Petrol Pump facility audits, damaged DU, pavement cracks, etc.</p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="relative rounded-[2rem] overflow-hidden border border-slate-200 shadow-inner group">
                <img src={image} alt="Site capture" className="w-full aspect-video object-cover" />
                <button onClick={() => setImage(null)} className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button 
                onClick={handleAnalysis} 
                disabled={isAnalyzing}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100"
              >
                {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                {isAnalyzing ? 'Analyzing Site Image...' : 'Run AI Damage Assessment'}
              </button>
            </div>

            <div className="space-y-6 h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              {result ? (
                <>
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl">
                    <h3 className="font-bold text-indigo-900 mb-2">Audit Summary</h3>
                    <p className="text-indigo-700 text-sm leading-relaxed">{result.summary}</p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Identified Issues</h3>
                    {result.problems.map((p, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className={`p-2 rounded-lg ${
                          p.severity === 'High' ? 'bg-red-50 text-red-600' : 
                          p.severity === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                        }`}>
                          {getCategoryIcon(p.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{p.category}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                              p.severity === 'High' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>{p.severity}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Generated BOM</h3>
                    </div>
                    {result.bom.map((item, i) => (
                      <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl border-dashed">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-800 text-sm">{item.item}</span>
                          <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded">Qty: {item.quantity} {item.unit}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 italic">{item.estimatedScope}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ImageIcon className="w-12 h-12 mb-3" />
                  <p className="text-sm font-medium">Audit report will appear here<br/>after image analysis.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionEstimator;
