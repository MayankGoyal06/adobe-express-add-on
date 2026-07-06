// This interface declares all the APIs that the document sandbox runtime ( i.e. code.ts ) exposes to the UI/iframe runtime
// Note: Methods exposed via runtime.apiProxy return Promises
export interface DocumentSandboxApi {
    // Brand compliance scanning
    scanDocument(force?: boolean): Promise<{ elements: any[]; compliance?: any; timestamp?: number; error: string | null }>;
    startRealTimeMonitoring(intervalMs?: number): Promise<{ success: boolean; interval: number }>;
    stopRealTimeMonitoring(): Promise<{ success: boolean }>;
    isMonitoring(): Promise<{ isMonitoring: boolean }>;
    getLastScanResult(): Promise<{ elements: any[]; compliance?: any; timestamp: number }>;
    onScanResult(callback: (result: { elements: any[]; compliance?: any; timestamp: number }) => void): Promise<{ success: boolean }>;
    getBrandRules(): Promise<any>;
    updateBrandRules(newRules: any): Promise<{ success: boolean; error?: string; message?: string }>;
    autoFixViolation(violation: any): Promise<{ success: boolean; error?: string; message?: string }>;
    
    // Legacy shape creation methods (for testing)
    createRectangle(color?: { red: number; green: number; blue: number; alpha: number }): Promise<void>;
    createEllipse(color?: { red: number; green: number; blue: number; alpha: number }): Promise<void>;
    createRainbowRect(): Promise<void>;
    createTestViolationText(): Promise<{ success: boolean; message: string }>;
}
