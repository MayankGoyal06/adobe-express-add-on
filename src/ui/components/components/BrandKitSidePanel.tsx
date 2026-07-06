import React, { useState, useMemo } from 'react';
import { Violation, ComplianceScore, BrandRules, UserRole } from '../../../types/brand';
import { ComplianceScore as ComplianceScoreComponent } from './ComplianceScore';
import { ViolationCard } from './ViolationCard';
import { CategoryBreakdown } from './CategoryBreakdown';
import { BrandRulesPanel } from './BrandRulesPanel';
import { ExportGate } from './ExportGate';

/* 🎨 PREMIUM COLOR THEME (SAFE) */
const COLORS = {
  bg: '#0B0E14',
  card: '#161A22',
  panel: '#1C2230',
  border: '#2A3142',

  accentStart: '#8B5CF6',
  accentEnd: '#3B82F6',

  textMuted: '#9CA3AF',
  danger: '#EF4444',
};

interface BrandKitSidePanelProps {
  violations: Violation[];
  score: ComplianceScore;
  isScanning: boolean;
  brandRules: BrandRules;
  onScan: (force?: boolean) => Promise<void> | void;
  onAutoFix: (id: string, options?: { rescan?: boolean }) => Promise<void>;
  onRulesUpdate?: (rules: BrandRules) => void;
  isRealTimeMonitoring?: boolean;
  onToggleRealTimeMonitoring?: () => void;
  currentUserRole?: UserRole;
}

export const BrandKitSidePanel: React.FC<BrandKitSidePanelProps> = ({
  violations,
  score,
  isScanning,
  brandRules,
  onScan,
  onAutoFix,
  onRulesUpdate,
  isRealTimeMonitoring = false,
  onToggleRealTimeMonitoring,
  currentUserRole = 'designer',
}) => {
  const [activeTab, setActiveTab] =
    useState<'issues' | 'rules' | 'analytics'>('issues');
  const [showAllViolations, setShowAllViolations] = useState(false);

  const activeViolations = useMemo(
    () => violations.filter(v => !v.fixed),
    [violations]
  );

  const displayedViolations = showAllViolations
    ? activeViolations
    : activeViolations.slice(0, 3);

  const handleFixAll = async () => {
    const fixable = activeViolations.filter(v => v.canAutoFix);
    for (const violation of fixable) {
      await onAutoFix(violation.id, { rescan: false });
    }
    await onScan(true);
  };

  return (
    <div
      style={{
        width: '360px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: COLORS.bg,
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* HEADER */}
      <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${COLORS.accentStart}, ${COLORS.accentEnd})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            🛡️
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
              Smart Brand Kit
            </h1>
            <p style={{ margin: 0, fontSize: 10, color: COLORS.textMuted }}>
              Real-time Compliance
            </p>
          </div>
        </div>

        {onToggleRealTimeMonitoring && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: COLORS.panel,
              borderRadius: 12,
              fontSize: 12,
            }}
          >
            <span>Real-time Monitoring</span>
            <button
              onClick={onToggleRealTimeMonitoring}
              style={{
                width: 42,
                height: 22,
                borderRadius: 11,
                background: isRealTimeMonitoring
                  ? `linear-gradient(135deg, ${COLORS.accentStart}, ${COLORS.accentEnd})`
                  : '#374151',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  position: 'absolute',
                  top: 3,
                  left: isRealTimeMonitoring ? 22 : 4,
                  transition: 'left 0.25s ease',
                }}
              />
            </button>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* SCORE CARD */}
        <div
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 18,
            padding: 16,
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ filter: 'hue-rotate(140deg) saturate(1.25)' }}>
            <ComplianceScoreComponent score={score.overall} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => onScan(true)}
              disabled={isScanning}
              style={{
                flex: 1,
                padding: 8,
                background: '#1F2937',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                color: '#fff',
              }}
            >
              {isScanning ? '⏳ Scanning…' : '🔄 Re-scan'}
            </button>

            <div
              style={{
                padding: '8px 10px',
                borderRadius: 12,
                backgroundColor: COLORS.panel,
                fontSize: 10,
              }}
            >
              {isRealTimeMonitoring ? '🟣 ON' : '⚪ OFF'}
            </div>

            {activeViolations.filter(v => v.canAutoFix).length > 0 && (
              <button
                onClick={handleFixAll}
                style={{
                  flex: 1,
                  padding: 8,
                  background: `linear-gradient(135deg, ${COLORS.accentStart}, ${COLORS.accentEnd})`,
                  borderRadius: 12,
                  border: 'none',
                  color: '#fff',
                }}
              >
                ✨ Fix All
              </button>
            )}
          </div>
        </div>

{/* CATEGORY BREAKDOWN — FINAL FIX */}
<div
  style={{
    backgroundColor: '#1F2937', // ✅ SAME AS TABS (restored)
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  }}
>
  {/* ✅ ONLY recolor progress bars, NOT background */}
  <div style={{ filter: 'hue-rotate(150deg) saturate(1.15)' }}>
    <CategoryBreakdown categories={score.categories} />
  </div>
</div>



        {/* TABS */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {['issues', 'rules', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 14,
                border: 'none',
                background:
                  activeTab === tab
                    ? `linear-gradient(135deg, ${COLORS.accentStart}, ${COLORS.accentEnd})`
                    : '#1F2937',
                color: '#fff',
                fontSize: 12,
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'issues' &&
          (activeViolations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 48 }}>✅</div>
              <p style={{ fontWeight: 700 }}>All clear!</p>
            </div>
          ) : (
            displayedViolations.map(v => (
              <ViolationCard key={v.id} violation={v} onAutoFix={onAutoFix} />
            ))
          ))}

        {activeTab === 'rules' && (
          <BrandRulesPanel
            rules={brandRules}
            onUpdate={onRulesUpdate}
            isAdmin={currentUserRole === 'admin'}
          />
        )}
      </div>

      {/* FOOTER */}
      <div
        style={{
          borderTop: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.panel,
          padding: 16,
        }}
      >
        <ExportGate score={score.overall} violations={activeViolations.length} />
      </div>
    </div>
  );
};
