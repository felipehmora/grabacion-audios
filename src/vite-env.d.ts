/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module 'toastify-js' {
  interface ToastifyOptions {
    text?: string;
    duration?: number;
    gravity?: 'top' | 'bottom';
    position?: 'left' | 'center' | 'right';
    style?: Record<string, string>;
    stopOnFocus?: boolean;
    close?: boolean;
  }
  function Toastify(options: ToastifyOptions): { showToast: () => void };
  export default Toastify;
}
