import React from 'react';

const RestaurantError: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light px-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="mb-4">
            <span className="material-symbols-outlined text-6xl text-red-500">
              error
            </span>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Invalid Restaurant</h1>
          <p className="text-gray-600 mb-6">
            The restaurant ID in the URL is missing or invalid. Please check the link and try again.
          </p>
          <p className="text-sm text-gray-500">
            Expected format: <code className="bg-gray-100 px-2 py-1 rounded">/restaurant-id</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantError;
