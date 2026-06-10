import Toastify from 'toastify-js';

export function toastSuccess(text: string): void {
  Toastify({
    text,
    duration: 3000,
    gravity: 'bottom',
    position: 'right',
    style: { background: '#4a3f35' },
  }).showToast();
}

export function toastError(text: string): void {
  Toastify({
    text,
    duration: 5000,
    gravity: 'bottom',
    position: 'right',
    style: { background: '#c0392b' },
  }).showToast();
}
