
import React, { useState, useRef, useMemo } from 'react';
import { Camera, Loader2, ShieldAlert, Wrench, Zap, HardHat, FileText, X, Image as ImageIcon, Sparkles, Ruler, Construction, PenTool, Upload, Check, Hash, LayoutGrid } from 'lucide-react';
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
  const [facilityDimensions, setFacilityDimensions] = useState<Record<string, string>>({});
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const facilityOptions = useMemo(() => {
    const sources = Array.from(new Set(sorData.map(item => item.source))).filter(Boolean);
    return sources.sort();
  }, [sorData]);

  const toggleFacility = (facility: string) => {
    setSelectedFacilities(prev => {
      const isSelected = prev.includes(facility);
      if (isSelected) {
        const { [facility]: _, ...rest } = facilityDimensions;
        setFacilityDimensions(rest);
        return prev.filter(f => f !== facility);
      } else {
        setFacilityDimensions(prevDims => ({ ...prevDims, [facility]: '' }));
        return [...prev, facility];
      }
    });
  };

  const handleDimensionChange = (facility: string, value: string) => {
    setFacilityDimensions(prev => ({ ...prev, [facility]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = useMemo(() => {
    if (!image || selectedFacilities.length === 0) return false;
    return selectedFacilities.every(f => facilityDimensions[f] && facilityDimensions[f].trim().length > 0);
  }, [image, selectedFacilities, facilityDimensions]);

  const handleAnalysis = async () => {
    if (!isFormValid) {
      alert("Please upload an image, select facilities, and provide dimensions for each.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const base64Data = image!.split(',')[1];
      const mimeType = image!.split(';')[0].split(':')[1];
      const relevantDbItems = sorData.filter(item => selectedFacilities.includes(item.source));

      const analysis = await analyzeSiteImage(
        base64Data, 
        mimeType, 
        workType, 
        selectedFacilities, 
        facilityDimensions, 
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

  const calculateGrandTotal = () => {
    if (!result) return 0;
    return result.facilityEstimates.reduce((acc, facility) => {
      return acc + facility.items.reduce((fAcc, item) => {
        const dbMatch = sorData.find(d => d.name.toLowerCase() === item.item.toLowerCase());
        return fAcc + (item.quantity * (dbMatch?.rate || 0));
      }, 0);
    }, 0);
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
            <p className="text-slate-500 text-sm">Contextual facility-wise estimation.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inputs Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Site Image
                </span>
                {!image ? (
                  <label className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group flex flex-col items-center justify-center">
                    <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-bold">Upload site photo</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 group aspect-video">
                    <img src={image} alt="Site capture" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImage(null); }} 
                      className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

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
                        workType === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
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
                          isActive ? 'bg-indigo-100 border-indigo-300 text-indigo-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-200'
                        }`}
                      >
                        {isActive && <Check className="w-3 h-3" />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedFacilities.length > 0 && (
                <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Ruler className="w-3 h-3" /> Specify Dimensions
                  </label>
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {selectedFacilities.map(facility => (
                      <div key={facility} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{facility}</span>
                        </div>
                        <div className="relative group">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
                          <input 
                            type="text"
                            placeholder="e.g. 50 sqm, 10m x 5m, 12 units"
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-base font-medium transition-all"
                            value={facilityDimensions[facility] || ''}
                            onChange={(e) => handleDimensionChange(facility, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={handleAnalysis} 
                disabled={isAnalyzing || !isFormValid}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 mt-4"
              >
                {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                {isAnalyzing ? 'Processing Sectionally...' : 'Generate AI Estimate'}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-8 h-[700px] overflow-y-auto pr-2 scrollbar-thin">
            {result ? (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-indigo-900 text-lg">Site Analysis Summary</h3>
                    <span className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-indigo-600 border border-indigo-100 uppercase tracking-wider">{workType}</span>
                  </div>
                  <p className="text-indigo-700 text-sm leading-relaxed">{result.summary}</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Observed Technical Issues</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.problems.map((p, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className={`p-2 rounded-lg ${p.severity === 'High' ? 'bg-red-50 text-red-600' : p.severity === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                          {getCategoryIcon(p.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{p.category}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${p.severity === 'High' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{p.severity}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-tight">{p.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Sectioned Schedule of Rates</h3>
                    <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded">Total Facility Areas: {result.facilityEstimates.length}</div>
                  </div>

                  {result.facilityEstimates.map((facilityGroup, idx) => {
                    const facilitySubtotal = facilityGroup.items.reduce((acc, item) => {
                      const dbMatch = sorData.find(d => d.name.toLowerCase() === item.item.toLowerCase());
                      return acc + (item.quantity * (dbMatch?.rate || 0));
                    }, 0);

                    return (
                      <div key={idx} className="space-y-3 animate-in fade-in duration-300 delay-100">
                        <div className="flex items-center gap-2 px-1">
                          <LayoutGrid className="w-4 h-4 text-indigo-500" />
                          <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">{facilityGroup.facility}</h4>
                          <div className="h-px flex-1 bg-slate-100 ml-2"></div>
                        </div>
                        
                        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-widest">
                              <tr>
                                <th className="px-5 py-3">Work Item</th>
                                <th className="px-5 py-3">Qty</th>
                                <th className="px-5 py-3">Rate (₹)</th>
                                <th className="px-5 py-3 text-right">Subtotal (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {facilityGroup.items.map((bomItem, i) => {
                                const dbMatch = sorData.find(d => d.name.toLowerCase() === bomItem.item.toLowerCase());
                                const rate = dbMatch?.rate || 0;
                                const total = bomItem.quantity * rate;
                                
                                return (
                                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-4">
                                      <div className="font-bold text-slate-800 mb-0.5">{bomItem.item}</div>
                                      <div className="text-[10px] text-slate-400 line-clamp-1 italic">{bomItem.estimatedScope}</div>
                                    </td>
                                    <td className="px-5 py-4 font-medium text-slate-600">{bomItem.quantity} {bomItem.unit}</td>
                                    <td className="px-5 py-4 text-slate-500 font-medium">₹{rate.toLocaleString()}</td>
                                    <td className="px-5 py-4 text-right font-black text-indigo-600">₹{total.toLocaleString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-indigo-50/30">
                              <tr>
                                <td colSpan={3} className="px-5 py-3 font-bold text-indigo-700 text-[10px] uppercase tracking-wider">Subtotal: {facilityGroup.facility}</td>
                                <td className="px-5 py-3 text-right font-black text-sm text-indigo-900">₹{facilitySubtotal.toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-8 p-8 bg-slate-900 rounded-[3rem] text-white flex flex-col sm:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold">Estimated Project Total</h3>
                      <p className="text-slate-400 text-xs mt-1">Consolidated estimate for all selected facilities.</p>
                    </div>
                    <div className="mt-6 sm:mt-0 relative z-10 text-right">
                      <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-indigo-400">
                        ₹{calculateGrandTotal().toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-500 mt-2 tracking-widest">
                        Inclusive of all {result.facilityEstimates.length} facility sections
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                  <Sparkles className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Audit Engine Ready</h3>
                <p className="text-sm font-medium mt-2 max-w-xs mx-auto text-slate-500">
                  Select facilities and provide dimensions. The AI will generate a facility-wise detailed Schedule of Rates.
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
