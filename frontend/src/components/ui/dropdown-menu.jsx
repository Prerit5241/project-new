"use client";

import React, { useState, useRef, useEffect } from 'react';

// DropdownMenu Context
const DropdownContext = React.createContext();

export function DropdownMenu({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const value = {
    isOpen,
    setIsOpen,
  };

  return (
    <DropdownContext.Provider value={value}>
      <div ref={dropdownRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, className = "", ...props }) {
  const context = React.useContext(DropdownContext);
  
  if (!context) {
    throw new Error('DropdownMenuTrigger must be used within DropdownMenu');
  }

  const { isOpen, setIsOpen } = context;

  return (
    <button
      className={className}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className = "", ...props }) {
  const context = React.useContext(DropdownContext);
  
  if (!context) {
    throw new Error('DropdownMenuContent must be used within DropdownMenu');
  }

  const { isOpen } = context;

  if (!isOpen) return null;

  return (
    <div
      className={`absolute right-0 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${className}`}
      {...props}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, disabled = false, className = "", ...props }) {
  const context = React.useContext(DropdownContext);
  
  if (!context) {
    throw new Error('DropdownMenuItem must be used within DropdownMenu');
  }

  const { setIsOpen } = context;

  const handleClick = (event) => {
    if (!disabled && onClick) {
      onClick(event);
      setIsOpen(false);
    }
  };

  return (
    <button
      className={`${
        disabled 
          ? 'text-gray-400 cursor-not-allowed' 
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      } group flex items-center px-4 py-2 text-sm w-full text-left ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className = "", ...props }) {
  return (
    <div 
      className={`border-t border-gray-100 my-1 ${className}`} 
      {...props} 
    />
  );
}
