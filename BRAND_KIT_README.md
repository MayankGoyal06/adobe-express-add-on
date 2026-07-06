# Smart Brand Kit Enterprise Add-on for Adobe Express

## Overview

The Smart Brand Kit is an intelligent brand governance layer for Adobe Express that ensures every design created by non-designers and designers alike remains fully brand-compliant. Unlike simple asset libraries, this add-on provides real-time compliance monitoring, automatic violation detection, and intelligent brand rule enforcement.

## Key Features

### 🎨 Brand Rules Configuration
- **Color Palettes**: Define approved brand colors with usage guidelines
- **Typography Hierarchies**: Set approved fonts, sizes, and weights for headings, body text, and captions
- **Logo Usage Constraints**: Configure minimum sizes, clear space requirements, and background contrast rules
- **Layout & Spacing Guidelines**: Define margins, grid systems, and element spacing rules
- **Accessibility Standards**: Enforce WCAG contrast ratios, minimum font sizes, and readability requirements

### 🔍 Real-Time Document Scanning
- Continuously monitors the live design canvas
- Scans all elements including text, shapes, images, and groups
- Detects violations across colors, fonts, logos, assets, and layouts
- Updates compliance status in real-time as users design

### ⚠️ Violation Detection
The system detects and flags violations in five key categories:

1. **Color Violations**
   - Non-brand colors detected
   - Color usage outside approved palette
   - Automatic suggestions for brand-compliant alternatives

2. **Typography Violations**
   - Non-brand font families
   - Font sizes outside approved ranges
   - Incorrect font weights

3. **Logo Violations**
   - Logos below minimum size requirements
   - Insufficient clear space around logos
   - Background contrast issues

4. **Spacing Violations**
   - Elements too close to edges (insufficient margins)
   - Elements too close together (spacing violations)
   - Grid alignment issues

5. **Accessibility Violations**
   - Insufficient color contrast ratios (WCAG compliance)
   - Font sizes below accessibility minimums
   - Text readability issues

### 📊 Compliance Scoring
- **Overall Brand Compliance Score**: 0-100 scale
- **Category Breakdown**: Individual scores for each compliance category
- **Severity Tracking**: Critical, major, and minor violation counts
- **Real-time Updates**: Score updates automatically as violations are fixed

### 🎯 Visual Flagging
- Violations are visually flagged in the side panel
- Each violation shows:
  - Category icon
  - Severity badge (critical/major/minor)
  - Location information
  - Detailed description
  - Actionable suggestions
  - Auto-fix capability (when available)

### ✨ Auto-Fix Capabilities
- Automatically fixes violations when possible:
  - Replace non-brand colors with nearest brand color
  - Adjust font sizes to approved ranges
  - Fix spacing issues
  - Improve contrast ratios
- One-click "Fix All" for multiple violations

### 👥 Role-Based Access
- **Brand Admin**: Full access to configure brand rules
- **Designer**: View violations, fix issues, request approvals
- **Viewer**: Read-only access to compliance information

### 🚪 Export Gating
- Designs must meet compliance threshold (80% score, 0 violations) to export
- Approval workflow for non-compliant designs
- Draft export option for work-in-progress designs

## Architecture

### Document Sandbox (`src/sandbox/code.ts`)
- Scans document structure recursively
- Extracts element properties (colors, fonts, positions, sizes)
- Provides real-time monitoring API
- Handles auto-fix operations

### Violation Detection Engine (`src/services/violationDetector.ts`)
- Analyzes extracted elements against brand rules
- Calculates compliance scores
- Generates detailed violation reports
- Provides fix suggestions

### UI Components
- **BrandKitSidePanel**: Main interface showing compliance score, violations, and rules
- **ComplianceScore**: Visual score display with category breakdown
- **ViolationCard**: Individual violation display with fix options
- **BrandRulesPanel**: Brand rules configuration (admin only)
- **CategoryBreakdown**: Visual breakdown of compliance by category
- **ExportGate**: Export control with approval workflow

## File Structure

```
src/
├── types/
│   └── brand.ts              # Type definitions
├── data/
│   └── brandRules.ts         # Default brand rules
├── services/
│   └── violationDetector.ts  # Detection engine
├── lib/
│   └── utils.ts              # Utility functions (color calculations, etc.)
├── sandbox/
│   └── code.ts               # Document scanning
├── ui/
│   ├── components/
│   │   ├── SmartBrandKitApp.tsx
│   │   └── components/
│   │       ├── BrandKitSidePanel.tsx
│   │       ├── ComplianceScore.tsx
│   │       ├── ViolationCard.tsx
│   │       ├── CategoryBreakdown.tsx
│   │       ├── BrandRulesPanel.tsx
│   │       └── ExportGate.tsx
│   └── index.tsx             # Entry point
└── models/
    └── DocumentSandboxApi.ts  # API interface
```

## Usage

### For Designers

1. **Open the Add-on**: The Smart Brand Kit panel appears automatically
2. **Real-time Monitoring**: The add-on continuously scans your design
3. **View Violations**: Click on any violation to see details and suggestions
4. **Auto-Fix**: Click "Auto-fix" on violations that support it
5. **Export**: Once compliant (80%+ score, 0 violations), export your design

### For Brand Administrators

1. **Configure Rules**: Navigate to the "Rules" tab
2. **Set Brand Colors**: Add approved color palettes
3. **Define Typography**: Set approved fonts and size ranges
4. **Logo Guidelines**: Configure logo usage constraints
5. **Spacing Rules**: Define layout and spacing guidelines
6. **Accessibility**: Set WCAG compliance requirements

## Technical Details

### Brand Rules Structure

```typescript
interface BrandRules {
  colors: BrandColor[];        // Approved color palette
  fonts: BrandFont[];           // Typography system
  logos: BrandLogo[];           // Logo usage rules
  spacing: SpacingRules;        // Layout guidelines
  accessibility: AccessibilityRules; // WCAG standards
}
```

### Violation Detection

The system uses:
- **Color Distance Calculation**: Euclidean distance in RGB space
- **Contrast Ratio Calculation**: WCAG luminance formula
- **Element Distance Calculation**: Minimum distance between bounding boxes
- **Font Matching**: Family, size, and weight validation

### Compliance Scoring

Scores are calculated using:
- Weighted category averages
- Severity-based penalties (critical: -10, major: -5)
- Real-time recalculation on fixes

## Development

### Setup
```bash
npm install
npm run build
npm run start
```

### Customization

1. **Brand Rules**: Edit `src/data/brandRules.ts` to customize default rules
2. **Detection Logic**: Modify `src/services/violationDetector.ts` for custom detection rules
3. **UI Styling**: Update component styles in `src/ui/components/components/`

## Future Enhancements

- [ ] Machine learning for logo detection
- [ ] Advanced layout pattern recognition
- [ ] Brand asset library integration
- [ ] Team collaboration features
- [ ] Compliance reporting and analytics
- [ ] Custom rule templates
- [ ] Integration with design systems (Figma, Sketch)

## License

This is an example add-on for Adobe Express. Customize and extend as needed for your organization.
