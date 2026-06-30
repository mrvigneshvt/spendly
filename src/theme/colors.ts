export interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  chipBg: string;
  chipSelectedBg: string;
  chipSelectedText: string;
  credit: string;
  debit: string;
  overlay: string;
  inputBorder: string;
  modalBg: string;
  danger: string;
}

export const lightColors: ThemeColors = {
  background: '#fff',
  text: '#000',
  textSecondary: '#666',
  textTertiary: '#999',
  border: '#eee',
  surface: '#f8f9fa',
  surfaceElevated: '#fff',
  primary: '#007AFF',
  chipBg: '#eee',
  chipSelectedBg: '#007AFF',
  chipSelectedText: '#fff',
  credit: '#2e7d32',
  debit: '#c62828',
  overlay: 'rgba(0,0,0,0.4)',
  inputBorder: '#ccc',
  modalBg: '#fff',
  danger: '#c62828',
};

export const darkColors: ThemeColors = {
  background: '#121212',
  text: '#e0e0e0',
  textSecondary: '#aaa',
  textTertiary: '#777',
  border: '#333',
  surface: '#1e1e1e',
  surfaceElevated: '#2a2a2a',
  primary: '#4da6ff',
  chipBg: '#333',
  chipSelectedBg: '#4da6ff',
  chipSelectedText: '#fff',
  credit: '#66bb6a',
  debit: '#ef5350',
  overlay: 'rgba(0,0,0,0.7)',
  inputBorder: '#555',
  modalBg: '#2a2a2a',
  danger: '#ef5350',
};
