import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { Calculator } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface CalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Operator = '+' | '-' | '*' | '/';

export function CalculatorModal({ isOpen, onClose }: CalculatorModalProps) {
    const { t } = useTranslation();
    // Windows-like: keep expression and current input separate
    const [expression, setExpression] = useState<string>(''); // e.g., "12+"
    const [currentInput, setCurrentInput] = useState<string>('0');
    const [justEvaluated, setJustEvaluated] = useState<boolean>(false);
    const [lastOperation, setLastOperation] = useState<{ operator: string; operand: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
        } else {
            // Reset when closing
            setExpression('');
            setCurrentInput('0');
            setJustEvaluated(false);
            setLastOperation(null);
        }
    }, [isOpen]);

    const appendDigit = (digit: string) => {
        setCurrentInput((prev) => {
            const base = justEvaluated ? '0' : prev;
            return base === '0' ? digit : base + digit;
        });
        if (justEvaluated) {
            setExpression('');
            setJustEvaluated(false);
            setLastOperation(null);
        }
    };

    const addDecimal = () => {
        setCurrentInput((prev) => {
            const base = justEvaluated ? '0' : prev;
            if (base.includes('.')) return base;
            return base === '' ? '0.' : base + '.';
        });
        if (justEvaluated) {
            setExpression('');
            setJustEvaluated(false);
            setLastOperation(null);
        }
    };

    const insertOp = (op: Operator | '%') => {
        if (op === '%') {
            // Interpret as percentage of the previous value if present
            setCurrentInput((prev) => {
                const b = Number(prev || '0');
                if (!Number.isFinite(b)) return prev;
                const match = expression.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*$/);
                if (match) {
                    const a = Number(match[1]);
                    return String((a * b) / 100);
                }
                return String(b / 100);
            });
            setJustEvaluated(false);
            setLastOperation(null);
            return;
        }
        // If user presses an operator right after equals, start new expression from the result
        if (justEvaluated) {
            setExpression(String(currentInput) + op);
            setCurrentInput('0');
            setJustEvaluated(false);
            setLastOperation(null);
            return;
        }
        setJustEvaluated(false);
        setLastOperation(null);
        setExpression((prev) => {
            if ((currentInput === '' || currentInput === '0') && prev) {
                return prev.replace(/[+\-*/]\s*$/, op);
            }
            return (prev || '') + String(currentInput) + op;
        });
        setCurrentInput('0');
    };

    const buildSafeExpression = useCallback((expr: string): string | null => {
        // Basic allowed tokens: numbers, + - * / % ( ) . and whitespace
        const disallowed = /[^0-9+\-*/().%\s]/;
        if (disallowed.test(expr)) return null;
        return expr.replace(/×/g, '*').replace(/÷/g, '/');
    }, []);

    const equals = () => {
        // If we just evaluated and user presses = again, repeat the last operation
        if (justEvaluated && lastOperation) {
            // Repeat: current result + last operator + last operand
            const newExpr = `${currentInput}${lastOperation.operator}${lastOperation.operand}`;
            const safe = buildSafeExpression(newExpr);
            if (safe) {
                try {
                    const result = Function(`"use strict"; return (${safe});`)();
                    const resultStr = (Number.isNaN(result) || !Number.isFinite(result)) ? 'Error' : String(result);
                    setCurrentInput(resultStr);
                    setExpression(newExpr + ' =');
                    setJustEvaluated(true);
                    return;
                } catch {
                    setCurrentInput('Error');
                    setExpression('');
                    setJustEvaluated(true);
                    setLastOperation(null);
                    return;
                }
            }
            // If we can't repeat, just keep the current result
            return;
        }
        
        // Remove any '=' from expression if it exists (from previous evaluation)
        const cleanExpression = (expression || '').replace(/\s*=\s*$/, '').trim();
        const raw = cleanExpression + (currentInput ?? '');
        if (raw.trim() === '') return;
        
        // Check if there's an operator in the expression - if not, just keep the current result
        const hasOperator = /[+\-*/]/.test(raw);
        if (!hasOperator) {
            // No operation to perform, just keep the current result
            setExpression(raw + ' =');
            setJustEvaluated(true);
            setLastOperation(null);
            return;
        }
        
        // Extract the last operator and operand for potential repeat
        const operatorMatch = raw.match(/([+\-*/])\s*(\d+(?:\.\d+)?)\s*$/);
        if (operatorMatch) {
            const [, operator, operand] = operatorMatch;
            setLastOperation({ operator, operand });
        } else {
            setLastOperation(null);
        }
        
        const safe = buildSafeExpression(raw);
        if (!safe) {
            setCurrentInput('Error');
            setExpression('');
            setJustEvaluated(true);
            setLastOperation(null);
            return;
        }
        try {
            const result = Function(`"use strict"; return (${safe});`)();
            const resultStr = (Number.isNaN(result) || !Number.isFinite(result)) ? 'Error' : String(result);
            setCurrentInput(resultStr);
            setExpression(raw + ' =');
            setJustEvaluated(true);
        } catch {
            setCurrentInput('Error');
            setExpression('');
            setJustEvaluated(true);
            setLastOperation(null);
        }
    };

    const clearAll = () => {
        if (currentInput !== '0' && !justEvaluated) {
            setCurrentInput('0'); // C
        } else {
            setExpression('');   // AC
            setCurrentInput('0');
            setJustEvaluated(false);
            setLastOperation(null);
        }
    };

    const backspace = () => {
        if (justEvaluated) return;
        setCurrentInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const key = e.key;
        if (key === 'Escape') {
            e.preventDefault();
            onClose();
            return;
        }
        if (key === 'Tab') {
            e.preventDefault();
            // AC behavior on Tab
            setExpression('');
            setCurrentInput('0');
            setJustEvaluated(false);
            return;
        }
        if ((key >= '0' && key <= '9')) {
            e.preventDefault();
            appendDigit(key);
            return;
        }
        if (key === '.') {
            e.preventDefault();
            addDecimal();
            return;
        }
        if (key === '%') {
            e.preventDefault();
            insertOp('%');
            return;
        }
        if (key === 'Enter' || key === '=') {
            e.preventDefault();
            equals();
            return;
        }
        if (key === 'Backspace') {
            e.preventDefault();
            backspace();
            return;
        }
        if (key === '+' || key === '-' || key === '*' || key === '/') {
            e.preventDefault();
            insertOp(key as Operator);
        }
    };

    const smallDisplay = expression;
    const bigDisplay = currentInput;
    const clearLabel = (currentInput !== '0' && !justEvaluated)
        ? (t('calculator.clear') || 'C')
        : (t('calculator.all_clear') || 'AC');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-2xl w-full p-0 overflow-hidden"
                onKeyDown={handleKeyDown}
            >
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-violet-200 dark:border-violet-800 bg-gradient-to-r from-white via-violet-50 to-white dark:from-violet-950/40 dark:via-violet-950/60 dark:to-violet-950/40">
                    <div className="flex items-center gap-2">
                        <DialogTitle className="text-xl font-semibold text-violet-800 dark:text-violet-200 flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            {t('calculator.title') || 'Calculator'}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-6">
                    {/* Display */}
                    <div className="rounded-xl border border-violet-100 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/20 p-4">
                        <div className="text-right text-base text-muted-foreground select-none leading-none mb-3">{smallDisplay || '\u00A0'}</div>
                        <Input
                            ref={inputRef}
                            value={bigDisplay}
                            readOnly
                            aria-label={t('calculator.display') || 'Calculator display'}
                            className="text-right text-4xl h-20 font-semibold tracking-wide"
                        />
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-4 gap-3">
                        {/* Row 1 */}
                        <Button variant="secondary" onClick={clearAll} className="h-16 text-lg rounded-2xl shadow-sm hover:shadow transition-all active:scale-[0.98]">{clearLabel}</Button>
                        <Button variant="secondary" onClick={backspace} className="h-16 text-lg rounded-2xl shadow-sm hover:shadow transition-all active:scale-[0.98]">⌫</Button>
                        <Button variant="outline" onClick={() => insertOp('%')} className="h-16 text-lg rounded-2xl bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800">{t('calculator.percent') || '%'}</Button>
                        <Button variant="outline" onClick={() => insertOp('/')} className="h-16 text-violet-700 dark:text-violet-300 text-xl rounded-2xl bg-violet-50/70 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/30">÷</Button>

                        {/* Row 2 */}
                        <Button variant="ghost" onClick={() => appendDigit('7')} className="h-16 text-xl rounded-2xl border border-transparent hover:border-violet-100/60 dark:hover:border-violet-900/40 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800">7</Button>
                        <Button variant="ghost" onClick={() => appendDigit('8')} className="h-16 text-xl rounded-2xl border border-transparent hover:border-violet-100/60 dark:hover:border-violet-900/40 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800">8</Button>
                        <Button variant="ghost" onClick={() => appendDigit('9')} className="h-16 text-xl rounded-2xl border border-transparent hover:border-violet-100/60 dark:hover:border-violet-900/40 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800">9</Button>
                        <Button variant="outline" onClick={() => insertOp('*')} className="h-16 text-violet-700 dark:text-violet-300 text-xl rounded-2xl bg-violet-50/70 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/30">×</Button>

                        {/* Row 3 */}
                        <Button variant="ghost" onClick={() => appendDigit('4')} className="h-16 text-xl rounded-2xl border border-transparent hover:border-violet-100/60 dark:hover:border-violet-900/40 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800">4</Button>
                        <Button variant="ghost" onClick={() => appendDigit('5')} className="h-16 text-xl rounded-2xl border border-transparent hover:border-violet-100/60 dark:hover:border-violet-900/40 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800">5</Button>
                        <Button variant="ghost" onClick={() => appendDigit('6')} className="h-16 text-xl rounded-2xl border border-transparent hover:border-violet-100/60 dark:hover:border-violet-900/40 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800">6</Button>
                        <Button variant="outline" onClick={() => insertOp('-')} className="h-16 text-violet-700 dark:text-violet-300 text-xl rounded-2xl bg-violet-50/70 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/30">−</Button>

                        {/* Row 4 */}
                        <Button variant="ghost" onClick={() => appendDigit('1')} className="h-16 text-xl rounded-2xl border border-transparent hover:border-violet-100/60 dark:hover:border-violet-900/40 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800">1</Button>
                        <Button variant="ghost" onClick={() => appendDigit('2')} className="h-16 text-xl rounded-2xl border border-transparent hover:border-violet-100/60 dark:hover:border-violet-900/40 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800">2</Button>
                        <Button variant="ghost" onClick={() => appendDigit('3')} className="h-16 text-xl rounded-2xl border border-transparent hover:border-violet-100/60 dark:hover:border-violet-900/40 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800">3</Button>
                        <Button variant="outline" onClick={() => insertOp('+')} className="h-16 text-violet-700 dark:text-violet-300 text-xl rounded-2xl bg-violet-50/70 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-900/30">+</Button>

                        {/* Row 5 */}
                        <Button variant="ghost" onClick={() => appendDigit('0')} className="col-span-2 h-16 text-xl rounded-2xl border border-transparent hover:border-violet-100/60 dark:hover:border-violet-900/40 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800">0</Button>
                        <Button variant="ghost" onClick={addDecimal} className="h-16 text-xl rounded-2xl border border-transparent hover:border-violet-100/60 dark:hover:border-violet-900/40 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800">.</Button>
                        <Button variant="default" onClick={equals} className="h-16 text-xl rounded-2xl bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-600 hover:to-violet-800 text-white shadow-sm hover:shadow transition-all active:scale-[0.98]">=</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default CalculatorModal;


