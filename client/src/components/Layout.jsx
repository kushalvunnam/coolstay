import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/80 transition-colors duration-200">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          onClick={toggleSidebar} 
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden cursor-pointer"
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Core View Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {/* Outlet mounts active child page */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
