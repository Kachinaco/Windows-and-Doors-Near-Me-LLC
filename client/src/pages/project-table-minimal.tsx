import React, { useState, useCallback, useRef, useEffect } from "react";

const MondayBoard = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Windows & Doors Projects
          </h1>
        </div>
      </header>
      
      <main className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Project Management Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The application is now running successfully!
          </p>
        </div>
      </main>
    </div>
  );
};

export default MondayBoard;