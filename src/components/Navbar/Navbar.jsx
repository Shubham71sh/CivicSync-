import React, { useState } from "react";
import { Search, Bell, Sun, Moon, Menu } from "lucide-react";

export default function Navbar({ setMobileOpen }) {
  const [darkMode, setDarkMode] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="h-16 border-b border-slate-100 bg-white sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Left side: Search bar & mobile trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button 
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className={`relative flex items-center w-full max-w-xs transition-all duration-300 ${searchFocused ? "max-w-sm" : ""}`}>
          <Search className={`w-4 h-4 absolute left-3 transition-colors ${searchFocused ? "text-blue-500" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder="Search relief assistance, schemes..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3.5">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 relative group"
          title="Toggle Dark Mode"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
          <span className="absolute hidden group-hover:block bottom-[-2.5rem] right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap">
            {darkMode ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        {/* Notifications */}
        <button 
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 relative group"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="absolute hidden group-hover:block bottom-[-2.5rem] right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap">
            2 new notifications
          </span>
        </button>

        <div className="h-6 w-px bg-slate-100 hidden sm:block" />

        {/* Profile Info */}
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-500/10">
            JD
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">John Doe</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Patna, Ward 14</p>
          </div>
        </div>
      </div>
    </header>
  );
}
