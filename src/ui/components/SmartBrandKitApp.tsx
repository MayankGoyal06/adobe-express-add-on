import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Theme } from "@swc-react/theme";
import { BrandKitSidePanel } from './components/BrandKitSidePanel';
import { ViolationDetector } from '../../services/violationDetector';
import { defaultBrandRules } from '../../data/brandRules';
import { DocumentElement, Violation, ComplianceScore, BrandRules } from '../../types/brand';
import { DocumentSandboxApi } from '../../models/DocumentSandboxApi';

interface SmartBrandKitAppProps {
  sandboxProxy: DocumentSandboxApi;
}

export const SmartBrandKitApp: React.FC<SmartBrandKitAppProps> = ({ sandboxProxy }) => {
  const RULES_STORAGE_KEY = 'smartBrandKit.brandRules';
  const [violations, setViolations] = useState<Violation[]>([]);
  const [score, setScore] = useState<ComplianceScore>({
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
  });
  const [isScanning, setIsScanning] = useState(false);
  const [brandRules, setBrandRules] = useState<BrandRules>(defaultBrandRules);
  const [isRealTimeMonitoring, setIsRealTimeMonitoring] = useState(true);
  
  // Create detector and update it when rules change
  const [detector] = useState(() => new ViolationDetector(defaultBrandRules));
  
  // Store polling interval ID for cleanup
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastElementsCountRef = useRef(0);
  const cleanStreakRef = useRef(0);
  const lastScoreRef = useRef<ComplianceScore | null>(null);
  const lastViolationsRef = useRef<Violation[]>([]);
  const getPerfectScore = useCallback((): ComplianceScore => ({
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
  }), []);

  const buildScoreFromViolations = useCallback(
    (elementsCount: number, violationsList: Violation[], baseOverall?: number): ComplianceScore => {
      const totalElements = Math.max(1, elementsCount);
      const categoryCounts = {
        color: 0,
        typography: 0,
        logo: 0,
        spacing: 0,
        accessibility: 0,
      };
      const severityCounts = { critical: 0, major: 0, minor: 0 };

      violationsList.forEach((v) => {
        categoryCounts[v.category]++;
        severityCounts[v.severity]++;
      });

      const categories = {
        color: Math.max(0, 100 - (categoryCounts.color / totalElements) * 50),
        typography: Math.max(0, 100 - (categoryCounts.typography / totalElements) * 50),
        logo: Math.max(0, 100 - (categoryCounts.logo / totalElements) * 50),
        spacing: Math.max(0, 100 - (categoryCounts.spacing / totalElements) * 50),
        accessibility: Math.max(0, 100 - (categoryCounts.accessibility / totalElements) * 50),
      };

      const overall =
        typeof baseOverall === 'number'
          ? baseOverall
          : categories.color * 0.2 +
            categories.typography * 0.2 +
            categories.logo * 0.25 +
            categories.spacing * 0.15 +
            categories.accessibility * 0.2;

      return { overall, categories, violations: severityCounts };
    },
    []
  );

  const mapComplianceViolations = useCallback(
    (compliance: any, elements: DocumentElement[]): Violation[] => {
      if (!compliance || !Array.isArray(compliance.violations)) {
        return [];
      }

      return compliance.violations.map((v: any) => {
        const element = elements.find((el) => el.id === v.elementId);
        const bounds = element?.bounds || { x: 0, y: 0, width: 0, height: 0 };
        const category =
          v.type === 'COLOR'
            ? 'color'
            : v.type === 'FONT'
              ? 'typography'
              : 'accessibility';
        const canAutoFix = v.type === 'COLOR' || v.type === 'FONT';

        return {
          id: `compliance-${v.elementId || 'unknown'}-${Math.random()}`,
          category,
          severity: v.severity || 'major',
          title:
            v.type === 'COLOR'
              ? 'Non-brand color'
              : v.type === 'FONT'
                ? 'Non-brand font'
                : 'Compliance issue',
          description: v.reason || 'Detected non-compliant element.',
          location: element
            ? `${element.type} at (${Math.round(bounds.x)}, ${Math.round(bounds.y)})`
            : 'Unknown location',
          suggestion:
            v.type === 'COLOR'
              ? 'Use a brand-approved color.'
              : v.type === 'FONT'
                ? 'Use a brand-approved font.'
                : 'Review brand rules.',
          canAutoFix,
          fixed: false,
          elementId: v.elementId,
          elementBounds: bounds,
          metadata: v,
        };
      });
    },
    []
  );

  const shouldAcceptScan = useCallback(
    (elementsCount: number, violationsCount: number, scoreOverall: number) => {
      const lastElements = lastElementsCountRef.current;
      const isClean = violationsCount === 0 && scoreOverall >= 99.9;

      if (elementsCount === 0) {
        // Always allow updates when the page is empty so score resets to 100.
        return true;
      }

      if (isClean) {
        cleanStreakRef.current = 0;
        return true;
      }

      cleanStreakRef.current = 0;
      return true;
    },
    []
  );

  // Load brand rules from sandbox on mount
  useEffect(() => {
    const loadBrandRules = async () => {
      try {
        const stored = localStorage.getItem(RULES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as BrandRules;
          setBrandRules(parsed);
          detector.updateRules(parsed);
          await sandboxProxy.updateBrandRules(parsed);
          console.log('✅ UI: Brand rules restored from local storage');
          return;
        }

        const rules = await sandboxProxy.getBrandRules();
        console.log('📋 UI: Loaded brand rules from sandbox:', rules);
        if (rules) {
          setBrandRules(rules);
          detector.updateRules(rules);
          localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
          console.log('✅ UI: Brand rules updated in detector');
        }
      } catch (error) {
        console.error('❌ UI: Error loading brand rules from sandbox:', error);
        // Fall back to default rules
        detector.updateRules(defaultBrandRules);
      }
    };
    loadBrandRules();
  }, [sandboxProxy, detector]);

  // Scan document - force parameter forces a new scan even if one is in progress
  const scanDocument = useCallback(async (force: boolean = false) => {
    console.log(`🔍 UI: scanDocument called (force: ${force})`);
    setIsScanning(true);
    try {
      const result = await sandboxProxy.scanDocument(force);
      console.log(`📥 UI: Received scan result: ${result.elements.length} elements, error: ${result.error}`);
      
      if (result.error) {
        console.error('❌ UI: Scan error:', result.error);
        setIsScanning(false);
        return;
      }

      // Prefer the latest sandbox snapshot if available (ensures rescan uses fresh data)
      let elementsSource = result.elements;
      if (result.timestamp) {
        const lastResult = await sandboxProxy.getLastScanResult();
        if (lastResult.elements && lastResult.elements.length > 0) {
          elementsSource = lastResult.elements;
        }
      }

      const elements: DocumentElement[] = elementsSource.map((el: any) => ({
        id: el.id,
        type: el.type,
        bounds: el.bounds,
        color: el.color,
        font: el.font,
        isLogo: el.isLogo,
        logoId: el.logoId,
        metadata: el.metadata,
      }));

      console.log(`🔍 UI: Running violation detection on ${elements.length} elements...`);
      console.log(`📋 UI: Using brand rules:`, {
        colors: brandRules.colors.length,
        fonts: brandRules.fonts.length,
        logos: brandRules.logos.length
      });
      
      // Log element details for debugging
      elements.forEach((el, idx) => {
        if (el.type === 'text') {
          console.log(`  Element ${idx + 1} (text):`, {
            font: el.font,
            color: el.color,
            bounds: el.bounds
          });
        }
      });

      // Run violation detection (UI-side) unless sandbox provides compliance
      const uiDetection = detector.scanDocument(elements);
      let detectedViolations = uiDetection.violations;
      let calculatedScore = uiDetection.score;

      if (result.compliance) {
        const complianceViolations = mapComplianceViolations(result.compliance, elements);
        if (complianceViolations.length > 0 || typeof result.compliance.score === 'number') {
          detectedViolations = complianceViolations;
          calculatedScore = {
            ...buildScoreFromViolations(elements.length, complianceViolations, result.compliance.score),
            overall: typeof result.compliance.score === 'number' ? result.compliance.score : calculatedScore.overall,
          };
        }
      }

      console.log(`📊 UI: Detection complete: ${detectedViolations.length} violations, score: ${calculatedScore.overall}`);
      
      // Log violations for debugging
      if (detectedViolations.length > 0) {
        console.log('⚠️ UI: Violations found:');
        detectedViolations.forEach((v, idx) => {
          console.log(`  ${idx + 1}. ${v.category} - ${v.title} (${v.severity})`);
        });
      } else {
        console.log('✅ UI: No violations found - all elements are brand-compliant');
      }

      let displayScore = buildScoreFromViolations(elements.length, detectedViolations, calculatedScore.overall);
      if (detectedViolations.length === 0) {
        displayScore = getPerfectScore();
        calculatedScore = getPerfectScore();
      }

      const canUpdate = shouldAcceptScan(
        elements.length,
        detectedViolations.length,
        displayScore.overall
      );

      if (canUpdate) {
        lastElementsCountRef.current = elements.length;
        lastScoreRef.current = displayScore;
        lastViolationsRef.current = detectedViolations;
        setViolations(detectedViolations);
        setScore(displayScore);
      } else if (lastScoreRef.current) {
        setScore(lastScoreRef.current);
        setViolations(lastViolationsRef.current);
      }
    } catch (error) {
      console.error('❌ UI: Error scanning document:', error);
    } finally {
      setIsScanning(false);
    }
  }, [sandboxProxy, detector]);

  // Start real-time monitoring with polling
  const startRealTimeMonitoring = useCallback(async () => {
    console.log('🟢 UI: Starting real-time monitoring...');
    
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      console.log('🧹 UI: Clearing existing polling interval');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    try {
      const result = await sandboxProxy.startRealTimeMonitoring(2000);
      console.log('📥 UI: Monitoring start result:', result);
      
      if (result.success) {
        setIsRealTimeMonitoring(true);
        console.log('✅ UI: Monitoring is now ON');
        
        // Set up polling to check for document changes
        // Poll more frequently to catch text changes
        let pollCount = 0;
        
        const pollInterval = setInterval(async () => {
          pollCount++;
          try {
            // Check if monitoring is still active
            const status = await sandboxProxy.isMonitoring();
            if (!status.isMonitoring) {
              console.log('⚠️ UI: Monitoring turned off, stopping poll');
              clearInterval(pollInterval);
              pollingIntervalRef.current = null;
              return;
            }
            
            // Always trigger a scan to capture style changes.
            console.log(`🔄 UI: Polling - triggering scan (poll #${pollCount})`);
            await scanDocument(false);
          } catch (error) {
            console.error('❌ UI: Error polling for changes:', error);
          }
        }, 1500); // Poll every 1.5 seconds
        
        // Store interval ID in ref for cleanup
        pollingIntervalRef.current = pollInterval;
        console.log('✅ UI: Polling interval started');
      }
    } catch (error) {
      console.error('❌ UI: Error starting real-time monitoring:', error);
    }
  }, [sandboxProxy, scanDocument, detector]);

  // Stop real-time monitoring
  const stopRealTimeMonitoring = useCallback(async () => {
    try {
      // Clear polling interval
      if (pollingIntervalRef.current) {
        console.log('🧹 UI: Stopping polling interval');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      await sandboxProxy.stopRealTimeMonitoring();
      setIsRealTimeMonitoring(false);
      console.log('✅ UI: Real-time monitoring stopped');
    } catch (error) {
      console.error('Error stopping real-time monitoring:', error);
    }
  }, [sandboxProxy]);

  // Auto-fix violation
  const handleAutoFix = useCallback(async (violationId: string, options?: { rescan?: boolean }) => {
    const violation = violations.find((v) => v.id === violationId);
    if (!violation || !violation.canAutoFix) return;

    try {
      const result = await sandboxProxy.autoFixViolation(violation);
      if (result.success) {
        if (options?.rescan !== false) {
          // Force a fresh scan so typography/color fixes are reflected correctly.
          await scanDocument(true);
        }
      }
    } catch (error) {
      console.error('Error auto-fixing violation:', error);
    }
  }, [violations, sandboxProxy, scanDocument]);

  // Initial scan on mount and set up real-time monitoring
  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 UI: Initializing Smart Brand Kit...');
      
      // Start real-time monitoring first (this will do an initial scan)
      console.log('🟢 UI: Starting real-time monitoring...');
      await startRealTimeMonitoring();
      
      // Also do a forced scan to ensure we have initial results
      console.log('🔄 UI: Performing initial forced scan...');
      await scanDocument(true);
    };
    
    initialize();
    
    return () => {
      console.log('🧹 UI: Cleaning up on unmount...');
      // Clear polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      // Stop monitoring
      stopRealTimeMonitoring();
    };
  }, [startRealTimeMonitoring, scanDocument, stopRealTimeMonitoring]);

  // Update detector when rules change
  useEffect(() => {
    detector.updateRules(brandRules);
  }, [brandRules, detector]);

  const handleRulesUpdate = useCallback(async (updatedRules: BrandRules) => {
    try {
      setBrandRules(updatedRules);
      detector.updateRules(updatedRules);
      await sandboxProxy.updateBrandRules(updatedRules);
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(updatedRules));
      await scanDocument(true);
    } catch (error) {
      console.error('❌ UI: Failed to update brand rules:', error);
    }
  }, [sandboxProxy, detector, scanDocument]);

  return (
    <Theme system="express" scale="medium" color="light">
      <div style={{ width: '100%', height: '100%', display: 'flex' }}>
        <BrandKitSidePanel
          violations={violations}
          score={score}
          isScanning={isScanning}
          brandRules={brandRules}
          onScan={(force?: boolean) => scanDocument(force || false)}
          onAutoFix={handleAutoFix}
          onRulesUpdate={handleRulesUpdate}
          isRealTimeMonitoring={isRealTimeMonitoring}
          onToggleRealTimeMonitoring={isRealTimeMonitoring ? stopRealTimeMonitoring : startRealTimeMonitoring}
        />
      </div>
    </Theme>
  );
};
