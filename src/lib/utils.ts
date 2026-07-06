// Utility functions for brand compliance

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Color utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

// Calculate color distance (Euclidean distance in RGB space)
export function colorDistance(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const dr = color1.r - color2.r;
  const dg = color1.g - color2.g;
  const db = color1.b - color2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Calculate contrast ratio (WCAG)
export function contrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      return c;
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1.r, color1.g, color1.b);
  const l2 = getLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Check if color matches brand palette (with tolerance)
export function isBrandColor(
  color: { r: number; g: number; b: number },
  brandColors: Array<{ rgb: { r: number; g: number; b: number } }>,
  tolerance: number = 0.15
): boolean {
  if (brandColors.length === 0) {
    console.log('⚠️ No brand colors to check against');
    return false;
  }
  
  const matches = brandColors.some((brandColor) => {
    const distance = colorDistance(color, brandColor.rgb);
    const matches = distance <= tolerance;
    if (matches) {
      console.log(`  ✅ Color matches brand color (distance: ${distance.toFixed(3)}, tolerance: ${tolerance})`);
    }
    return matches;
  });
  
  if (!matches) {
    console.log(`  ❌ Color does not match any brand color (tolerance: ${tolerance})`);
  }
  
  return matches;
}

// Find nearest brand color
export function findNearestBrandColor(
  color: { r: number; g: number; b: number },
  brandColors: Array<{ rgb: { r: number; g: number; b: number }; hex: string }>
): { rgb: { r: number; g: number; b: number }; hex: string } | null {
  if (brandColors.length === 0) return null;
  
  let nearest = brandColors[0];
  let minDistance = colorDistance(color, brandColors[0].rgb);
  
  for (const brandColor of brandColors) {
    const distance = colorDistance(color, brandColor.rgb);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = brandColor;
    }
  }
  
  return nearest;
}
