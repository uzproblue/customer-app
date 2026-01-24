
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-10 flex flex-col items-center border-t border-gray-50 mt-auto">
      <div className="text-gray-400 text-xs font-medium mb-4">
        Nouz SaaS Loyalty Platform • © 2024
      </div>
      <div className="flex items-center gap-6">
        <a href="#" className="text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors">Support</a>
        <a href="#" className="text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors">Privacy</a>
        <a href="#" className="text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors">Terms</a>
      </div>
    </footer>
  );
};

export default Footer;
