import toast, { ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  duration: 4000,
  style: {
    borderRadius: '12px',
    background: '#333',
    color: '#fff',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 500,
  },
};

export const showSuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    ...defaultOptions,
    icon: '✅',
    style: {
      ...defaultOptions.style,
      background: '#ecfdf5',
      color: '#065f46',
      border: '1px solid #a7f3d0',
    },
    ...options,
  });
};

export const showError = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    ...defaultOptions,
    icon: '🚨',
    style: {
      ...defaultOptions.style,
      background: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca',
    },
    ...options,
  });
};

export const showInfo = (message: string, options?: ToastOptions) => {
  toast(message, {
    ...defaultOptions,
    icon: 'ℹ️',
    style: {
      ...defaultOptions.style,
      background: '#eff6ff',
      color: '#1e40af',
      border: '1px solid #bfdbfe',
    },
    ...options,
  });
};
