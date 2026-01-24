
import React from 'react';

const BrandHeader: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center gap-6 animate-fade-in">
      <div 
        className="w-32 h-32 rounded-full border-[6px] border-white shadow-sm overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDx1yhlH4glKjCrrjUblcERBIruWiwNooFJtVQ3En0XyntUez9qw-Yk_NZ6lKhXq9cUuoJgioyrxZN0-MSBU7VjiWYuxyG7hG2lQIL-KlHWOZ32flc1KJymd7Vb1THcJuMe1grv58s2qZzG2I9a2o8oysA-fFnTInc9gsYISTU2rfydyJoIrlFY8JHv6o3uhBekWbhA0QKtB-VUHH5aEauc8h4tFo2-gFN2EFn-WKzEsO6OxiYZDtJ9-WJNvPBvQhuuHLWwiMC2ow")' }}
      >
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Welcome to Artisan Roasters</h1>
        <p className="text-gray-500 text-lg max-w-[340px] mx-auto leading-relaxed">
          Join our loyalty program and start earning rewards today.
        </p>
      </div>
    </div>
  );
};

export default BrandHeader;
