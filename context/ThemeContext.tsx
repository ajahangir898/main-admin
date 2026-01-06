import React, { createContext, useContext, useMemo } from 'react';
import { ThemeConfig } from '../types';

interface ThemeContextValue {
  themeConfig: ThemeConfig;
  // CSS class helpers for dynamic theming
  classes: {
    // Primary color classes
    bgPrimary: string;
    bgPrimaryLight: string;
    bgPrimaryHover: string;
    textPrimary: string;
    borderPrimary: string;
    
    // Secondary color classes
    bgSecondary: string;
    bgSecondaryLight: string;
    textSecondary: string;
    borderSecondary: string;
    
    // Accent/Hover color classes
    bgAccent: string;
    bgAccentLight: string;
    textAccent: string;
    borderAccent: string;
    
    // Button styles
    btnPrimary: string;
    btnSecondary: string;
    btnOutline: string;
    
    // Interactive states
    hoverPrimary: string;
    hoverSecondary: string;
    activePrimary: string;
    
    // Status badges
    badgePrimary: string;
    badgeSecondary: string;
    badgeAccent: string;
  };
  // Inline style helpers for edge cases
  styles: {
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor: string;
    fontColor: string;
    hoverColor: string;
    surfaceColor: string;
  };
}

const defaultTheme: ThemeConfig = {
  primaryColor: '#22c55e',
  secondaryColor: '#ec4899',
  tertiaryColor: '#9333ea',
  fontColor: '#0f172a',
  hoverColor: '#f97316',
  surfaceColor: '#e2e8f0',
  darkMode: false
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  themeConfig?: ThemeConfig;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  themeConfig = defaultTheme 
}) => {
  const value = useMemo<ThemeContextValue>(() => ({
    themeConfig,
    classes: {
      // Primary color classes - uses CSS variables via Tailwind
      bgPrimary: 'bg-primary-500',
      bgPrimaryLight: 'bg-primary-50',
      bgPrimaryHover: 'hover:bg-primary-600',
      textPrimary: 'text-primary-500',
      borderPrimary: 'border-primary-500',
      
      // Secondary color classes
      bgSecondary: 'bg-secondary-500',
      bgSecondaryLight: 'bg-secondary-50',
      textSecondary: 'text-secondary-500',
      borderSecondary: 'border-secondary-500',
      
      // Accent/Hover color classes
      bgAccent: 'bg-accent-500',
      bgAccentLight: 'bg-accent-50',
      textAccent: 'text-accent-500',
      borderAccent: 'border-accent-500',
      
      // Button styles
      btnPrimary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 transition',
      btnSecondary: 'bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 transition',
      btnOutline: 'border border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100 transition',
      
      // Interactive states
      hoverPrimary: 'hover:text-primary-500 hover:bg-primary-50',
      hoverSecondary: 'hover:text-secondary-500 hover:bg-secondary-50',
      activePrimary: 'text-primary-500 bg-primary-50',
      
      // Status badges
      badgePrimary: 'bg-primary-100 text-primary-700 border border-primary-200',
      badgeSecondary: 'bg-secondary-100 text-secondary-700 border border-secondary-200',
      badgeAccent: 'bg-accent-100 text-accent-700 border border-accent-200',
    },
    styles: {
      primaryColor: themeConfig.primaryColor,
      secondaryColor: themeConfig.secondaryColor,
      tertiaryColor: themeConfig.tertiaryColor,
      fontColor: themeConfig.fontColor,
      hoverColor: themeConfig.hoverColor,
      surfaceColor: themeConfig.surfaceColor,
    }
  }), [themeConfig]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default theme if not in provider (for backwards compatibility)
    return {
      themeConfig: defaultTheme,
      classes: {
        bgPrimary: 'bg-primary-500',
        bgPrimaryLight: 'bg-primary-50',
        bgPrimaryHover: 'hover:bg-primary-600',
        textPrimary: 'text-primary-500',
        borderPrimary: 'border-primary-500',
        bgSecondary: 'bg-secondary-500',
        bgSecondaryLight: 'bg-secondary-50',
        textSecondary: 'text-secondary-500',
        borderSecondary: 'border-secondary-500',
        bgAccent: 'bg-accent-500',
        bgAccentLight: 'bg-accent-50',
        textAccent: 'text-accent-500',
        borderAccent: 'border-accent-500',
        btnPrimary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 transition',
        btnSecondary: 'bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 transition',
        btnOutline: 'border border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100 transition',
        hoverPrimary: 'hover:text-primary-500 hover:bg-primary-50',
        hoverSecondary: 'hover:text-secondary-500 hover:bg-secondary-50',
        activePrimary: 'text-primary-500 bg-primary-50',
        badgePrimary: 'bg-primary-100 text-primary-700 border border-primary-200',
        badgeSecondary: 'bg-secondary-100 text-secondary-700 border border-secondary-200',
        badgeAccent: 'bg-accent-100 text-accent-700 border border-accent-200',
      },
      styles: {
        primaryColor: defaultTheme.primaryColor,
        secondaryColor: defaultTheme.secondaryColor,
        tertiaryColor: defaultTheme.tertiaryColor,
        fontColor: defaultTheme.fontColor,
        hoverColor: defaultTheme.hoverColor,
        surfaceColor: defaultTheme.surfaceColor,
      }
    };
  }
  return context;
};

// Utility hook to get theme-aware CSS variable values
export const useThemeColors = () => {
  const { themeConfig } = useTheme();
  
  return useMemo(() => ({
    primary: themeConfig.primaryColor,
    secondary: themeConfig.secondaryColor,
    tertiary: themeConfig.tertiaryColor,
    font: themeConfig.fontColor,
    hover: themeConfig.hoverColor,
    surface: themeConfig.surfaceColor,
    isDark: themeConfig.darkMode,
  }), [themeConfig]);
};

// Helper to convert hex to RGB for inline styles
export const hexToRgbString = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};

export default ThemeContext;
