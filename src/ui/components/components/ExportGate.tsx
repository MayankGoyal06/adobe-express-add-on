import React from 'react';

interface ExportGateProps {
  score: number;
  violations: number;
}

export const ExportGate: React.FC<ExportGateProps> = ({ score, violations }) => {
  const isCompliant = score >= 80 && violations === 0;
  const canExportWithWarning = score >= 60;

  return (
    <div style={{
      backgroundColor: '#252525',
      borderRadius: '12px',
      padding: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '12px', 
          textTransform: 'uppercase', 
          color: '#999',
          letterSpacing: '1px'
        }}>
          Export Status
        </h3>
        {isCompliant ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00cc00' }}>
            <span>✅</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Ready</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffaa00' }}>
            <span>🔒</span>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Gated</span>
          </div>
        )}
      </div>

      {isCompliant ? (
        <>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#999' }}>
            Design is fully compliant and ready for export.
          </p>
          <button style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#00cc00',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span>⬇️</span>
            Export Design
          </button>
        </>
      ) : (
        <>
          <div style={{
            backgroundColor: '#ffaa0020',
            border: '1px solid #ffaa0040',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px',
            display: 'flex',
            gap: '8px',
            alignItems: 'start'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#ffaa00' }}>
                Export blocked
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#ffaa00cc' }}>
                {violations} unresolved violation{violations !== 1 ? 's' : ''} detected. 
                Fix issues or request approval.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              disabled={!canExportWithWarning}
              style={{
                padding: '10px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '6px',
                cursor: canExportWithWarning ? 'pointer' : 'not-allowed',
                fontSize: '12px',
                opacity: canExportWithWarning ? 1 : 0.5
              }}
            >
              ⬇️ Draft
            </button>
            <button 
              style={{
                padding: '10px',
                backgroundColor: '#0066CC',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>📤</span>
              Approval
            </button>
          </div>
        </>
      )}
    </div>
  );
};
