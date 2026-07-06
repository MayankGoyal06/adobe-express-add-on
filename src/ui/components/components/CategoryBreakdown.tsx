import React from 'react';
import { ViolationCategory } from '../../../types/brand';

interface CategoryBreakdownProps {
  categories: Record<ViolationCategory, number>;
}

const categoryConfig: Record<ViolationCategory, { icon: string; label: string }> = {
  color: { icon: '🎨', label: 'Colors' },
  typography: { icon: '🔤', label: 'Typography' },
  logo: { icon: '🖼️', label: 'Logo' },
  spacing: { icon: '📐', label: 'Spacing' },
  accessibility: { icon: '👁️', label: 'Accessibility' },
};

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ categories }) => {
  return (
    <div>
      <h3 style={{ 
        margin: '0 0 12px', 
        fontSize: '12px', 
        textTransform: 'uppercase', 
        color: '#999',
        letterSpacing: '1px'
      }}>
        Category Breakdown
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(Object.keys(categories) as ViolationCategory[]).map((category) => {
          const score = categories[category];
          const config = categoryConfig[category];
          
          const getColor = () => {
            if (score >= 80) return '#00cc00';
            if (score >= 60) return '#ffaa00';
            return '#ff4444';
          };
          
          return (
            <div key={category}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{config.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
                    {config.label}
                  </span>
                </div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: getColor()
                }}>
                  {score}%
                </span>
              </div>
              <div style={{
                height: '6px',
                width: '100%',
                backgroundColor: '#333',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: getColor(),
                    width: `${score}%`,
                    transition: 'width 0.5s ease-out'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
