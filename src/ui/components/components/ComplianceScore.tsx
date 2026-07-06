import React, { useEffect, useState } from 'react';

interface ComplianceScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ComplianceScore: React.FC<ComplianceScoreProps> = ({ 
  score, 
  size = 'md' 
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [score]);

  const sizeConfig = {
    sm: { container: 80, fontSize: '20px' },
    md: { container: 140, fontSize: '40px' },
    lg: { container: 180, fontSize: '56px' },
  };

  const config = sizeConfig[size];
  const radius = (config.container - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  const getScoreColor = () => {
    if (displayScore >= 80) return '#00cc00';
    if (displayScore >= 60) return '#ffaa00';
    return '#ff4444';
  };

  const getStatus = () => {
    if (displayScore >= 80) return 'Compliant';
    if (displayScore >= 60) return 'Needs Work';
    return 'Non-Compliant';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: config.container, height: config.container }}>
        <svg
          style={{ transform: 'rotate(-90deg)' }}
          width={config.container}
          height={config.container}
        >
          {/* Background circle */}
          <circle
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            stroke="#333"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={config.container / 2}
            cy={config.container / 2}
            r={radius}
            strokeWidth="8"
            fill="none"
            stroke={getScoreColor()}
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 1s ease-out',
            }}
          />
        </svg>
        
        {/* Score text */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: config.fontSize, fontWeight: 'bold', color: '#fff' }}>
            {displayScore}
          </span>
          <span style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', marginTop: '4px' }}>
            {getStatus()}
          </span>
        </div>
      </div>
    </div>
  );
};
