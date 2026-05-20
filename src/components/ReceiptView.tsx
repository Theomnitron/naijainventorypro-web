import React, { useRef } from 'react';
import { formatNaira } from '../utils/format';
import { AuditEntry, UserProfile } from '../types';
import { toPng } from 'html-to-image';

const BRAND_NAME = "Naija Inventory";

interface ReceiptViewProps {
  entry: AuditEntry;
  profile: UserProfile;
  onReady?: (blob: Blob) => void;
}

export default function ReceiptView({ entry, profile }: { entry: AuditEntry; profile: UserProfile }) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const STORE_NAME = profile.businessName;
  const STORE_ADDRESS = profile.businessAddress || `${profile.city}, ${profile.state}`;

  const isCanceled = entry.isVoided;
  const status = isCanceled ? 'CANCELED' : 'SUCCESS';

  const date = new Date(entry.timestamp);
  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Watermark SVG Pattern
  const watermarkSvg = `
    <svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
      <text 
        x="50%" 
        y="50%" 
        font-family="sans-serif" 
        font-weight="900" 
        font-size="14" 
        fill="currentColor" 
        transform="rotate(-30, 100, 50)" 
        text-anchor="middle"
        style="opacity: 0.05"
      >
        ${BRAND_NAME.toUpperCase()}
      </text>
    </svg>
  `;

  const watermarkBase64 = `data:image/svg+xml;base64,${btoa(watermarkSvg)}`;

  return (
    <div
      ref={receiptRef}
      id="receipt-thermal-ticket"
      className="relative bg-white text-black p-8 pb-12 w-[360px] mx-auto font-sans shadow-xl overflow-hidden"
      style={{
        backgroundImage: `url("${watermarkBase64}")`,
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Jagged Bottom Edge - Pure CSS */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-white" style={{
        clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'
      }} />

      {/* Branding Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">
          {STORE_NAME}
        </h1>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-tight px-4">
          {STORE_ADDRESS}
        </p>
      </div>

      {/* Status Text Layer */}
      <div className="text-center mb-6">
        <span className={`text-2xl font-black tracking-[0.2em] ${isCanceled ? 'text-red-600' : 'text-emerald-600'}`}>
          {status}
        </span>
      </div>

      <div className="border-t border-dashed border-slate-300 my-4" />

      {/* Itemized Section */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h2 className="text-sm font-black uppercase leading-tight">
              {entry.productName}
            </h2>
            <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">
              ({entry.variantName})
            </p>
          </div>
          <p className="text-sm font-black whitespace-nowrap">
            {formatNaira(entry.price || 0)}
          </p>
        </div>
      </div>

      <div className="border-t border-dashed border-slate-300 my-4" />

      {/* Metadata Section */}
      <div className="space-y-2 mb-8">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span>Date</span>
          <span className="text-black">{formattedDate}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span>Time</span>
          <span className="text-black">{formattedTime}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span>Transaction ID</span>
          <span className="text-black">{entry.id.slice(0, 12).toUpperCase()}</span>
        </div>
        {isCanceled && entry.voidedAt && (
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-red-500 pt-1">
            <span>Canceled Date</span>
            <span>{new Date(entry.voidedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Big Total Summary */}
      <div className="text-center pt-4 mb-8">
        <p className={`text-4xl font-black tracking-tighter ${isCanceled ? 'text-slate-300 line-through' : 'text-black'}`}>
          {formatNaira(entry.price || 0)}
        </p>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
          Powered by {BRAND_NAME}
        </p>
      </div>
    </div>
  );
}

export async function exportReceiptAsPng(id: string, fileName: string) {
  const element = document.getElementById(id);
  if (!element) return null;

  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: false,
      styleSheetsFilter: (styleSheet) => {
        return !styleSheet.href || styleSheet.href.startsWith(window.location.origin);
      },
    } as any);

    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (err) {
    console.error('Snapshot failed', err);
    return false;
  }
}
