
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, Search, Database, X, Loader2, Trash2, 
  Edit3, TrendingDown, Info, ClipboardList, 
  AlertCircle, Sparkles, FileSpreadsheet, TrendingUp, 
  CheckCircle, ChevronRight, Download, Upload, 
  FileText, Briefcase, Camera, ArrowRight
} from 'lucide-react';
import { SORItem } from './types';
import RateForm from './components/RateForm';
import RateList from './components/RateList';
import VisionEstimator from './components/VisionEstimator';
import { INITIAL_SOR_DATA } from './data';

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
  const [view, setView] = useState<'database' | 'vision'>('database');
  const [sorData, setSorData] = useState<SORItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SORItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('smart_rate_store_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSorData(parsed);
        } else {
          const seeded = INITIAL_SOR_DATA.map(item => ({
            ...item,
            id: crypto.randomUUID(),
            timestamp: Date.now()
          }));
          setSorData(seeded);
        }
      } catch (e) {
        console.error("Failed to load saved data");
      }
    } else {
      const seeded = INITIAL_SOR_DATA.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      }));
      setSorData(seeded);
    }
  }, []);

  useEffect(() => {
    if (sorData.length > 0) {
      localStorage.setItem('smart_rate_store_v3', JSON.stringify(sorData));
    }
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
          <button onClick={() => setView('database')} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'database' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Database</button>
          <button onClick={() => setView('vision')} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${view === 'vision' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Site Audit</button>
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
                <p className="text-slate-400 font-medium">Managing {sorData.length} entries.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="relative group w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input placeholder="Search..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all text-base" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
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
          <VisionEstimator sorData={sorData} />
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
