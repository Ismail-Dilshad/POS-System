import i18n from '@/i18n';
import { type Transaction } from '@/services/business/transactionService';
import { type User } from '@/types';

interface ReceiptPrintOptions {
    autoPrint?: boolean;
    cleanupDelay?: number;
}

class ReceiptService {
    private iframe: HTMLIFrameElement | null = null;
    private isPrinting = false;

    /**
     * Print receipt using hidden iframe for instant printing
     */
    async printReceipt(
        transaction: Transaction,
        user: User,
        options: ReceiptPrintOptions = {}
    ): Promise<void> {
        const { autoPrint = true, cleanupDelay = 500 } = options;

        // Prevent multiple simultaneous prints
        if (this.isPrinting) {
            console.warn('Receipt printing already in progress');
            return;
        }

        this.isPrinting = true;

        try {
            // Create or reuse hidden iframe
            await this.ensureIframe();

            // Generate receipt HTML
            const receiptHTML = await this.generateReceiptHTML(transaction, user);

            // Inject content into iframe
            if (this.iframe?.contentDocument) {
                this.iframe.contentDocument.open();
                this.iframe.contentDocument.write(receiptHTML);
                this.iframe.contentDocument.close();

                // Wait for content to load (optimized with requestAnimationFrame)
                await this.waitForIframeLoad();

                if (autoPrint) {
                    // Small delay to ensure content is fully rendered before print
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            // Trigger print dialog
                            this.iframe?.contentWindow?.print();
                            
                            // Cleanup after delay (faster cleanup)
                            setTimeout(() => {
                                this.cleanup();
                            }, cleanupDelay);
                        });
                    });
                } else {
                    // Cleanup after delay if not auto-printing
                    setTimeout(() => {
                        this.cleanup();
                    }, cleanupDelay);
                }
            }
        } catch (error) {
            console.error('Receipt printing failed:', error);
            this.cleanup();
        } finally {
            this.isPrinting = false;
        }
    }

    /**
     * Get receipt HTML without printing (for preview in modal)
     */
    public async getReceiptHTML(transaction: Transaction, user: User): Promise<string> {
        return await this.generateReceiptHTML(transaction, user);
    }

    /**
     * Create or reuse hidden iframe
     */
    private async ensureIframe(): Promise<void> {
        if (!this.iframe) {
            this.iframe = document.createElement('iframe');
            this.iframe.style.position = 'absolute';
            this.iframe.style.left = '-9999px';
            this.iframe.style.top = '-9999px';
            this.iframe.style.width = '1px';
            this.iframe.style.height = '1px';
            this.iframe.style.border = 'none';
            this.iframe.style.visibility = 'hidden';
            
            document.body.appendChild(this.iframe);
        }
    }

    /**
     * Wait for iframe content to load
     */
    private waitForIframeLoad(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.iframe) {
                resolve();
                return;
            }

            // Check immediately first
            if (this.iframe.contentDocument?.readyState === 'complete') {
                resolve();
                return;
            }

            // Use requestAnimationFrame for faster checks
            const checkLoad = () => {
                if (this.iframe?.contentDocument?.readyState === 'complete') {
                    resolve();
                } else {
                    requestAnimationFrame(checkLoad);
                }
            };

            requestAnimationFrame(checkLoad);
        });
    }

    /**
     * Generate complete receipt HTML with inline styles
     */
    private async generateReceiptHTML(transaction: Transaction, user: User): Promise<string> {
         const formatDateTime = (dateString: string) => {
             const date = new Date(dateString);
             return date.toLocaleString('ku-Arab-IQ', {
                 year: 'numeric',
                 month: '2-digit',
                 day: '2-digit',
                 hour: '2-digit',
                 minute: '2-digit',
                 second: '2-digit',
                 hour12: false,
             });
         };

        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('ku-Arab-IQ', {
                style: 'currency',
                currency: 'IQD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
        };
        
        const formatNumber = (amount: number) => {
            return new Intl.NumberFormat('ku-Arab-IQ', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
        };

        const getUserRole = (role: string) => {
            switch (role) {
                case 'admin':
                    return 'بەڕێوبەر';
                case 'cashier':
                    return 'کاشێر';
                case 'dataentry':
                    return 'داتاچوونەژوورەوە';
                default:
                    return role;
            }
        };

         // Generate barcode with multiple fallback methods
         const generateBarcode = async (saleId: string) => {
             try {
                 // Method 1: Try JsBarcode library
                 try {
                     const JsBarcode = (await import('jsbarcode')).default;
                     const canvas = document.createElement('canvas');
                     const displayWidth = 220;
                     const displayHeight = 70;
                     const pixelRatio = Math.max(2, Math.round((window.devicePixelRatio || 1) * 2));
                     canvas.width = displayWidth * pixelRatio;
                     canvas.height = displayHeight * pixelRatio;

                     const ctx = canvas.getContext('2d');
                     if (ctx) {
                         ctx.scale(pixelRatio, pixelRatio);
                     }

                     JsBarcode(canvas, saleId, {
                        format: 'CODE128',
                        width: Math.max(2, pixelRatio),
                        height: displayHeight,
                        displayValue: false,
                        margin: 0,
                        background: '#ffffff',
                        lineColor: '#000000'
                    });

                     const dataURL = canvas.toDataURL('image/png');

                     return `
                         <div class="receipt-barcode" style="text-align: center; margin: 10px 0;">
                             <img src="${dataURL}" alt="Barcode: ${saleId}" style="width: ${displayWidth}px; height: ${displayHeight}px; image-rendering: crisp-edges; display: block; margin: 0 auto;" />
                             <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px; margin-top: 4px;">${saleId}</div>
                         </div>
                     `;
                 } catch (jsbarcodeError) {
                     console.warn('JsBarcode failed, trying fallback method:', jsbarcodeError);
                     
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
                         <div class="receipt-barcode" style="text-align: center; margin: 10px 0;">
                             <div style="font-family: 'Courier New', monospace; font-size: 8px; line-height: 1; letter-spacing: 0; white-space: pre; background: #fff; padding: 4px; border: 1px solid #000;">
                                 ${barcodePattern}
                             </div>
                             <div style="font-size: 10px; margin-top: 2px; font-weight: bold;">${saleId}</div>
                         </div>
                     `;
                 }
             } catch (error) {
                 console.error('All barcode methods failed:', error);
                 
                 // Method 3: Final fallback - styled text representation
                 return `
                     <div class="receipt-barcode" style="text-align: center; margin: 10px 0;">
                         <div style="font-family: 'Courier New', monospace; font-size: 12px; font-weight: bold; letter-spacing: 2px; border: 2px solid #000; padding: 8px; display: inline-block; background: #fff; min-width: 200px;">
                             ${saleId}
                         </div>
                     </div>
                 `;
             }
         };

        return `
<!DOCTYPE html>
<html dir="rtl" lang="ku">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${transaction.transaction_number}</title>
    <link rel="preload" href="/fonts/Rabar_021.woff2" as="font" type="font/woff2" crossorigin>
    <style>
        @font-face {
            font-family: 'Rabar';
            src: url('/fonts/Rabar_021.woff2') format('woff2'),
                 url('/fonts/Rabar_021.woff') format('woff'),
                 url('/fonts/Rabar_021.ttf') format('truetype');
            font-display: swap;
            font-weight: normal;
            font-style: normal;
        }
        
        @font-face {
            font-family: 'KurdishFont';
            src: url('/fonts/Rabar_021.woff2') format('woff2'),
                 url('/fonts/Rabar_021.woff') format('woff'),
                 url('/fonts/Rabar_021.ttf') format('truetype');
            font-display: swap;
            font-weight: normal;
            font-style: normal;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'KurdishFont', 'Rabar', 'Noto Sans Arabic', 'Segoe UI', 'Arial Unicode MS', 'Arial', sans-serif;
            font-size: 14px;
            line-height: 1.4;
            color: #000;
            background: #fff;
            direction: rtl;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
            padding: 10px;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
        }

        body * {
            text-shadow: none;
        }

        @media (max-width: 640px) {
            body {
                max-width: 100%;
                padding: 8px;
                font-size: 12px;
            }
        }
        
        .receipt-header {
            text-align: center;
            font-weight: bold;
            font-size: 20px;
            margin-bottom: 10px;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
        }
        
        .receipt-info {
            margin-bottom: 8px;
            font-size: 13px;
        }
        
        .receipt-info .label {
            font-weight: bold;
        }
        
        .receipt-info-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0;
        }
        
        .receipt-info-line .label {
            font-weight: bold;
        }
        
        .receipt-info-line .value {
            font-weight: normal;
        }
        
        .receipt-divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
        }
        
        .receipt-items-table {
            border: 1px solid #000;
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 8px;
        }
        
        .receipt-items-header {
            display: grid;
            grid-template-columns: 1fr 40px 60px 70px;
            gap: 0;
            font-weight: bold;
            font-size: 13px;
            border-bottom: 2px solid #000;
            background-color: #fff;
        }
        
        .receipt-item {
            display: grid;
            grid-template-columns: 1fr 40px 60px 70px;
            gap: 0;
            font-size: 12px;
            align-items: start;
            border-bottom: 1px solid #ddd;
        }
        
        .receipt-item:last-child {
            border-bottom: none;
        }
        
         .receipt-items-header > div,
         .receipt-item > div {
             padding: 5px;
         }
         
         .receipt-items-header > div:last-child,
         .receipt-item > div:last-child {
             padding-left: 0;
             text-align: right;
         }
         
         @media (max-width: 640px) {
             .receipt-items-header,
             .receipt-item {
                 grid-template-columns: 1fr 35px 55px 65px;
             }
             
             .receipt-items-header > div,
             .receipt-item > div {
                 padding: 4px;
                 font-size: 11px;
             }
         }
        
        .receipt-item-name {
            word-wrap: break-word;
            word-break: break-word;
            line-height: 1.2;
            min-height: 20px;
        }
        
        .receipt-item-qty {
            text-align: center;
        }
        
        .receipt-item-price {
            text-align: right;
        }
        
        .receipt-item-total {
            text-align: right;
            font-weight: bold;
        }
        
        .receipt-totals {
            margin-top: 8px;
            border-top: 1px solid #000;
            padding-top: 5px;
        }
        
        .receipt-total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            font-size: 13px;
        }
        
        .receipt-total-line.total {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #000;
            padding-top: 3px;
            margin-top: 5px;
        }
        
        .receipt-total-line.grand-total {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 8px;
        }
        
        .receipt-barcode {
            text-align: center;
            margin: 10px 0;
            padding: 5px 0;
        }

        .receipt-barcode img {
            image-rendering: crisp-edges;
        }
        
        .receipt-footer {
            text-align: center;
            margin-top: 10px;
            font-size: 13px;
        }
        
        .receipt-footer .watermark {
            font-size: 12px;
            color: #666;
        }
        
        @media print {
            body {
                width: 58mm;
                max-width: 58mm;
                margin: 0;
                padding: 5px;
                font-size: 12px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .receipt-header {
                font-size: 18px;
            }
            
            .receipt-info {
                font-size: 11px;
            }
            
            .receipt-items-table {
                border: 1px solid #000;
            }
            
            .receipt-item {
                font-size: 11px;
                grid-template-columns: 1fr 30px 50px 60px;
                gap: 0;
                border-bottom: 1px solid #ccc;
            }
            
            .receipt-items-header {
                grid-template-columns: 1fr 30px 50px 60px;
                gap: 0;
                font-size: 12px;
                border-bottom: 2px solid #000;
            }
            
             .receipt-items-header > div,
             .receipt-item > div {
                 padding: 3px;
             }
             
             .receipt-items-header > div:last-child,
             .receipt-item > div:last-child {
                 padding-left: 0;
                 text-align: right;
             }
            
            .receipt-total-line {
                font-size: 11px;
            }
            
            .receipt-total-line.total {
                font-size: 12px;
            }
            
            .receipt-total-line.grand-total {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <!-- Store Header -->
    <div class="receipt-header">
        ${i18n.t('receipt.store_name')}
    </div>

    <!-- Transaction Info -->
    <div class="receipt-info">
         <div class="receipt-info-line">
             <span class="label">${getUserRole(user.role)}:</span>
             <span class="value">${user.full_name}</span>
         </div>
        <div class="receipt-info-line">
            <span class="label">بەروار:</span>
            <span class="value">${formatDateTime(transaction.created_at)}</span>
        </div>
        <div class="receipt-info-line">
            <span class="label">ژمارەی پسوولە:</span>
            <span class="value">${transaction.transaction_number}</span>
        </div>
    </div>

    <div class="receipt-divider"></div>

    <!-- Items Table -->
    <div class="receipt-items-table">
        <!-- Items Header -->
        <div class="receipt-items-header">
            <div>ناو</div>
            <div>دانە</div>
            <div>نرخ</div>
            <div>سەرجەم</div>
        </div>

        <!-- Items -->
        ${transaction.items.map((item) => {
            const price = Number(item.price) || 0;
            const qty = Number(item.quantity || item.weight || 1);
            const total = price * qty;
            
            return `
            <div class="receipt-item">
                <div class="receipt-item-name">${item.name}</div>
                <div class="receipt-item-qty">${qty}</div>
                <div class="receipt-item-price">${formatNumber(price)}</div>
                <div class="receipt-item-total">${formatNumber(total)}</div>
            </div>
        `;
        }).join('')}
    </div>

    <!-- Totals -->
    <div class="receipt-totals">
        ${(function() {
            // Calculate subtotal from price * qty for each item
            const subtotal = transaction.items.reduce((sum, item) => {
                const price = Number(item.price) || 0;
                const qty = Number(item.quantity || item.weight || 1);
                return sum + (price * qty);
            }, 0);
            const discount = Number(transaction.discount) || 0;
            const grandTotal = Number(transaction.total_amount) || 0;
            
            let totalsHtml = `
        <div class="receipt-total-line">
            <span>کۆی لاوەکی:</span>
            <span>${formatCurrency(subtotal)}</span>
        </div>`;
            
            if (discount > 0) {
                totalsHtml += `
        <div class="receipt-total-line">
            <span>داشکاندن:</span>
            <span>-${formatCurrency(discount)}</span>
        </div>`;
            }
            
            totalsHtml += `
        <div class="receipt-total-line grand-total">
            <span>کۆی گشتی:</span>
            <span>${formatCurrency(grandTotal)}</span>
        </div>`;
            
            return totalsHtml;
        })()}
    </div>

    <div class="receipt-divider"></div>

    <!-- Barcode -->
    <div class="receipt-barcode">
        ${await generateBarcode(transaction.transaction_number)}
    </div>
</body>
</html>
        `;
    }

    /**
     * Cleanup iframe and reset state
     */
    private cleanup(): void {
        if (this.iframe) {
            document.body.removeChild(this.iframe);
            this.iframe = null;
        }
        this.isPrinting = false;
    }

    /**
     * Force cleanup (for error cases)
     */
    public forceCleanup(): void {
        this.cleanup();
    }
}

// Export singleton instance
export const receiptService = new ReceiptService();
