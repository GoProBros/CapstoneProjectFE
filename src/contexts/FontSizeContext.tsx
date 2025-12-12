'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface FontSizeContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState(6);

  const increaseFontSize = () => {
    if (fontSize < 10) setFontSize(fontSize + 1);
  };

  const decreaseFontSize = () => {
    if (fontSize > 0) setFontSize(fontSize - 1);
  };

  // Apply font size to document root
  useEffect(() => {
    // Map fontSize (0-10) to actual rem values (0.75rem - 1.25rem)
    const baseFontSize = 0.75 + (fontSize * 0.05); // 0.75 to 1.25
    document.documentElement.style.setProperty('--base-font-size', `${baseFontSize}rem`);
  }, [fontSize]);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, increaseFontSize, decreaseFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}
