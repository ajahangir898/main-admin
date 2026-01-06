/**
 * Animation Helpers for Micro-interactions and Transitions
 * Provides CSS classes and keyframe definitions for smooth, delightful animations
 */

import React from 'react';

// Tailwind-compatible animation class names for common interactions
export const animations = {
  // Button interactions
  buttonPress: 'hover:scale-105 active:scale-95 transition-transform duration-200',
  buttonHover: 'hover:shadow-lg hover:shadow-orange-500/20 transition-shadow duration-300',
  
  // Card interactions
  cardHover: 'hover:shadow-xl hover:shadow-gray-900/10 hover:scale-[1.02] transition-all duration-300',
  cardTap: 'active:scale-[0.98] transition-transform duration-150',
  
  // Fade animations
  fadeIn: 'animate-fadeIn',
  fadeOut: 'animate-fadeOut',
  fadeInUp: 'animate-fadeInUp',
  fadeInDown: 'animate-fadeInDown',
  
  // Scale animations
  scaleIn: 'animate-scaleIn',
  pulse: 'animate-pulse',
  
  // Slide animations
  slideInLeft: 'animate-slideInLeft',
  slideInRight: 'animate-slideInRight',
  slideOutLeft: 'animate-slideOutLeft',
  slideOutRight: 'animate-slideOutRight',
  
  // Bounce animations
  bounce: 'animate-bounce',
  bounceIn: 'animate-bounceIn',
  
  // Success state
  successBounce: 'animate-successBounce',
  
  // Loading spinner
  spin: 'animate-spin',
  spinFast: 'animate-spin',
  
  // Smooth transitions
  smooth: 'transition-all duration-300 ease-in-out',
  smoothFast: 'transition-all duration-150 ease-out',
  smoothSlow: 'transition-all duration-500 ease-in-out',
};

// CSS keyframes to add to your tailwind config
export const keyframesConfig = {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  fadeOut: {
    '0%': { opacity: '1' },
    '100%': { opacity: '0' },
  },
  fadeInUp: {
    '0%': { opacity: '0', transform: 'translateY(10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  fadeInDown: {
    '0%': { opacity: '0', transform: 'translateY(-10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  scaleIn: {
    '0%': { opacity: '0', transform: 'scale(0.95)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  },
  slideInLeft: {
    '0%': { opacity: '0', transform: 'translateX(-20px)' },
    '100%': { opacity: '1', transform: 'translateX(0)' },
  },
  slideInRight: {
    '0%': { opacity: '0', transform: 'translateX(20px)' },
    '100%': { opacity: '1', transform: 'translateX(0)' },
  },
  slideOutLeft: {
    '0%': { opacity: '1', transform: 'translateX(0)' },
    '100%': { opacity: '0', transform: 'translateX(-20px)' },
  },
  slideOutRight: {
    '0%': { opacity: '1', transform: 'translateX(0)' },
    '100%': { opacity: '0', transform: 'translateX(20px)' },
  },
  bounceIn: {
    '0%': { opacity: '0', transform: 'scale(0.3)' },
    '50%': { opacity: '1', transform: 'scale(1.05)' },
    '70%': { transform: 'scale(0.9)' },
    '100%': { transform: 'scale(1)' },
  },
  successBounce: {
    '0%': { transform: 'scale(0)' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)' },
  },
};

// Animation durations (in milliseconds)
export const animationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};

// Easing functions
export const easings = {
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
  easeInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
  easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
  easeInOutCirc: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
};

// Helper function to apply animations to elements
export const getAnimationStyles = (
  animationName: keyof typeof animations,
  delay: number = 0,
  duration: keyof typeof animationDurations = 'normal'
): React.CSSProperties => {
  return {
    animationDelay: `${delay}ms`,
    animationDuration: `${animationDurations[duration]}ms`,
  };
};

// Stagger animation helper (for lists)
export const getStaggeredAnimationDelay = (index: number, delayBetweenItems: number = 50): number => {
  return index * delayBetweenItems;
};

// Create a success animation trigger (e.g., for add-to-cart)
export const triggerSuccessAnimation = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.classList.add('animate-successBounce');
  setTimeout(() => {
    element.classList.remove('animate-successBounce');
  }, 600);
};

// Create a ripple effect (Material Design style)
// Uses RAF to prevent forced reflows when reading layout properties
export const createRippleEffect = (event: React.MouseEvent<HTMLElement>) => {
  const button = event.currentTarget;
  const clientX = event.clientX;
  const clientY = event.clientY;
  
  // Use RAF to batch layout reads and prevent forced reflows
  requestAnimationFrame(() => {
    // Read phase - read all layout properties together
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const buttonRect = button.getBoundingClientRect();
    const offsetLeft = buttonRect.left;
    const offsetTop = buttonRect.top;
    
    // Write phase - create and append elements
    const circle = document.createElement('span');
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${clientX - offsetLeft - radius}px`;
    circle.style.top = `${clientY - offsetTop - radius}px`;
    circle.classList.add('ripple');
    
    const ripple = button.querySelector('.ripple');
    if (ripple) ripple.remove();
    
    button.appendChild(circle);
  });
};

// Page transition helpers
export const pageTransitionEnter = 'animate-fadeInUp';
export const pageTransitionExit = 'animate-fadeOutDown';

// Toast/Notification animations
export const toastEnter = 'animate-slideInRight';
export const toastExit = 'animate-slideOutRight';

// Modal animations
export const modalBackdropEnter = 'animate-fadeIn';
export const modalBackdropExit = 'animate-fadeOut';
export const modalContentEnter = 'animate-scaleIn';
export const modalContentExit = 'animate-scaleOut';

// Tooltip animations
export const tooltipEnter = 'animate-fadeInDown';
export const tooltipExit = 'animate-fadeOutUp';
