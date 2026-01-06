// Shared UX utilities and constants

export const TOAST_DURATION = 3000;

export const INPUT_ANIMATION = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  .animate-slide-in {
    animation: slideIn 0.3s ease-out;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
`;

export const createFieldError = (field: string, value?: string): string => {
  const isEmpty = !value || value.trim() === '';
  
  switch (field) {
    case 'email':
      if (isEmpty) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address';
      return '';
    case 'phone':
      if (isEmpty) return 'Phone number is required';
      if (!/^[0-9+\-\s()]{10,}$/.test(value)) return 'Invalid phone number';
      return '';
    case 'fullName':
      if (isEmpty) return 'Full name is required';
      if (value.length < 3) return 'Name must be at least 3 characters';
      return '';
    case 'address':
      if (isEmpty) return 'Address is required';
      if (value.length < 10) return 'Please provide a detailed address';
      return '';
    case 'division':
      if (isEmpty) return 'Please select a division';
      return '';
    default:
      return isEmpty ? 'This field is required' : '';
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
