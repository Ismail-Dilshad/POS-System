import { useTranslation } from '@/hooks/use-translation';
import { useEffect, useRef } from 'react';
import { formatCurrency } from '@/lib/currency';
import { type Transaction } from '@/services/business/transactionService';
import { type User } from '@/types';

interface ReceiptPrintProps {
    transaction: Transaction;
    user: User;
}

export function ReceiptPrint({ transaction, user }: ReceiptPrintProps) {
    const { t } = useTranslation();
    const barcodeRef = useRef<HTMLDivElement>(null);

    // Generate barcode using bwip-js
    useEffect(() => {
        if (barcodeRef.current && transaction.transaction_number) {
            try {
                // Clear previous barcode
                barcodeRef.current.innerHTML = '';
                
                // Create canvas for barcode
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    const displayWidth = 220;
                    const displayHeight = 70;
                    const pixelRatio = Math.max(2, Math.round((window.devicePixelRatio || 1) * 2));
                    canvas.width = displayWidth * pixelRatio;
                    canvas.height = displayHeight * pixelRatio;

                    const bwipjs = (window as { bwipjs?: { toCanvas: (canvas: HTMLCanvasElement, options: Record<string, unknown>) => void } }).bwipjs;
                    if (bwipjs) {
                        bwipjs.toCanvas(canvas, {
                            bcid: 'code128',
                            text: transaction.transaction_number,
                            scale: pixelRatio,
                            height: displayHeight,
                            includetext: false,
                        });

                        const dataURL = canvas.toDataURL('image/png');
                        const img = document.createElement('img');
                        img.src = dataURL;
                        img.style.width = `${displayWidth}px`;
                        img.style.height = `${displayHeight}px`;
                        img.style.display = 'block';
                        img.style.margin = '0 auto';
                        img.style.imageRendering = 'crisp-edges';

                        barcodeRef.current.appendChild(img);
                    }
                }
            } catch (error) {
                console.warn('Barcode generation failed:', error);
                // Fallback: show transaction number as text
                barcodeRef.current.innerHTML = `<div style="text-align: center; font-family: monospace; font-size: 12px;">${transaction.transaction_number}</div>`;
            }
        }
    }, [transaction.transaction_number]);

    // Format date and time
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ku-Arab-IQ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    // Get user role in Kurdish
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

    return (
        <div className="receipt-container">
            <style>{`
                .receipt-container {
                    width: 100%;
                    max-width: 300px;
                    margin: 0 auto;
                    padding: 10px;
                    font-family: 'KurdishFont', 'Noto Sans Arabic', 'Segoe UI', 'Arial Unicode MS', 'Arial', sans-serif;
                    font-size: 14px;
                    line-height: 1.4;
                    color: #000;
                    background: #fff;
                    direction: rtl;
                    -webkit-font-smoothing: antialiased;
                    text-rendering: optimizeLegibility;
                }

                .receipt-container * {
                    text-shadow: none;
                }
                
                @media (max-width: 640px) {
                    .receipt-container {
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
                    .receipt-container {
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
                        border-bottom: 1px solid #ccc;
                    }
                    
                    .receipt-items-header {
                        font-size: 12px;
                        border-bottom: 2px solid #000;
                    }
                    
                    .receipt-items-header > div,
                    .receipt-item > div {
                        padding: 3px;
                    }
                    
                    .receipt-items-header > div:last-child,
                    .receipt-item > div:last-child {
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
            `}</style>

            {/* Store Header */}
            <div className="receipt-header">
                {t('receipt.store_name')}
            </div>

            {/* Transaction Info */}
            <div className="receipt-info">
                <div><span className="label">[{getUserRole(user.role)}]:</span> {user.full_name}</div>
                <div><span className="label">بەروار:</span> {formatDateTime(transaction.created_at)}</div>
                <div><span className="label">ژمارەی پسوولە:</span> {transaction.transaction_number}</div>
            </div>

            <div className="receipt-divider"></div>

            {/* Items Table */}
            <div className="receipt-items-table">
                {/* Items Header */}
                <div className="receipt-items-header">
                    <div>ناو</div>
                    <div>دانە</div>
                    <div>نرخ</div>
                    <div>سەرجەم</div>
                </div>

                {/* Items */}
                {transaction.items.map((item, index) => {
                    const price = Number(item.price) || 0;
                    const qty = Number(item.quantity || item.weight || 1);
                    const total = price * qty;
                    
                    return (
                        <div key={index} className="receipt-item">
                            <div className="receipt-item-name">{item.name}</div>
                            <div className="receipt-item-qty">{qty}</div>
                            <div className="receipt-item-price">{new Intl.NumberFormat('ku-Arab-IQ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)}</div>
                            <div className="receipt-item-total">{new Intl.NumberFormat('ku-Arab-IQ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(total)}</div>
                        </div>
                    );
                })}
            </div>

            <div className="receipt-divider"></div>

            {/* Totals */}
            <div className="receipt-totals">
                {(() => {
                    // Calculate subtotal from price * qty for each item
                    const subtotal = transaction.items.reduce((sum, item) => {
                        const price = Number(item.price) || 0;
                        const qty = Number(item.quantity || item.weight || 1);
                        return sum + (price * qty);
                    }, 0);
                    const discount = Number(transaction.discount) || 0;
                    const grandTotal = Number(transaction.total_amount) || 0;
                    
                    return (
                        <>
                            <div className="receipt-total-line">
                                <span>کۆی لاوەکی:</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="receipt-total-line">
                                    <span>داشکاندن:</span>
                                    <span>-{formatCurrency(discount)}</span>
                                </div>
                            )}
                            <div className="receipt-total-line grand-total">
                                <span>کۆی گشتی:</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>
                        </>
                    );
                })()}
            </div>

            <div className="receipt-divider"></div>

            {/* Barcode */}
            <div className="receipt-barcode" ref={barcodeRef}>
                {/* Barcode will be generated here */}
            </div>
        </div>
    );
}
