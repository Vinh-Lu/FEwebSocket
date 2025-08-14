// Font configuration constants
export const FONT_FAMILIES = [
  { label: 'Arial',value: 'Arial, sans-serif' },
  { label: 'Times New Roman',value: 'Times New Roman, serif' },
  { label: 'Courier New',value: 'Courier New, monospace' },
  { label: 'Helvetica',value: 'Helvetica, sans-serif' },
  { label: 'Georgia',value: 'Georgia, serif' },
  { label: 'Verdana',value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS',value: 'Trebuchet MS, sans-serif' },
  { label: 'Roboto',value: 'Roboto, sans-serif' },
  { label: 'Open Sans',value: 'Open Sans, sans-serif' },
  { label: 'Lato',value: 'Lato, sans-serif' },
  { label: 'Inter',value: 'Inter, sans-serif' },
  { label: 'Segoe UI',value: 'Segoe UI, sans-serif' },
];

export const DEFAULT_FONT_CONFIG = {
  token: {
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: 14,
    colorPrimary: '#f2754e',
  },
  components: {
    Button: {
      colorPrimary: '#f2754e',
    },
  },
};
