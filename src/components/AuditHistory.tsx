import { Share2, RotateCcw, ShieldAlert, X, ChevronLeft, Trash2, Download } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatNaira } from '../utils/format';
import ReceiptView, { exportReceiptAsPng } from './ReceiptView';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

export default function AuditHistory() {
  const { auditLog, voidTransaction, updateVoidState } = useInventory();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [receiptEntry, setReceiptEntry] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [pinEntry, setPinEntry] = useState('');
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const voidState = profile?.voidState || { isLocked: false, lockedUntil: null, failures: 0 };
  const isGloballyLocked = voidState.isLocked && voidState.lockedUntil && Date.now() < voidState.lockedUntil;

  const handleShare = async (entry: any) => {
    if (!profile) return;
    setReceiptEntry(entry);
    setIsExporting(true);
    
    // Give react a tick to render the component so it's in the DOM
    setTimeout(async () => {
      const fileName = `Receipt_${entry.productName.replace(/\s+/g, '_')}_${Date.now()}`;
      const success = await exportReceiptAsPng('receipt-thermal-ticket', fileName);
      if (success) {
        showToast('RECEIPT SAVED TO GALLERY', 'success');
      } else {
        showToast('Export failed. Please check permissions.', 'error');
      }
      setIsExporting(false);
      setReceiptEntry(null);
    }, 500);
  };

  const isToday = (timestamp: number) => {
    const d = new Date(timestamp);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const handleVoidClick = (entry: any) => {
    if (isGloballyLocked) {
      const minsLeft = Math.ceil((voidState.lockedUntil! - Date.now()) / 60000);
      showToast(`ACCESS DENIED: Wait ${minsLeft} more mins`, 'error');
      return;
    }
    setSelectedEntry(entry);
    setPinEntry('');
  };

  const handleKeypadPress = (val: string) => {
    if (pinEntry.length < 4) {
      setPinEntry(prev => prev + val);
    }
  };

  const handleDelete = () => {
    setPinEntry(prev => prev.slice(0, -1));
  };

  const verifyPin = async () => {
    if (pinEntry.length !== 4) return;

    if (pinEntry === profile?.adminPin) {
      const success = await voidTransaction(selectedEntry.id);
      if (success) {
        showToast('REVERSAL COMPLETED: DATA UPDATED', 'success');
        setPinEntry('');
        setSelectedEntry(null);
      }
    } else {
      const newFailures = voidState.failures + 1;
      setPinEntry('');

      if (newFailures >= 3) {
        const until = Date.now() + (30 * 60 * 1000); // 30 mins
        await updateVoidState({ 
          failures: newFailures, 
          isLocked: true, 
          lockedUntil: until 
        });
        showToast('GLOBAL SECURITY LOCKOUT ACTIVATED', 'error');
        setSelectedEntry(null);
      } else {
        await updateVoidState({ failures: newFailures });
        showToast(`Invalid PIN - ${3 - newFailures} attempts remaining`, 'warning');
      }
    }
  };

  useEffect(() => {
    if (pinEntry.length === 4) {
      verifyPin();
    }
  }, [pinEntry]);

  const getEntryColor = (entry: any) => {
    if (entry.isVoided) return 'bg-red-50 dark:bg-red-950/20 border-red-500/30';
    if (entry.type === 'Restock') return 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800';
    return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30';
  };

  const filteredAuditLog = useMemo(() => {
    return auditLog.filter(entry => {
      // 1. Search Query
      const matchesSearch = 
        entry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.variantName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Date Range
      let matchesDate = true;
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      const entryTime = entryDate.getTime();

      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (entryTime < from.getTime()) matchesDate = false;
      }
      
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(0, 0, 0, 0);
        if (entryTime > to.getTime()) matchesDate = false;
      }

      return matchesSearch && matchesDate;
    });
  }, [auditLog, searchQuery, dateFrom, dateTo]);

  const Row = ({ index, style }: any) => {
    const entry = filteredAuditLog[index];
    if (!entry) return null;
    return (
      <div style={style} className="px-6 py-2">
        <div className={`flex gap-6 items-start ${entry.isVoided ? 'opacity-70' : ''}`}>
          <div className={`mt-2 w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            entry.isVoided
              ? 'bg-red-500 border-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
              : entry.type === 'Restock' 
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500' 
              : 'bg-emerald-500 border-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
          }`}>
            {entry.isVoided ? <X size={16} strokeWidth={3} /> : <span className="font-black text-sm">{entry.type === 'Restock' ? '+' : '-'}</span>}
          </div>

          <div className={`flex-1 p-4 border rounded-xl transition-all shadow-sm ${getEntryColor(entry)}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {entry.type === 'Sale' && (
                  <button 
                    onClick={() => handleShare(entry)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                  >
                    <Share2 size={12} />
                  </button>
                )}
                {entry.type === 'Sale' && !entry.isVoided && isToday(entry.timestamp) && (
                  <button 
                    onClick={() => handleVoidClick(entry)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[8px] font-black uppercase rounded transition-colors"
                  >
                    <RotateCcw size={10} /> Void
                  </button>
                )}
              </div>
              {entry.isVoided ? (
                <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded italic">VOIDED</span>
              ) : (
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  entry.type === 'Restock' 
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400' 
                    : 'bg-emerald-500 text-white'
                }`}>
                  {entry.type}
                </span>
              )}
            </div>
            
            <h3 className={`text-black dark:text-white font-bold uppercase text-sm truncate ${entry.isVoided ? 'line-through opacity-50' : ''}`}>
              {entry.productName}
            </h3>
            <p className={`text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-medium truncate ${entry.isVoided ? 'line-through opacity-50' : ''}`}>
              {entry.variantName}
            </p>
            
            <div className="mt-4 flex justify-between items-end border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
              <p className="text-slate-400 dark:text-slate-600 text-[10px] font-mono uppercase">
                Qty: {entry.type === 'Restock' ? `+${entry.quantity}` : `-${entry.quantity}`}
              </p>
              {entry.price && (
                <div className="text-right">
                  {entry.originalPrice && entry.price !== entry.originalPrice && !entry.isVoided && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 line-through font-bold mr-2 text-decoration-line: line-through">
                      {formatNaira(entry.originalPrice)}
                    </span>
                  )}
                  <p className={`inline-block font-black text-xs ${
                    entry.isVoided 
                      ? 'line-through text-red-500' 
                      : entry.originalPrice && entry.price < entry.originalPrice 
                      ? 'text-amber-500' 
                      : entry.originalPrice && entry.price > entry.originalPrice 
                      ? 'text-emerald-500' 
                      : 'text-black dark:text-white'
                  }`}>
                    {formatNaira(entry.price)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="audit-container" className="h-screen flex flex-col transition-colors">
      <div className="p-6 pb-1 flex justify-between items-end shrink-0">
        <div>
          <h1 id="audit-title" className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter mb-1">Audit</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase">Transaction Logs</p>
        </div>
        {isGloballyLocked && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg animate-pulse">
            <ShieldAlert size={14} />
            <span className="text-[10px] font-black uppercase">Secured</span>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-2 space-y-3 shrink-0">
        <div className="relative">
          <input 
            type="text"
            placeholder="SEARCH BY PRODUCT OR VARIANT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest placeholder:text-slate-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">From</label>
            <input 
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-[10px] font-bold uppercase focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">To</label>
            <input 
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-[10px] font-bold uppercase focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 1. Added pb-8 to the container below to reserve real physical spacing inside the flex block */}
      <div className="flex-1 min-h-0 relative pb-8">
        <div className="absolute left-[43px] top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-900 z-0" />
        
        {filteredAuditLog.length === 0 ? (
          <div className="p-20 text-center">
            <p className="text-slate-300 dark:text-slate-800 font-black uppercase tracking-tighter text-2xl">No transactions found</p>
            <p className="text-slate-500 text-xs mt-2 font-mono uppercase">Adjust your filters</p>
          </div>
        ) : (
          <AutoSizer
            renderProp={({ height, width }) => (
              <List<{}>
                rowCount={filteredAuditLog.length + 1}
                rowHeight={(index) => {
                  // 3. If it's our bonus virtual spacing index, give it a tight h-12 height for padding
                  if (index === filteredAuditLog.length) return 48; 
                  return 160; // Your existing card row height
                }}
                className="no-scrollbar"
                rowComponent={Row}
                rowProps={{}}
                style={{ height: height || 600, width: width || 400 }}
              />
            )}
          />
        )}
      </div>

      {/* Numeric Keypad Modal for PIN */}
      <AnimatePresence>
        {isExporting && receiptEntry && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="scale-75 opacity-0 absolute">
              <ReceiptView entry={receiptEntry} profile={profile!} />
            </div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl text-center"
            >
              <div className="w-12 h-12 border-4 border-slate-200 border-t-black dark:border-slate-800 dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-black dark:text-white font-black uppercase tracking-widest text-xs">Generating Receipt...</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEntry(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="text-center mb-8 relative">
                <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg mb-4">
                  <RotateCcw size={32} />
                </div>
                <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter mb-1">Void Control</h2>
                <p className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em]">Enter Admin PIN to confirm reversal</p>
              </div>

              {/* PIN Display */}
              <div className="flex justify-center gap-4 mb-10">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pinEntry.length > i 
                        ? 'bg-black dark:bg-white border-black dark:border-white scale-125 shadow-[0_0_10px_rgba(0,0,0,0.3)] dark:shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                ))}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button 
                    key={num}
                    onClick={() => handleKeypadPress(num.toString())}
                    className="h-16 flex items-center justify-center bg-slate-50 dark:bg-black rounded-2xl text-2xl font-black text-black dark:text-white active:scale-90 transition-all border border-slate-100 dark:border-slate-800 shadow-sm"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button 
                  onClick={() => handleKeypadPress('0')}
                  className="h-16 flex items-center justify-center bg-slate-50 dark:bg-black rounded-2xl text-2xl font-black text-black dark:text-white active:scale-90 transition-all border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  0
                </button>
                <button 
                  onClick={handleDelete}
                  className="h-16 flex items-center justify-center bg-slate-50 dark:bg-black rounded-2xl text-red-500 active:scale-90 transition-all border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  <Trash2 size={24} />
                </button>
              </div>

              <button 
                onClick={() => setSelectedEntry(null)}
                className="w-full text-[10px] font-black uppercase text-slate-400 tracking-widest py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
              >
                Cancel Reversal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
