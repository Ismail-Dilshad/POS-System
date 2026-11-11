import { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  delay?: number;
  backspaceSpeed?: number;
  pauseDelay?: number;
  className?: string;
  cycle?: boolean;
}

export default function TypingAnimation({
  text,
  speed = 100,
  delay = 1000,
  backspaceSpeed = 50,
  pauseDelay = 2000,
  className = '',
  cycle = true
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      // Pause between cycles
      const timeout = setTimeout(() => {
        setIsPaused(false);
        setIsTyping(true);
        setCurrentIndex(0);
        setDisplayedText('');
      }, pauseDelay);
      return () => clearTimeout(timeout);
    } else if (isTyping && currentIndex < text.length) {
      // Typing phase
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (isTyping && currentIndex >= text.length) {
      // Finished typing, start pause then backspace
      const timeout = setTimeout(() => {
        setIsTyping(false);
        setIsDeleting(true);
        setCurrentIndex(text.length - 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (isDeleting && currentIndex >= 0) {
      // Backspace phase
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev.slice(0, -1));
        setCurrentIndex(prev => prev - 1);
      }, backspaceSpeed);
      return () => clearTimeout(timeout);
    } else if (isDeleting && currentIndex < 0) {
      // Finished backspace
      if (cycle) {
        setIsDeleting(false);
        setIsPaused(true);
      } else {
        setIsDeleting(false);
        setIsTyping(false);
      }
    }
  }, [currentIndex, text, speed, delay, backspaceSpeed, pauseDelay, isTyping, isDeleting, isPaused, cycle]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse inline-block -translate-y-0.5">|</span>
    </span>
  );
}