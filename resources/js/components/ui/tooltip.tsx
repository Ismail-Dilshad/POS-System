import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

// Context for tooltip state
interface TooltipContextType {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  content: React.ReactNode;
  setContent: (content: React.ReactNode) => void;
  side: 'top' | 'bottom' | 'left' | 'right';
  setSide: (side: 'top' | 'bottom' | 'left' | 'right') => void;
  align: 'start' | 'center' | 'end';
  setAlign: (align: 'start' | 'center' | 'end') => void;
  delayDuration: number;
  setDelayDuration: (delay: number) => void;
  disabled: boolean;
  setDisabled: (disabled: boolean) => void;
  className?: string;
  setClassName: (className?: string) => void;
  activeTrigger: HTMLElement | null;
  setActiveTrigger: (trigger: HTMLElement | null) => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

// Provider component
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [content, setContent] = useState<React.ReactNode>(null);
  const [side, setSide] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('center');
  const [delayDuration, setDelayDuration] = useState(300);
  const [disabled, setDisabled] = useState(false);
  const [className, setClassName] = useState<string | undefined>(undefined);
  const [activeTrigger, setActiveTrigger] = useState<HTMLElement | null>(null);

  return (
    <TooltipContext.Provider
      value={{
        isVisible,
        setIsVisible,
        content,
        setContent,
        side,
        setSide,
        align,
        setAlign,
        delayDuration,
        setDelayDuration,
        disabled,
        setDisabled,
        className,
        setClassName,
        activeTrigger,
        setActiveTrigger,
      }}
    >
      {children}
      <TooltipPortal />
    </TooltipContext.Provider>
  );
}

// Hook to use tooltip context
function useTooltip() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
}

// Main Tooltip component
export function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// TooltipTrigger component
export function TooltipTrigger({ 
  children, 
  asChild = false 
}: { 
  children: React.ReactNode; 
  asChild?: boolean; 
}) {
  const { setIsVisible, delayDuration, setActiveTrigger } = useTooltip();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const triggerRef = useRef<HTMLElement | null>(null);

  const showTooltip = (event: React.MouseEvent | React.FocusEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const target = event.currentTarget as HTMLElement;
    triggerRef.current = target;
    setActiveTrigger(target);
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayDuration ?? 0);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setActiveTrigger(null);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
      onFocus: showTooltip,
      onBlur: hideTooltip,
    });
  }

  return (
    <div
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      className="inline-block"
    >
      {children}
    </div>
  );
}

// TooltipContent component
export function TooltipContent({
  children,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  className,
  disabled = false
}: {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
  disabled?: boolean;
  hidden?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { setContent, setSide, setAlign, setDelayDuration, setDisabled, setClassName } = useTooltip();

  useEffect(() => {
    setContent(children);
    setSide(side);
    setAlign(align);
    setDelayDuration(delayDuration);
    setDisabled(disabled);
    setClassName(className);
  }, [children, side, align, delayDuration, disabled, className, setContent, setSide, setAlign, setDelayDuration, setDisabled, setClassName]);

  return null;
}

// Portal component for rendering tooltip
function TooltipPortal() {
  const { isVisible, content, side, align, disabled, className, activeTrigger } = useTooltip();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!activeTrigger || !tooltipRef.current) return;

    const triggerRect = activeTrigger.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let top = 0;
    let left = 0;

    // Calculate position based on side
    switch (side) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - 8;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + 8;
        break;
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollX + 8;
        break;
    }

    // Adjust horizontal alignment
    switch (align) {
      case 'start':
        if (side === 'top' || side === 'bottom') {
          left = triggerRect.left + scrollX;
        }
        break;
      case 'center':
        if (side === 'top' || side === 'bottom') {
          left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        }
        break;
      case 'end':
        if (side === 'top' || side === 'bottom') {
          left = triggerRect.right + scrollX - tooltipRect.width;
        }
        break;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 8) left = 8;
    if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + tooltipRect.height > viewportHeight + scrollY - 8) {
      top = viewportHeight + scrollY - tooltipRect.height - 8;
    }

    setPosition({ top, left });
  }, [activeTrigger, side, align]);

  useEffect(() => {
    if (isVisible && !disabled && activeTrigger) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible, side, align, disabled, activeTrigger, updatePosition]);

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-gray-900 dark:bg-gray-100 transform rotate-45';
    
    switch (side) {
      case 'top':
        return cn(baseClasses, 'bottom-[-4px] left-1/2 -translate-x-1/2');
      case 'bottom':
        return cn(baseClasses, 'top-[-4px] left-1/2 -translate-x-1/2');
      case 'left':
        return cn(baseClasses, 'right-[-4px] top-1/2 -translate-y-1/2');
      case 'right':
        return cn(baseClasses, 'left-[-4px] top-1/2 -translate-y-1/2');
      default:
        return baseClasses;
    }
  };

  if (!isVisible || disabled) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[10000] max-w-xs rounded-md bg-gray-900 px-3 py-2 text-sm text-white shadow-lg dark:bg-gray-100 dark:text-gray-900',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
      role="tooltip"
    >
      {content}
      <div className={getArrowClasses()} />
    </div>,
    document.body
  );
}

// Legacy simple Tooltip component for backward compatibility
export interface SimpleTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
  disabled?: boolean;
}

export function SimpleTooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  className,
  disabled = false,
}: SimpleTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          delayDuration={delayDuration}
          className={className}
          disabled={disabled}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}