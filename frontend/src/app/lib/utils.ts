import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUserId(): string {
  if (typeof window === 'undefined') return 'server';
  
  const stored = localStorage.getItem('user_id');
  if (stored) return stored;

  const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('user_id', newId);
  return newId;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getProgressLabel(percentage: number): string {
  if (percentage === 0) return 'Starting...';
  if (percentage < 25) return 'Analyzing requirements...';
  if (percentage < 50) return 'Designing architecture...';
  if (percentage < 75) return 'Creating UX flows...';
  if (percentage < 100) return 'Finalizing strategy...';
  return 'Complete!';
}

export function getProgressColor(percentage: number): string {
  if (percentage < 25) return 'text-blue-500';
  if (percentage < 50) return 'text-indigo-500';
  if (percentage < 75) return 'text-purple-500';
  return 'text-green-500';
}