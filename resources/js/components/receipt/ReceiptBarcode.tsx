import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface ReceiptBarcodeProps {
  receiptId: string;
  className?: string;
}

export function ReceiptBarcode({ receiptId, className = '' }: ReceiptBarcodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !receiptId) return;

    // Generate barcode with multiple fallback methods
    const generateBarcodeSVG = (saleId: string) => {
      try {
        // Method 1: Try JsBarcode library
        const canvas = document.createElement('canvas');
        
        JsBarcode(canvas, saleId, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 10,
          textMargin: 4,
          margin: 8,
          background: "#ffffff",
          lineColor: "#000000"
        });
        
        const dataURL = canvas.toDataURL();
        
        return `
          <div style="text-align: center; margin: 10px 0;">
            <img src="${dataURL}" alt="Barcode: ${saleId}" style="max-width: 100%; height: auto;" />
          </div>
        `;
      } catch (jsbarcodeError) {
        console.warn('JsBarcode failed, using fallback method:', jsbarcodeError);
        
        // Method 2: Simple ASCII barcode representation
        const generateSimpleBarcode = (text: string) => {
          const lines = [];
          
          // Create simple barcode pattern
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charCode = char.charCodeAt(0);
            
            // Create pattern based on character code
            let pattern = '';
            for (let j = 0; j < 8; j++) {
              pattern += (charCode & (1 << j)) ? '█' : '░';
            }
            lines.push(pattern);
          }
          
          return lines.join('\n');
        };
        
        const barcodePattern = generateSimpleBarcode(saleId);
        
        return `
          <div style="text-align: center; margin: 10px 0;">
            <div style="font-family: 'Courier New', monospace; font-size: 8px; line-height: 1; letter-spacing: 0; white-space: pre; background: #fff; padding: 4px; border: 1px solid #000;">
              ${barcodePattern}
            </div>
            <div style="font-size: 10px; margin-top: 2px; font-weight: bold;">${saleId}</div>
          </div>
        `;
      }
    };

    // Generate the barcode
    if (containerRef.current) {
      containerRef.current.innerHTML = generateBarcodeSVG(receiptId);
    }
  }, [receiptId]);

  return (
    <div className={`receipt-barcode text-center my-2 ${className}`}>
      <div ref={containerRef} />
    </div>
  );
}
