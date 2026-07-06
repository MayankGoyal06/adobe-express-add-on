import { BrandRules } from '../types/brand';

// Default brand rules - can be configured by admins
export const defaultBrandRules: BrandRules = {
  colors: [
    {
      id: 'primary-1',
      name: 'Primary Blue',
      hex: '#0066CC',
      rgb: { r: 0, g: 0.4, b: 0.8 },
      usage: 'primary',
    },
    {
      id: 'primary-2',
      name: 'Primary Dark',
      hex: '#003366',
      rgb: { r: 0, g: 0.2, b: 0.4 },
      usage: 'primary',
    },
    {
      id: 'secondary-1',
      name: 'Secondary Teal',
      hex: '#00CCCC',
      rgb: { r: 0, g: 0.8, b: 0.8 },
      usage: 'secondary',
    },
    {
      id: 'accent-1',
      name: 'Accent Orange',
      hex: '#FF6600',
      rgb: { r: 1, g: 0.4, b: 0 },
      usage: 'accent',
    },
    {
      id: 'neutral-1',
      name: 'Neutral Gray',
      hex: '#666666',
      rgb: { r: 0.4, g: 0.4, b: 0.4 },
      usage: 'neutral',
    },
    {
      id: 'neutral-2',
      name: 'Light Gray',
      hex: '#F5F5F5',
      rgb: { r: 0.96, g: 0.96, b: 0.96 },
      usage: 'neutral',
    },
  ],
  fonts: [
    {
      id: 'font-1',
      name: 'Heading Font',
      family: 'Arial',
      postscriptName: 'Arial-BoldMT',
      usage: 'heading',
      weight: '700',
      minSize: 24,
      maxSize: 72,
      allowedWeights: [700, 600],
    },
    {
      id: 'font-2',
      name: 'Body Font',
      family: 'Arial',
      postscriptName: 'ArialMT',
      usage: 'body',
      weight: '400',
      minSize: 12,
      maxSize: 18,
      allowedWeights: [400, 500],
    },
    {
      id: 'font-3',
      name: 'Caption Font',
      family: 'Arial',
      postscriptName: 'ArialMT',
      usage: 'caption',
      weight: '400',
      minSize: 10,
      maxSize: 14,
      allowedWeights: [400],
    },
  ],
  logos: [
    {
      id: 'logo-1',
      name: 'Company Logo',
      minSize: 50,
      clearSpace: 20,
      allowedBackgrounds: ['#FFFFFF', '#F5F5F5'],
      prohibitedBackgrounds: ['#000000', '#333333'],
      minContrastRatio: 3.0,
    },
  ],
  spacing: {
    minMargin: 20,
    gridSize: 8,
    minElementSpacing: 8,
    maxElementSpacing: 100,
  },
  accessibility: {
    minContrastRatio: 4.5, // WCAG AA standard
    minFontSize: 12,
    maxTextWidth: 600,
    requireAltText: true,
  },
};
