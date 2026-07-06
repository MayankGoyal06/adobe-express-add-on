import React, { useEffect, useMemo, useState } from 'react';
import { BrandRules } from '../../../types/brand';

interface BrandRulesPanelProps {
  rules: BrandRules;
  onUpdate?: (rules: BrandRules) => void;
  isAdmin?: boolean;
}

export const BrandRulesPanel: React.FC<BrandRulesPanelProps> = ({ rules, onUpdate, isAdmin }) => {
  const [draftRules, setDraftRules] = useState<BrandRules>(rules);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    colors: true,
    fonts: false,
    logos: false,
    spacing: false,
    accessibility: false,
  });

  useEffect(() => {
    setDraftRules(rules);
  }, [rules]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleApply = () => {
    if (!onUpdate) return;
    onUpdate(draftRules);
  };

  const toHex = (value: number) => Math.max(0, Math.min(255, Math.round(value * 255)))
    .toString(16)
    .padStart(2, '0');

  const hexToRgb = (hex: string) => {
    const cleaned = hex.replace('#', '').trim();
    if (cleaned.length !== 6) return null;
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return { r: r / 255, g: g / 255, b: b / 255 };
  };

  const normalizeHex = (hex: string) => {
    const cleaned = hex.startsWith('#') ? hex : `#${hex}`;
    if (cleaned.length === 4) {
      return `#${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}${cleaned[3]}${cleaned[3]}`.toUpperCase();
    }
    return cleaned.toUpperCase();
  };

  const updateColor = (index: number, updates: Partial<BrandRules['colors'][number]>) => {
    setDraftRules((prev) => {
      const next = { ...prev, colors: [...prev.colors] };
      const current = { ...next.colors[index], ...updates };
      if (updates.hex) {
        const rgb = hexToRgb(updates.hex);
        if (rgb) {
          current.rgb = rgb;
          current.hex = normalizeHex(updates.hex);
        }
      }
      next.colors[index] = current;
      return next;
    });
  };

  const addColor = () => {
    setDraftRules((prev) => ({
      ...prev,
      colors: [
        ...prev.colors,
        {
          id: `color-${Date.now()}`,
          name: 'New Color',
          hex: '#000000',
          rgb: { r: 0, g: 0, b: 0 },
          usage: 'primary',
        },
      ],
    }));
  };

  const removeColor = (index: number) => {
    setDraftRules((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, idx) => idx !== index),
    }));
  };

  const updateFont = (index: number, updates: Partial<BrandRules['fonts'][number]>) => {
    setDraftRules((prev) => {
      const next = { ...prev, fonts: [...prev.fonts] };
      next.fonts[index] = { ...next.fonts[index], ...updates };
      return next;
    });
  };

  const addFont = () => {
    setDraftRules((prev) => ({
      ...prev,
      fonts: [
        ...prev.fonts,
        {
          id: `font-${Date.now()}`,
          name: 'New Font',
          family: 'Arial',
          postscriptName: 'ArialMT',
          usage: 'body',
          weight: '400',
          minSize: 12,
          maxSize: 18,
          allowedWeights: [400],
        },
      ],
    }));
  };

  const removeFont = (index: number) => {
    setDraftRules((prev) => ({
      ...prev,
      fonts: prev.fonts.filter((_, idx) => idx !== index),
    }));
  };

  const updateLogo = (index: number, updates: Partial<BrandRules['logos'][number]>) => {
    setDraftRules((prev) => {
      const next = { ...prev, logos: [...prev.logos] };
      next.logos[index] = { ...next.logos[index], ...updates };
      return next;
    });
  };

  const addLogo = () => {
    setDraftRules((prev) => ({
      ...prev,
      logos: [
        ...prev.logos,
        {
          id: `logo-${Date.now()}`,
          name: 'New Logo',
          minSize: 50,
          clearSpace: 20,
          allowedBackgrounds: ['#FFFFFF'],
          prohibitedBackgrounds: [],
          minContrastRatio: 3,
        },
      ],
    }));
  };

  const removeLogo = (index: number) => {
    setDraftRules((prev) => ({
      ...prev,
      logos: prev.logos.filter((_, idx) => idx !== index),
    }));
  };

  const spacingDraft = draftRules.spacing;
  const accessibilityDraft = draftRules.accessibility;

  const rulesChanged = useMemo(
    () => JSON.stringify(rules) !== JSON.stringify(draftRules),
    [rules, draftRules]
  );

  return (
    <div>
      <h3 style={{ 
        margin: '0 0 12px', 
        fontSize: '12px', 
        textTransform: 'uppercase', 
        color: '#999',
        letterSpacing: '1px'
      }}>
        Brand Rules
      </h3>

      <div style={{ marginBottom: '12px', borderBottom: '1px solid #333', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#999' }}>
          Edit brand rules with the form below
        </span>
        <button
          onClick={handleApply}
          disabled={!rulesChanged || !onUpdate}
          style={{
            padding: '8px 12px',
            backgroundColor: rulesChanged ? '#0066CC' : '#333',
            color: rulesChanged ? '#fff' : '#888',
            border: 'none',
            borderRadius: '6px',
            cursor: rulesChanged ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          Apply Changes
        </button>
      </div>

      {/* Colors */}
      <div style={{ marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
        <button
          onClick={() => toggleSection('colors')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          <span>🎨 Colors ({draftRules.colors.length})</span>
          <span>{expandedSections.colors ? '▼' : '▶'}</span>
        </button>
        {expandedSections.colors && (
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '0 12px 12px'
          }}>
            {draftRules.colors.map((color, index) => (
              <div key={color.id} style={{ backgroundColor: '#333', borderRadius: '6px', padding: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ height: '28px', width: '28px', borderRadius: '6px', backgroundColor: color.hex, border: '1px solid #555' }} />
                  <input
                    value={color.name}
                    onChange={(event) => updateColor(index, { name: event.target.value })}
                    style={{ flex: 1, backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                  />
                  <button
                    onClick={() => removeColor(index)}
                    style={{ background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    value={color.hex}
                    onChange={(event) => updateColor(index, { hex: event.target.value })}
                    style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  <select
                    value={color.usage}
                    onChange={(event) => updateColor(index, { usage: event.target.value as any })}
                    style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="accent">Accent</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
                <div style={{ marginTop: '6px', fontSize: '10px', color: '#999' }}>
                  RGB: {toHex(color.rgb.r)}{toHex(color.rgb.g)}{toHex(color.rgb.b)}
                </div>
              </div>
            ))}
            <button
              onClick={addColor}
              style={{ padding: '8px', backgroundColor: 'transparent', border: '1px dashed #555', color: '#ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              + Add Color
            </button>
          </div>
        )}
      </div>

      {/* Fonts */}
      <div style={{ marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
        <button
          onClick={() => toggleSection('fonts')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          <span>🔤 Typography ({draftRules.fonts.length})</span>
          <span>{expandedSections.fonts ? '▼' : '▶'}</span>
        </button>
        {expandedSections.fonts && (
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {draftRules.fonts.map((font, index) => (
              <div key={font.id} style={{ backgroundColor: '#333', borderRadius: '6px', padding: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    value={font.name}
                    onChange={(event) => updateFont(index, { name: event.target.value })}
                    style={{ flex: 1, backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                  />
                  <button
                    onClick={() => removeFont(index)}
                    style={{ background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input
                    value={font.family}
                    onChange={(event) => updateFont(index, { family: event.target.value })}
                    placeholder="Family"
                    style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                  />
                  <input
                    value={font.postscriptName || ''}
                    onChange={(event) => updateFont(index, { postscriptName: event.target.value })}
                    placeholder="PostScript Name"
                    style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <select
                    value={font.usage}
                    onChange={(event) => updateFont(index, { usage: event.target.value as any })}
                    style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                  >
                    <option value="heading">Heading</option>
                    <option value="body">Body</option>
                    <option value="caption">Caption</option>
                    <option value="display">Display</option>
                  </select>
                  <input
                    value={font.weight}
                    onChange={(event) => updateFont(index, { weight: event.target.value })}
                    placeholder="Weight"
                    style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="number"
                    value={font.minSize ?? ''}
                    onChange={(event) => updateFont(index, { minSize: event.target.value === '' ? undefined : Number(event.target.value) })}
                    placeholder="Min Size"
                    style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                  />
                  <input
                    type="number"
                    value={font.maxSize ?? ''}
                    onChange={(event) => updateFont(index, { maxSize: event.target.value === '' ? undefined : Number(event.target.value) })}
                    placeholder="Max Size"
                    style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                  />
                </div>
                <input
                  value={font.allowedWeights?.join(',') || ''}
                  onChange={(event) => updateFont(index, {
                    allowedWeights: event.target.value
                      .split(',')
                      .map((val) => Number(val.trim()))
                      .filter((val) => !Number.isNaN(val)),
                  })}
                  placeholder="Allowed weights (comma-separated)"
                  style={{ marginTop: '8px', width: '100%', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                />
              </div>
            ))}
            <button
              onClick={addFont}
              style={{ padding: '8px', backgroundColor: 'transparent', border: '1px dashed #555', color: '#ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              + Add Font
            </button>
          </div>
        )}
      </div>

      {/* Logos */}
      <div style={{ marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
        <button
          onClick={() => toggleSection('logos')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          <span>🖼️ Logos ({draftRules.logos.length})</span>
          <span>{expandedSections.logos ? '▼' : '▶'}</span>
        </button>
        {expandedSections.logos && (
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {draftRules.logos.map((logo, index) => (
              <div key={logo.id} style={{ backgroundColor: '#333', borderRadius: '6px', padding: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    value={logo.name}
                    onChange={(event) => updateLogo(index, { name: event.target.value })}
                    style={{ flex: 1, backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                  />
                  <button
                    onClick={() => removeLogo(index)}
                    style={{ background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="number"
                    value={logo.minSize}
                    onChange={(event) => updateLogo(index, { minSize: Number(event.target.value) })}
                    placeholder="Min Size"
                    style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                  />
                  <input
                    type="number"
                    value={logo.clearSpace}
                    onChange={(event) => updateLogo(index, { clearSpace: Number(event.target.value) })}
                    placeholder="Clear Space"
                    style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                  />
                </div>
                <input
                  value={logo.allowedBackgrounds?.join(',') || ''}
                  onChange={(event) => updateLogo(index, {
                    allowedBackgrounds: event.target.value
                      .split(',')
                      .map((val) => normalizeHex(val.trim()))
                      .filter((val) => val.length > 1),
                  })}
                  placeholder="Allowed backgrounds (#FFFFFF,#F5F5F5)"
                  style={{ width: '100%', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px', marginBottom: '8px' }}
                />
                <input
                  value={logo.prohibitedBackgrounds?.join(',') || ''}
                  onChange={(event) => updateLogo(index, {
                    prohibitedBackgrounds: event.target.value
                      .split(',')
                      .map((val) => normalizeHex(val.trim()))
                      .filter((val) => val.length > 1),
                  })}
                  placeholder="Prohibited backgrounds (#000000,#333333)"
                  style={{ width: '100%', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px', marginBottom: '8px' }}
                />
                <input
                  type="number"
                  value={logo.minContrastRatio ?? ''}
                  onChange={(event) => updateLogo(index, { minContrastRatio: event.target.value === '' ? undefined : Number(event.target.value) })}
                  placeholder="Min Contrast Ratio"
                  style={{ width: '100%', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '6px', fontSize: '12px' }}
                />
              </div>
            ))}
            <button
              onClick={addLogo}
              style={{ padding: '8px', backgroundColor: 'transparent', border: '1px dashed #555', color: '#ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              + Add Logo Rule
            </button>
          </div>
        )}
      </div>

      {/* Spacing */}
      <div style={{ marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
        <button
          onClick={() => toggleSection('spacing')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          <span>📐 Spacing</span>
          <span>{expandedSections.spacing ? '▼' : '▶'}</span>
        </button>
        {expandedSections.spacing && (
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="number"
                value={spacingDraft.minMargin}
                onChange={(event) => setDraftRules((prev) => ({
                  ...prev,
                  spacing: { ...prev.spacing, minMargin: Number(event.target.value) },
                }))}
                placeholder="Minimum Margin"
                style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '8px', fontSize: '12px' }}
              />
              <input
                type="number"
                value={spacingDraft.gridSize}
                onChange={(event) => setDraftRules((prev) => ({
                  ...prev,
                  spacing: { ...prev.spacing, gridSize: Number(event.target.value) },
                }))}
                placeholder="Grid Size"
                style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '8px', fontSize: '12px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="number"
                value={spacingDraft.minElementSpacing ?? ''}
                onChange={(event) => setDraftRules((prev) => ({
                  ...prev,
                  spacing: { ...prev.spacing, minElementSpacing: event.target.value === '' ? undefined : Number(event.target.value) },
                }))}
                placeholder="Min Element Spacing"
                style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '8px', fontSize: '12px' }}
              />
              <input
                type="number"
                value={spacingDraft.maxElementSpacing ?? ''}
                onChange={(event) => setDraftRules((prev) => ({
                  ...prev,
                  spacing: { ...prev.spacing, maxElementSpacing: event.target.value === '' ? undefined : Number(event.target.value) },
                }))}
                placeholder="Max Element Spacing"
                style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '8px', fontSize: '12px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Accessibility */}
      <div style={{ marginBottom: '8px' }}>
        <button
          onClick={() => toggleSection('accessibility')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          <span>👁️ Accessibility</span>
          <span>{expandedSections.accessibility ? '▼' : '▶'}</span>
        </button>
        {expandedSections.accessibility && (
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="number"
                value={accessibilityDraft.minContrastRatio}
                onChange={(event) => setDraftRules((prev) => ({
                  ...prev,
                  accessibility: { ...prev.accessibility, minContrastRatio: Number(event.target.value) },
                }))}
                placeholder="Min Contrast Ratio"
                style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '8px', fontSize: '12px' }}
              />
              <input
                type="number"
                value={accessibilityDraft.minFontSize}
                onChange={(event) => setDraftRules((prev) => ({
                  ...prev,
                  accessibility: { ...prev.accessibility, minFontSize: Number(event.target.value) },
                }))}
                placeholder="Min Font Size"
                style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '8px', fontSize: '12px' }}
              />
            </div>
            <input
              type="number"
              value={accessibilityDraft.maxTextWidth ?? ''}
              onChange={(event) => setDraftRules((prev) => ({
                ...prev,
                accessibility: { ...prev.accessibility, maxTextWidth: event.target.value === '' ? undefined : Number(event.target.value) },
              }))}
              placeholder="Max Text Width"
              style={{ backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '8px', fontSize: '12px' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#ccc' }}>
              <input
                type="checkbox"
                checked={Boolean(accessibilityDraft.requireAltText)}
                onChange={(event) => setDraftRules((prev) => ({
                  ...prev,
                  accessibility: { ...prev.accessibility, requireAltText: event.target.checked },
                }))}
              />
              Require alt text
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
