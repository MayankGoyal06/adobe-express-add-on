// Brand Kit Type Definitions

export type ViolationCategory = 'color' | 'typography' | 'logo' | 'spacing' | 'accessibility';
export type ViolationSeverity = 'critical' | 'major' | 'minor';
export type UserRole = 'admin' | 'designer' | 'viewer';

export interface BrandColor {
  id: string;
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  usage: 'primary' | 'secondary' | 'accent' | 'neutral';
  allowedVariations?: {
    minLightness?: number;
    maxLightness?: number;
    minSaturation?: number;
    maxSaturation?: number;
  };
}

export interface BrandFont {
  id: string;
  name: string;
  family: string;
  postscriptName?: string;
  usage: 'heading' | 'body' | 'caption' | 'display';
  weight: string;
  minSize?: number;
  maxSize?: number;
  allowedWeights?: number[];
}

export interface BrandLogo {
  id: string;
  name: string;
  minSize: number; // in pixels
  clearSpace: number; // minimum clear space around logo in pixels
  allowedBackgrounds?: string[]; // hex colors
  prohibitedBackgrounds?: string[]; // hex colors
  minContrastRatio?: number;
}

export interface SpacingRules {
  minMargin: number;
  gridSize: number;
  minElementSpacing?: number;
  maxElementSpacing?: number;
}

export interface AccessibilityRules {
  minContrastRatio: number; // WCAG AA = 4.5:1, AAA = 7:1
  minFontSize: number;
  maxTextWidth?: number; // for readability
  requireAltText?: boolean;
}

export interface BrandRules {
  colors: BrandColor[];
  fonts: BrandFont[];
  logos: BrandLogo[];
  spacing: SpacingRules;
  accessibility: AccessibilityRules;
}

export interface Violation {
  id: string;
  category: ViolationCategory;
  severity: ViolationSeverity;
  title: string;
  description: string;
  location: string; // e.g., "Text Layer: 'Heading'"
  suggestion: string;
  canAutoFix: boolean;
  fixed: boolean;
  elementId?: string; // reference to document element
  elementBounds?: { x: number; y: number; width: number; height: number };
  metadata?: Record<string, any>;
}

export interface ComplianceScore {
  overall: number; // 0-100
  categories: {
    color: number;
    typography: number;
    logo: number;
    spacing: number;
    accessibility: number;
  };
  violations: {
    critical: number;
    major: number;
    minor: number;
  };
}

export interface DocumentElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'group' | 'other';
  bounds: { x: number; y: number; width: number; height: number };
  color?: { r: number; g: number; b: number; a: number };
  font?: {
    family: string;
    size: number;
    weight: number;
  };
  isLogo?: boolean;
  logoId?: string;
  metadata?: Record<string, any>;
}

export interface ScanResult {
  elements: DocumentElement[];
  violations: Violation[];
  score: ComplianceScore;
  timestamp: number;
}
