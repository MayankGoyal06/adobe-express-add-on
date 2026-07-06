import {
  BrandRules,
  Violation,
  DocumentElement,
  ComplianceScore,
} from '../types/brand';
import { colorDistance, contrastRatio, isBrandColor, findNearestBrandColor } from '../lib/utils';

export class ViolationDetector {
  private rules: BrandRules;

  constructor(rules: BrandRules) {
    this.rules = rules;
  }

  updateRules(rules: BrandRules) {
    this.rules = rules;
  }

  scanDocument(elements: DocumentElement[]): {
    violations: Violation[];
    score: ComplianceScore;
  } {
    console.log(`🔍 ViolationDetector: Scanning ${elements.length} elements against brand rules`);
    console.log(`📋 Rules: ${this.rules.colors.length} colors, ${this.rules.fonts.length} fonts`);
    
    // Validate brand rules are not empty
    if (!this.rules.colors || this.rules.colors.length === 0) {
      console.warn('⚠️ ViolationDetector: No brand colors defined! Color validation will be skipped.');
    }
    if (!this.rules.fonts || this.rules.fonts.length === 0) {
      console.warn('⚠️ ViolationDetector: No brand fonts defined! Typography validation will be skipped.');
    }
    if (!this.rules.logos || this.rules.logos.length === 0) {
      console.log('ℹ️ ViolationDetector: No logo rules defined.');
    }
    
    // Log all elements BEFORE validation to verify properties
    console.log('📦 Elements received for validation:');
    elements.forEach((element, index) => {
      console.log(`  Element ${index + 1}:`, {
        id: element.id,
        type: element.type,
        bounds: element.bounds,
        hasColor: !!element.color,
        color: element.color ? {
          r: element.color.r,
          g: element.color.g,
          b: element.color.b,
          a: element.color.a
        } : null,
        hasFont: !!element.font,
        font: element.font ? {
          family: element.font.family,
          size: element.font.size,
          weight: element.font.weight
        } : null,
        isLogo: element.isLogo || false,
        metadata: element.metadata
      });
      
      // Validate element structure matches expectations
      if (!element.id) {
        console.warn(`  ⚠️ Element ${index + 1} missing ID`);
      }
      if (!element.bounds || typeof element.bounds.x !== 'number' || typeof element.bounds.y !== 'number') {
        console.warn(`  ⚠️ Element ${index + 1} has invalid bounds:`, element.bounds);
      }
      if (element.color) {
        if (typeof element.color.r !== 'number' || element.color.r < 0 || element.color.r > 1) {
          console.warn(`  ⚠️ Element ${index + 1} has invalid color.r:`, element.color.r);
        }
        if (typeof element.color.g !== 'number' || element.color.g < 0 || element.color.g > 1) {
          console.warn(`  ⚠️ Element ${index + 1} has invalid color.g:`, element.color.g);
        }
        if (typeof element.color.b !== 'number' || element.color.b < 0 || element.color.b > 1) {
          console.warn(`  ⚠️ Element ${index + 1} has invalid color.b:`, element.color.b);
        }
      }
      if (element.font) {
        if (!element.font.family || typeof element.font.family !== 'string') {
          console.warn(`  ⚠️ Element ${index + 1} has invalid font.family:`, element.font.family);
        }
        if (typeof element.font.size !== 'number' || element.font.size <= 0) {
          console.warn(`  ⚠️ Element ${index + 1} has invalid font.size:`, element.font.size);
        }
        if (typeof element.font.weight !== 'number' || element.font.weight < 0) {
          console.warn(`  ⚠️ Element ${index + 1} has invalid font.weight:`, element.font.weight);
        }
      }
    });
    
    const violations: Violation[] = [];

    // Scan each element
    for (const element of elements) {
      // Check colors
      if (element.color) {
        const colorViolations = this.checkColorCompliance(element);
        if (colorViolations.length > 0) {
          console.log(`  ⚠️ Color violation on element ${element.id}:`, colorViolations[0].title);
        }
        violations.push(...colorViolations);
      }

      // Check typography
      if (element.font) {
        const fontViolations = this.checkTypographyCompliance(element);
        if (fontViolations.length > 0) {
          console.log(`  ⚠️ Typography violation on element ${element.id}:`, fontViolations[0].title);
        }
        violations.push(...fontViolations);
      }

      // Check logos
      if (element.isLogo) {
        const logoViolations = this.checkLogoCompliance(element);
        violations.push(...logoViolations);
      }

      // Check spacing
      const spacingViolations = this.checkSpacingCompliance(element, elements);
      violations.push(...spacingViolations);

      // Check accessibility
      const accessibilityViolations = this.checkAccessibilityCompliance(element);
      violations.push(...accessibilityViolations);
    }

    console.log(`📊 ViolationDetector: Found ${violations.length} total violations`);

    // Calculate compliance score
    const score = this.calculateScore(violations, elements.length);
    
    console.log(`📊 ViolationDetector: Calculated score: ${score.overall}%`, {
      categories: score.categories,
      violations: score.violations
    });

    return { violations, score };
  }

  private checkColorCompliance(element: DocumentElement): Violation[] {
    const violations: Violation[] = [];
    const textColors: Array<{ r: number; g: number; b: number; a?: number }> | undefined =
      element.metadata?.textColors;
    const colorsToCheck = textColors && textColors.length > 0
      ? textColors
      : element.color
        ? [element.color]
        : [];

    if (colorsToCheck.length === 0) {
      if (element.type === 'text' || element.type === 'shape') {
        violations.push({
          id: `violation-${Date.now()}-${Math.random()}`,
          category: 'color',
          severity: 'major',
          title: 'Color not detectable',
          description: 'Color information is missing or could not be read.',
          location: this.getElementLocation(element),
          suggestion: 'Ensure the element has a solid fill or text color.',
          canAutoFix: false,
          fixed: false,
          elementId: element.id,
          elementBounds: element.bounds,
        });
      } else if (element.type === 'image' && element.metadata?.colorUnknown) {
        violations.push({
          id: `violation-${Date.now()}-${Math.random()}`,
          category: 'color',
          severity: 'major',
          title: 'Image color not verifiable',
          description: 'Image colors cannot be validated against the brand palette.',
          location: this.getElementLocation(element),
          suggestion: 'Replace the image with a brand-approved asset.',
          canAutoFix: false,
          fixed: false,
          elementId: element.id,
          elementBounds: element.bounds,
          metadata: element.metadata,
        });
      } else {
        console.log(`  ⏭️ Element ${element.id}: No color property, skipping color check`);
      }
      return violations;
    }
    
    // Validate brand rules exist
    if (!this.rules.colors || this.rules.colors.length === 0) {
      console.log(`  ⏭️ Element ${element.id}: No brand colors defined, skipping color check`);
      return violations;
    }

    console.log(`  🎨 Checking color for element ${element.id}:`, element.color, `against ${this.rules.colors.length} brand colors`);
    
    // Log brand colors for debugging
    console.log(`  📋 Brand colors:`, this.rules.colors.map(c => ({ name: c.name, hex: c.hex, rgb: c.rgb })));
    
    const nonBrandColor = colorsToCheck.find(
      (c) => !isBrandColor(c, this.rules.colors, 0.15)
    );
    const isBrand = !nonBrandColor;
    console.log(`  ${isBrand ? '✅' : '❌'} Color check: ${isBrand ? 'Brand color' : 'Non-brand color'}`);
    
    if (!isBrand) {
      const detectedColor = nonBrandColor || element.color;
      const nearest = detectedColor
        ? findNearestBrandColor(detectedColor, this.rules.colors)
        : null;
      const detectedHex = detectedColor ? this.rgbToHex(detectedColor) : '#000000';
      console.log(`  ⚠️ Non-brand color detected: ${detectedHex}, nearest: ${nearest?.hex || 'N/A'}`);
      
      violations.push({
        id: `violation-${Date.now()}-${Math.random()}`,
        category: 'color',
        severity: 'major',
        title: 'Non-brand color detected',
        description: `Color ${detectedHex} is not in the approved brand palette.`,
        location: this.getElementLocation(element),
        suggestion: nearest 
          ? `Use the nearest brand color: ${nearest.hex}`
          : `Use one of the approved brand colors.`,
        canAutoFix: true,
        fixed: false,
        elementId: element.id,
        elementBounds: element.bounds,
        metadata: { detectedColor, suggestedColor: nearest },
      });
    }

    return violations;
  }

  private checkTypographyCompliance(element: DocumentElement): Violation[] {
    const violations: Violation[] = [];
    if (!element.font) {
      if (element.type === 'text') {
        violations.push({
          id: `violation-${Date.now()}-${Math.random()}`,
          category: 'typography',
          severity: 'major',
          title: 'Font metadata unavailable',
          description: 'Font information is missing or could not be read.',
          location: this.getElementLocation(element),
          suggestion: 'Try reapplying the font or converting text to a standard font.',
          canAutoFix: false,
          fixed: false,
          elementId: element.id,
          elementBounds: element.bounds,
        });
      } else {
        console.log(`  ⏭️ Element ${element.id}: No font property, skipping typography check`);
      }
      return violations;
    }
    
    // Validate brand rules exist
    if (!this.rules.fonts || this.rules.fonts.length === 0) {
      console.log(`  ⏭️ Element ${element.id}: No brand fonts defined, skipping typography check`);
      return violations;
    }

    console.log(`  🔤 Checking font for element ${element.id}:`, element.font, `against ${this.rules.fonts.length} brand fonts`);
    
    // Log brand fonts for debugging
    console.log(`  📋 Brand fonts:`, this.rules.fonts.map(f => ({ name: f.name, family: f.family })));

    const normalizeFontKey = (value?: string) =>
      String(value || '')
        .toLowerCase()
        .replace(/\s+/g, '');
    const fontKey = normalizeFontKey(element.font!.family);
    const fontWeight = typeof element.font!.weight === 'number' ? element.font!.weight : null;

    // Check font family (family or PostScript)
    const isBrandFont = this.rules.fonts.some((f) => {
      const familyKey = normalizeFontKey(f.family);
      const postscriptKey = normalizeFontKey((f as any).postscriptName);
      const familyMatches =
        fontKey === familyKey ||
        fontKey === postscriptKey ||
        familyKey === postscriptKey;
      const weightOk =
        !Array.isArray(f.allowedWeights) ||
        f.allowedWeights.length === 0 ||
        fontWeight === null ||
        f.allowedWeights.includes(fontWeight);
      return familyMatches && weightOk;
    });
    console.log(`  ${isBrandFont ? '✅' : '❌'} Font family check: ${isBrandFont ? 'Brand font' : 'Non-brand font'}`);
    
    if (!isBrandFont) {
      console.log(`  ⚠️ Non-brand font detected: "${element.font.family}"`);
      violations.push({
        id: `violation-${Date.now()}-${Math.random()}`,
        category: 'typography',
        severity: 'major',
        title: 'Non-brand font family',
        description: `Font "${element.font.family}" is not in the approved typography system.`,
        location: this.getElementLocation(element),
        suggestion: `Use one of the approved fonts: ${this.rules.fonts
          .map((f) => f.name)
          .join(', ')}`,
        canAutoFix: true,
        fixed: false,
        elementId: element.id,
        elementBounds: element.bounds,
        metadata: { detectedFont: element.font },
      });
    }

    // Check font size
    const fontRule = this.rules.fonts.find((f) => {
      const familyKey = normalizeFontKey(f.family);
      const postscriptKey = normalizeFontKey((f as any).postscriptName);
      return (
        fontKey === familyKey ||
        fontKey === postscriptKey ||
        familyKey === postscriptKey
      );
    });
    if (fontRule) {
      if (fontRule.minSize && element.font.size < fontRule.minSize) {
        violations.push({
          id: `violation-${Date.now()}-${Math.random()}`,
          category: 'typography',
          severity: 'minor',
          title: 'Font size too small',
          description: `Font size ${element.font.size}px is below the minimum of ${fontRule.minSize}px.`,
          location: this.getElementLocation(element),
          suggestion: `Increase font size to at least ${fontRule.minSize}px.`,
          canAutoFix: true,
          fixed: false,
          elementId: element.id,
          elementBounds: element.bounds,
        });
      }
      if (fontRule.maxSize && element.font.size > fontRule.maxSize) {
        violations.push({
          id: `violation-${Date.now()}-${Math.random()}`,
          category: 'typography',
          severity: 'minor',
          title: 'Font size too large',
          description: `Font size ${element.font.size}px exceeds the maximum of ${fontRule.maxSize}px.`,
          location: this.getElementLocation(element),
          suggestion: `Reduce font size to at most ${fontRule.maxSize}px.`,
          canAutoFix: true,
          fixed: false,
          elementId: element.id,
          elementBounds: element.bounds,
        });
      }
    }

    return violations;
  }

  private checkLogoCompliance(element: DocumentElement): Violation[] {
    const violations: Violation[] = [];
    if (!element.isLogo) {
      console.log(`  ⏭️ Element ${element.id}: Not a logo, skipping logo check`);
      return violations;
    }
    
    // Validate brand rules exist
    if (!this.rules.logos || this.rules.logos.length === 0) {
      console.log(`  ⏭️ Element ${element.id}: No logo rules defined, skipping logo check`);
      return violations;
    }

    const logoRule = this.rules.logos[0]; // Use first logo rule for now
    if (!logoRule) {
      console.log(`  ⏭️ Element ${element.id}: Logo rule not found, skipping logo check`);
      return violations;
    }
    
    console.log(`  🖼️ Checking logo compliance for element ${element.id}`);

    // Check minimum size
    const minDimension = Math.min(element.bounds.width, element.bounds.height);
    if (minDimension < logoRule.minSize) {
      violations.push({
        id: `violation-${Date.now()}-${Math.random()}`,
        category: 'logo',
        severity: 'critical',
        title: 'Logo too small',
        description: `Logo size (${Math.round(minDimension)}px) is below the minimum requirement of ${logoRule.minSize}px.`,
        location: this.getElementLocation(element),
        suggestion: `Increase logo size to at least ${logoRule.minSize}px.`,
        canAutoFix: false,
        fixed: false,
        elementId: element.id,
        elementBounds: element.bounds,
      });
    }

    return violations;
  }

  private checkSpacingCompliance(
    element: DocumentElement,
    allElements: DocumentElement[]
  ): Violation[] {
    const violations: Violation[] = [];
    const { minMargin, minElementSpacing } = this.rules.spacing;

    // Check margins (distance from artboard edges)
    // Simplified check - would need artboard bounds in real implementation
    if (element.bounds.x < minMargin || element.bounds.y < minMargin) {
      violations.push({
        id: `violation-${Date.now()}-${Math.random()}`,
        category: 'spacing',
        severity: 'minor',
        title: 'Insufficient margin',
        description: `Element is too close to the edge (less than ${minMargin}px margin).`,
        location: this.getElementLocation(element),
        suggestion: `Add at least ${minMargin}px margin from the edge.`,
        canAutoFix: true,
        fixed: false,
        elementId: element.id,
        elementBounds: element.bounds,
      });
    }

    // Check element spacing
    if (minElementSpacing) {
      for (const otherElement of allElements) {
        if (otherElement.id === element.id) continue;

        const distance = this.calculateElementDistance(element, otherElement);
        if (distance > 0 && distance < minElementSpacing) {
          violations.push({
            id: `violation-${Date.now()}-${Math.random()}`,
            category: 'spacing',
            severity: 'minor',
            title: 'Elements too close',
            description: `Elements are spaced less than ${minElementSpacing}px apart.`,
            location: this.getElementLocation(element),
            suggestion: `Increase spacing to at least ${minElementSpacing}px.`,
            canAutoFix: true,
            fixed: false,
            elementId: element.id,
            elementBounds: element.bounds,
          });
          break; // Only report once per element
        }
      }
    }

    return violations;
  }

  private checkAccessibilityCompliance(element: DocumentElement): Violation[] {
    const violations: Violation[] = [];
    const { minContrastRatio, minFontSize } = this.rules.accessibility;

    // Check font size
    if (element.font && element.font.size < minFontSize) {
      violations.push({
        id: `violation-${Date.now()}-${Math.random()}`,
        category: 'accessibility',
        severity: 'major',
        title: 'Font size below accessibility minimum',
        description: `Font size ${element.font.size}px is below the accessibility minimum of ${minFontSize}px.`,
        location: this.getElementLocation(element),
        suggestion: `Increase font size to at least ${minFontSize}px for better readability.`,
        canAutoFix: true,
        fixed: false,
        elementId: element.id,
        elementBounds: element.bounds,
      });
    }

    // Check contrast (simplified - would need background color in real implementation)
    if (element.color && element.type === 'text') {
      // Assume white background for contrast check
      const bgColor = { r: 1, g: 1, b: 1 };
      const ratio = contrastRatio(element.color, bgColor);
      if (ratio < minContrastRatio) {
        violations.push({
          id: `violation-${Date.now()}-${Math.random()}`,
          category: 'accessibility',
          severity: 'critical',
          title: 'Insufficient color contrast',
          description: `Text contrast ratio ${ratio.toFixed(2)}:1 is below the WCAG minimum of ${minContrastRatio}:1.`,
          location: this.getElementLocation(element),
          suggestion: `Use a darker color to meet the ${minContrastRatio}:1 contrast requirement.`,
          canAutoFix: true,
          fixed: false,
          elementId: element.id,
          elementBounds: element.bounds,
        });
      }
    }

    return violations;
  }

  private calculateScore(violations: Violation[], totalElements: number): ComplianceScore {
    const activeViolations = violations.filter((v) => !v.fixed);
    
    console.log(`📊 Calculating score: ${activeViolations.length} active violations, ${totalElements} total elements`);

    // If no violations, return perfect score
    if (activeViolations.length === 0) {
      console.log(`✅ No violations - returning perfect score`);
      return {
        overall: 100,
        categories: {
          color: 100,
          typography: 100,
          logo: 100,
          spacing: 100,
          accessibility: 100,
        },
        violations: {
          critical: 0,
          major: 0,
          minor: 0,
        },
      };
    }

    // Count violations by category
    const categoryCounts = {
      color: 0,
      typography: 0,
      logo: 0,
      spacing: 0,
      accessibility: 0,
    };

    const severityCounts = {
      critical: 0,
      major: 0,
      minor: 0,
    };

    activeViolations.forEach((v) => {
      categoryCounts[v.category]++;
      severityCounts[v.severity]++;
    });
    
    console.log(`📊 Violation counts:`, { categoryCounts, severityCounts });

    // Calculate category scores (0-100)
    // Each violation reduces the category score
    // Use totalElements to normalize, but ensure we always penalize violations
    const effectiveElementCount = Math.max(1, totalElements);
    
    const categoryScores = {
      // Subtract points based on violation count
      // Formula: 100 - (violations / elements) * penalty_percentage
      color: Math.max(0, 100 - (categoryCounts.color / effectiveElementCount) * 50),
      typography: Math.max(0, 100 - (categoryCounts.typography / effectiveElementCount) * 50),
      logo: Math.max(0, 100 - (categoryCounts.logo / effectiveElementCount) * 50),
      spacing: Math.max(0, 100 - (categoryCounts.spacing / effectiveElementCount) * 50),
      accessibility: Math.max(0, 100 - (categoryCounts.accessibility / effectiveElementCount) * 50),
    };
    
    console.log(`📊 Category scores (before penalties):`, categoryScores);

    // Calculate overall score (weighted average of category scores)
    const weights = {
      color: 0.2,
      typography: 0.2,
      logo: 0.25,
      spacing: 0.15,
      accessibility: 0.2,
    };

    const baseOverall =
      categoryScores.color * weights.color +
      categoryScores.typography * weights.typography +
      categoryScores.logo * weights.logo +
      categoryScores.spacing * weights.spacing +
      categoryScores.accessibility * weights.accessibility;

    // Calculate penalties based on severity
    // These are SUBTRACTED from the base score
    const criticalPenalty = severityCounts.critical * 15;
    const majorPenalty = severityCounts.major * 8;
    const minorPenalty = severityCounts.minor * 3;
    
    const totalPenalty = criticalPenalty + majorPenalty + minorPenalty;
    
    // SUBTRACT the penalties from the base score
    const scoreAfterPenalties = baseOverall - totalPenalty;
    
    // Ensure score is between 0 and 100
    const finalScore = Math.max(0, Math.min(100, scoreAfterPenalties));
    
    console.log(`📊 Final score calculation:`);
    console.log(`   Base score (weighted avg): ${baseOverall.toFixed(2)}`);
    console.log(`   Critical penalties: -${criticalPenalty} (${severityCounts.critical} × 15)`);
    console.log(`   Major penalties: -${majorPenalty} (${severityCounts.major} × 8)`);
    console.log(`   Minor penalties: -${minorPenalty} (${severityCounts.minor} × 3)`);
    console.log(`   Total penalties: -${totalPenalty}`);
    console.log(`   Score after penalties: ${scoreAfterPenalties.toFixed(2)}`);
    console.log(`   Final score: ${finalScore.toFixed(2)}`);

    return {
      overall: finalScore,
      categories: categoryScores,
      violations: severityCounts,
    };
  }

  private getElementLocation(element: DocumentElement): string {
    const typeLabels: Record<DocumentElement['type'], string> = {
      text: 'Text',
      shape: 'Shape',
      image: 'Image',
      group: 'Group',
      other: 'Element',
    };
    return `${typeLabels[element.type]} at (${Math.round(element.bounds.x)}, ${Math.round(element.bounds.y)})`;
  }

  private rgbToHex(color: { r: number; g: number; b: number }): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  private calculateElementDistance(
    element1: DocumentElement,
    element2: DocumentElement
  ): number {
    // Calculate minimum distance between two rectangles
    const x1 = element1.bounds.x;
    const y1 = element1.bounds.y;
    const w1 = element1.bounds.width;
    const h1 = element1.bounds.height;
    const x2 = element2.bounds.x;
    const y2 = element2.bounds.y;
    const w2 = element2.bounds.width;
    const h2 = element2.bounds.height;

    // Check if overlapping
    if (
      x1 < x2 + w2 &&
      x1 + w1 > x2 &&
      y1 < y2 + h2 &&
      y1 + h1 > y2
    ) {
      return 0; // Overlapping
    }

    // Calculate distance between nearest edges
    const dx = Math.max(0, Math.max(x1 - (x2 + w2), x2 - (x1 + w1)));
    const dy = Math.max(0, Math.max(y1 - (y2 + h2), y2 - (y1 + h1)));
    return Math.sqrt(dx * dx + dy * dy);
  }
}
