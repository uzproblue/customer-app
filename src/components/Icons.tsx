
import React from 'react';

export const NouzLogo: React.FC = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path 
      d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" 
      fill="currentColor"
    />
  </svg>
);

export const AppleLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 384 512" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-20.8-82.3-20.8-40.8 0-78.2 23.3-99.3 59.9-41.1 71.3-10.5 176.6 29.5 234.3 19.6 28.3 43.1 60 73.8 58.8 29-1.1 39.9-18.8 74.9-18.8 34.8 0 45.1 18.8 75.5 18.1 31.1-.7 51.5-28.7 70.4-56.4 21.9-32 30.9-63 31.2-64.6-.6-.2-60.1-23-60.4-89.7zM249.1 81.3c15.6-18.9 26.2-45.2 23.3-71.3-22.3 1-49.1 15-65.1 33.8-14.4 16.8-26.9 44.1-23.5 69.3 24.8 1.9 49.8-13 65.3-31.8z" />
  </svg>
);

export const GoogleWalletIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

export const CoffeeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);

export const QRCodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3h4v4H3V3zm6 0h4v4H9V3zm0 6h4v4H9V9zM3 9h4v4H3V9zm12-6h4v4h-4V3zm0 6h4v4h-4V9zM3 15h4v4H3v-4zm6 0h4v4H9v-4zm6 0h4v4h-4v-4zm-6 6h4v4H9v-4zm6 0h4v4h-4v-4z" />
  </svg>
);
