import React from 'react';
import { Violation } from '../../../types/brand';

interface ViolationCardProps {
  violation: Violation;
  onAutoFix: (id: string, options?: { rescan?: boolean }) => Promise<void>;
}

const categoryIcons: Record<Violation['category'], string> = {
  color: '🎨',
  typography: '🔤',
  logo: '🖼️',
  spacing: '📐',
  accessibility: '👁️',
};

const severityColors: Record<Violation['severity'], string> = {
  critical: '#ff4444',
  major: '#ffaa00',
  minor: '#ffdd00',
};

export const ViolationCard: React.FC<ViolationCardProps> = ({ violation, onAutoFix }) => {
  const { id, category, severity, title, description, location, suggestion, canAutoFix, fixed } = violation;

  if (fixed) {
    return (
      <div style={{
        backgroundColor: '#252525',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        opacity: 0.6
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '24px' }}>✅</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#00cc00', textDecoration: 'line-through' }}>
              {title}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>Fixed</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#252525',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '8px',
      borderLeft: `3px solid ${severityColors[severity]}`,
    }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Category icon */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          backgroundColor: `${severityColors[severity]}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0
        }}>
          {categoryIcons[category]}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{title}</h4>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>{location}</p>
            </div>
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              backgroundColor: `${severityColors[severity]}40`,
              color: severityColors[severity],
              textTransform: 'capitalize'
            }}>
              {severity}
            </span>
          </div>

          <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#ccc', lineHeight: '1.5' }}>
            {description}
          </p>

          {/* Suggestion */}
          <div style={{
            backgroundColor: '#333',
            borderRadius: '6px',
            padding: '8px',
            marginBottom: '8px',
            display: 'flex',
            gap: '8px',
            alignItems: 'start'
          }}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <p style={{ margin: 0, fontSize: '12px', color: '#ffaa00', flex: 1 }}>{suggestion}</p>
          </div>

          {/* Auto-fix button */}
          {canAutoFix && (
            <button
              onClick={() => onAutoFix(id)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#0066CC',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ✨ Auto-fix
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
