
import React, { useState, useRef, useMemo } from 'react';
import { Camera, Loader2, ShieldAlert, Wrench, Zap, HardHat, FileText, X, Image as ImageIcon, Sparkles, Ruler, Construction, PenTool, Upload, Check } from 'lucide-react';
import { analyzeSiteImage } from '../services/geminiService';
import { VisionAnalysisResult, SORItem } from '../types';

interface VisionEstimatorProps {
  sorData: SORItem[];
}

const VisionEstimator: React.FC<VisionEstimatorProps> = ({ sorData }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);
  const [workType, setWorkType] = useState<'New Construction' | 'Maintenance' | 'Damage Repair'>('Maintenance');
  const [dimensions, setDimensions] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive unique facilities (sources) from the database
  const facilityOptions = useMemo(() => {
    const sources = Array.from(new Set(sorData.map(item => item.source))).filter(Boolean);
    return sources.sort();
  }, [sorData]);

  const toggleFacility = (facility: string) => {
    setSelectedFacilities(prev => 
      prev.includes(facility) 
        ? prev.filter(f => f !== facility) 
        : [...prev, facility]
    );
  };

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
    if (!image || selectedFacilities.length === 0 || !dimensions) {
      alert("Please upload an image, select at least one facility, and provide dimensions.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      
      // Filter database items relevant to ALL selected facilities
      const relevantDbItems = sorData.filter(item => selectedFacilities.includes(item.source));

      const analysis = await analyzeSiteImage(
        base64Data, 
        mimeType, 
        workType, 
        selectedFacilities, 
        dimensions, 
        relevantDbItems
      );
      
      setResult(analysis);
    } catch (err) {
      console.error(err);
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
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">AI Site Audit & Estimator</h2>
            <p className="text-slate-500 text-sm">Contextual estimation using your Rate Repository.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Site Image
                </span>
                {!image ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                  >
                    <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-bold">Upload site photo</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 group aspect-video">
                    <img src={image} alt="Site capture" className="w-full h-full object-cover" />
                    <button onClick={() => setImage(null)} className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </label>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Construction className="w-3 h-3" /> Work Type
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(['New Construction', 'Maintenance', 'Damage Repair'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setWorkType(type)}
                      className={`px-4 py-2.5 rounded-xl text-left text-sm font-bold border transition-all ${
                        workType === type 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <PenTool className="w-3 h-3" /> Select Facilities
                </label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                  {facilityOptions.map(opt => {
                    const isActive = selectedFacilities.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleFacility(opt)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                          isActive 
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-200'
                        }`}
                      >
                        {isActive && <Check className="w-3 h-3" />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {selectedFacilities.length === 0 && (
                  <p className="text-[10px] text-slate-400 mt-1 italic">Select one or more facilities to audit.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Ruler className="w-3 h-3" /> Area / Dimensions
                </label>
                <input 
                  type="text"
                  placeholder="e.g. 50 sqm, 10m x 5m, 12 units"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                />
              </div>

              <button 
                onClick={handleAnalysis} 
                disabled={isAnalyzing || !image || selectedFacilities.length === 0 || !dimensions}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 mt-4"
              >
                {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                {isAnalyzing ? 'Processing...' : 'Generate AI Estimate'}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6 h-[700px] overflow-y-auto pr-2 scrollbar-thin">
            {result ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-indigo-900 text-lg">Analysis Summary</h3>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-indigo-600 border border-indigo-100 uppercase tracking-wider">
                        {workType}
                      </span>
                    </div>
                  </div>
                  <p className="text-indigo-700 text-sm leading-relaxed">{result.summary}</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Identified Issues & Scope</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          <p className="text-xs text-slate-500 mt-1 leading-tight">{p.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Generated SOR Table</h3>
                  </div>
                  <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="px-4 py-3">Work Item</th>
                          <th className="px-4 py-3">Quantity</th>
                          <th className="px-4 py-3">Rate (₹)</th>
                          <th className="px-4 py-3 text-right">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {result.bom.map((bomItem, i) => {
                          // Find matching rate in database
                          const dbMatch = sorData.find(d => d.name.toLowerCase() === bomItem.item.toLowerCase());
                          const rate = dbMatch?.rate || 0;
                          const total = bomItem.quantity * rate;
                          
                          return (
                            <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-4">
                                <div className="font-bold text-white mb-0.5">{bomItem.item}</div>
                                <div className="text-[10px] text-slate-500 line-clamp-1">{bomItem.estimatedScope}</div>
                              </td>
                              <td className="px-4 py-4 font-medium">{bomItem.quantity} {bomItem.unit}</td>
                              <td className="px-4 py-4">₹{rate.toLocaleString()}</td>
                              <td className="px-4 py-4 text-right font-black text-indigo-400">₹{total.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-800/50">
                        <tr>
                          <td colSpan={3} className="px-4 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Estimated Grand Total</td>
                          <td className="px-4 py-4 text-right font-black text-2xl text-white tracking-tighter">
                            ₹{result.bom.reduce((acc, bomItem) => {
                              const dbMatch = sorData.find(d => d.name.toLowerCase() === bomItem.item.toLowerCase());
                              return acc + (bomItem.quantity * (dbMatch?.rate || 0));
                            }, 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                  <Sparkles className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Estimate Engine Ready</h3>
                <p className="text-sm font-medium mt-2 max-w-xs mx-auto text-slate-500">
                  Upload an image and select your facility categories on the left to generate a multi-facility audit.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisionEstimator;
