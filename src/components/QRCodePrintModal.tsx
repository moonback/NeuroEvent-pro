import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { X, Printer } from 'lucide-react';

interface QRCodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  equipmentName: string;
}

export function QRCodePrintModal({ isOpen, onClose, equipmentId, equipmentName }: QRCodePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow || !printRef.current) return;
    
    const printContents = printRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimer QR Code - ${equipmentName}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: white; }
            .print-container { display: flex; flex-direction: column; align-items: center; border: 2px dashed #000; padding: 40px; border-radius: 16px; }
            h3 { font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 0 0 20px 0; text-align: center; color: black; }
            p { font-size: 14px; font-family: monospace; margin: 20px 0 0 0; color: #333; text-align: center; }
            svg { display: block; max-width: 100%; height: auto; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .print-container { border: 2px solid black; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContents}
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8fafc]">
          <h2 className="font-bold text-[#0f172a]">QR Code: {equipmentName}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 flex flex-col items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-[#e2e8f0] rounded-xl bg-white" title="Aperçu avant impression">
            <h3 className="font-bold text-xl text-center text-black uppercase tracking-wider">{equipmentName}</h3>
            <div className="bg-white p-2">
              <QRCode value={equipmentId} size={200} />
            </div>
            <p className="text-xs text-black font-mono text-center">ID: {equipmentId.slice(0,8)}</p>
          </div>
          
          <div className="hidden">
            <div ref={printRef}>
              <h3>${equipmentName}</h3>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <QRCode value={equipmentId} size={300} />
              </div>
              <p>ID: ${equipmentId}</p>
            </div>
          </div>
          
          <button 
            onClick={handlePrint}
            className="mt-8 flex items-center justify-center gap-2 w-full py-3 bg-[#2563eb] text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Printer className="w-5 h-5" />
            <span>Imprimer l'étiquette</span>
          </button>
        </div>
      </div>
    </div>
  );
}
