
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, Search, Database, X, Loader2, Trash2, 
  Edit3, TrendingDown, Info, ClipboardList, 
  AlertCircle, Sparkles, FileSpreadsheet, TrendingUp, 
  CheckCircle, ChevronRight, Download, Upload, 
  FileText, Briefcase, Camera
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { SORItem, TenderItem, VisionAnalysisResult } from './types';
import { geminiService } from './services/geminiService';
import RateForm from './components/RateForm';
import RateList from './components/RateList';
import VisionEstimator from './components/VisionEstimator';

const generateCSV = (headers: string[], rows: any[][], fileName: string) => {
  const content = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
    ...rows.map(row => row.map(cell => {
      const val = cell === null || cell === undefined ? "" : String(cell);
      return `"${val.replace(/"/g, '""')}"`;
    }).join(","))
  ].join("\r\n");
  
  const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${fileName}_${new Date().toLocaleDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const App: React.FC = () => {
  const [view, setView] = useState<'database' | 'tender' | 'vision'>('database');
  const [sorData, setSorData] = useState<SORItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SORItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tenderItems, setTenderItems] = useState<TenderItem[]>([]);
  const [isProcessingTender, setIsProcessingTender] = useState(false);
  const [tenderInputText, setTenderInputText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('smart_rate_store_v3');
    if (saved) {
      try {
        setSorData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved data");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smart_rate_store_v3', JSON.stringify(sorData));
  }, [sorData]);

  const handleAddOrUpdateRate = (item: Omit<SORItem, 'id' | 'timestamp'>) => {
    if (editingItem) {
      setSorData(prev => prev.map(r => r.id === editingItem.id ? { ...item, id: r.id, timestamp: r.timestamp } : r));
    } else {
      setSorData(prev => [{ ...item, id: crypto.randomUUID(), timestamp: Date.now() }, ...prev]);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleBackup = () => {
    const blob = new Blob([JSON.stringify(sorData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartrate_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDatabase = () => {
    const headers = ['Item Name', 'Unit', 'Rate (₹)', 'Scope of Work', 'Source Reference', 'Date Added'];
    const rows = sorData.map(i => [
      i.name,
      i.unit,
      i.rate,
      i.scopeOfWork,
      i.source,
      new Date(i.timestamp).toLocaleDateString()
    ]);
    generateCSV(headers, rows, 'SmartRate_Database');
  };

  const handleExportTender = () => {
    const headers = [
      'Tender Item', 'Quantity', 'Requested Scope', 'Estimated Rate (₹)', 
      'Quoted Rate (₹)', 'Unit', 'Total Quoted (₹)', 'Matched Database Item',
      'Source', 'Status'
    ];
    const rows = tenderItems.map(i => [
      i.name, i.quantity, i.requestedScope, i.estimatedRate || 'N/A',
      i.matchedRate?.rate || 'N/A', i.matchedRate?.unit || 'N/A',
      (i.quantity * (i.matchedRate?.rate || 0)).toFixed(2),
      i.matchedRate?.name || 'N/A', i.matchedRate?.source || '', i.status.toUpperCase()
    ]);
    generateCSV(headers, rows, 'SmartRate_Quotation');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          if (confirm(`Restore ${data.length} items? This will replace your current database.`)) {
            setSorData(data);
          }
        }
      } catch (e) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleProcessTender = async (itemsToProcess?: any[]) => {
    setIsProcessingTender(true);
    const parsed = itemsToProcess || await geminiService.parseBulkItems(tenderInputText);
    const results: TenderItem[] = [];
    for (const p of parsed) {
      const matchedId = await geminiService.findBestMatchingItem(
        p.name || p.item, 
        p.requestedScope || p.estimatedScope, 
        sorData.map(d => ({ id: d.id, name: d.name }))
      );
      const match = sorData.find(d => d.id === matchedId);
      results.push({
        id: crypto.randomUUID(),
        name: p.name || p.item,
        quantity: p.quantity || 1,
        requestedScope: p.requestedScope || p.estimatedScope,
        estimatedRate: p.estimatedRate,
        matchedRate: match,
        status: match ? 'matched' : 'no-match'
      });
    }
    setTenderItems(results);
    setView('tender');
    setIsProcessingTender(false);
  };

  const filteredRates = useMemo(() => sorData.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.source.toLowerCase().includes(searchQuery.toLowerCase())
  ), [sorData, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b h-16 flex items-center px-6 justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center">
            <Briefcase className="text-white w-5 h-5" />
          </div>
          <span className="font-black text-xl tracking-tighter hidden sm:block">SmartRate <span className="text-indigo-500">Vision</span></span>
        </div>
        
        <nav className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button onClick={() => setView('database')} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'database' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>Database</button>
          <button onClick={() => setView('vision')} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'vision' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>Site Audit</button>
          <button onClick={() => setView('tender')} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'tender' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>Tender</button>
        </nav>

        <div className="flex items-center space-x-2">
          <button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
            <Plus className="w-4 h-4 mr-1" /> Add Rate
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-10">
        {view === 'database' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
              <div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Rate Repository</h1>
                <p className="text-slate-400 font-medium">Managing {sorData.length} technical benchmark entries.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="relative group w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input placeholder="Search items or refs..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                
                <div className="flex space-x-2">
                  <button onClick={handleExportDatabase} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Export Excel">
                    <FileSpreadsheet className="w-5 h-5" />
                  </button>
                  <button onClick={handleBackup} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all" title="Backup JSON">
                    <Download className="w-5 h-5" />
                  </button>
                  <label className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer">
                    <Upload className="w-5 h-5" />
                    <input type="file" className="hidden" accept=".json" onChange={handleRestore} />
                  </label>
                </div>
              </div>
            </div>
            
            <RateList 
              rates={filteredRates} 
              allRates={sorData} 
              onDelete={id => setSorData(s => s.filter(i => i.id !== id))} 
              onEdit={i => { setEditingItem(i); setIsFormOpen(true); }} 
            />
          </div>
        )}

        {view === 'vision' && (
          <VisionEstimator onBOMGenerated={handleProcessTender} />
        )}

        {view === 'tender' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {tenderItems.length === 0 ? (
              <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 text-center shadow-sm">
                <ClipboardList className="w-20 h-20 text-indigo-50 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Automated Quote Generator</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">Paste items or use the Vision Site Audit tool to generate a professional quotation.</p>
                <textarea className="w-full h-48 p-5 border border-slate-200 rounded-3xl bg-slate-50 mb-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Paste items (e.g., 5 units of 10HP Pump...)" value={tenderInputText} onChange={e => setTenderInputText(e.target.value)} />
                <button onClick={() => handleProcessTender()} disabled={isProcessingTender || !tenderInputText.trim() || sorData.length === 0} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 flex items-center justify-center transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50">
                  {isProcessingTender ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Sparkles className="w-6 h-6 mr-2" />} Build Quote from Database
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Technical Analysis</h2>
                    <p className="text-slate-500 text-sm">Validating requirements against benchmark database</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={handleExportTender} className="flex items-center px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-emerald-700 transition-all">
                      <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
                    </button>
                    <button onClick={() => setTenderItems([])} className="p-2.5 bg-white border border-slate-200 text-slate-300 hover:text-red-500 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {tenderItems.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col sm:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-slate-800 text-lg">{item.name}</h4>
                          <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Qty: {item.quantity}</span>
                        </div>
                        <p className="text-xs text-slate-400 italic mb-4 line-clamp-1 leading-relaxed">Scope: {item.requestedScope}</p>
                        {item.matchedRate ? (
                          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Verified Match</p>
                            <p className="font-bold text-indigo-700 text-sm">{item.matchedRate.name}</p>
                          </div>
                        ) : (
                          <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-500 text-xs font-bold uppercase flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" /> No database match
                          </div>
                        )}
                      </div>
                      <div className="text-right min-w-[220px] border-t sm:border-t-0 sm:border-l border-slate-50 pt-4 sm:pt-0 sm:pl-8 flex flex-col justify-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Extension</span>
                        <div className="text-4xl font-black text-indigo-600 tracking-tighter">₹{(item.quantity * (item.matchedRate?.rate || 0)).toLocaleString()}</div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">₹{(item.matchedRate?.rate || 0).toLocaleString()} / {item.matchedRate?.unit || 'unit'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900 text-white p-10 rounded-[3rem] flex flex-col sm:flex-row justify-between items-center shadow-2xl">
                  <div>
                    <h3 className="text-2xl font-bold">Consolidated Bid Total</h3>
                    <p className="text-slate-400 text-sm mt-1">Sum of validated benchmarks</p>
                  </div>
                  <div className="text-5xl sm:text-6xl font-black text-indigo-400 tracking-tighter">
                    ₹{tenderItems.reduce((s, i) => s + (i.quantity * (i.matchedRate?.rate || 0)), 0).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <RateForm 
              editingItem={editingItem} 
              onSubmit={handleAddOrUpdateRate} 
              onBulkSubmit={items => { 
                setSorData(prev => [...items.map(i => ({ ...i, id: crypto.randomUUID(), timestamp: Date.now() })), ...prev]); 
                setIsFormOpen(false); 
              }} 
              onCancel={() => setIsFormOpen(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
