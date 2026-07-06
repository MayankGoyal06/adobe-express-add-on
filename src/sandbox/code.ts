import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor, constants, EditorEvent, fonts } from "express-document-sdk";

const { runtime } = addOnSandboxSdk.instance;

// Brand Rules Configuration
// These rules define what is considered brand-compliant
const brandRules = {
    colors: [
        {
            id: 'primary-1',
            name: 'Primary Blue',
            hex: '#0066CC',
            rgb: { r: 0, g: 0.4, b: 0.8 },
            usage: 'primary',
        },
        {
            id: 'primary-2',
            name: 'Primary Dark',
            hex: '#003366',
            rgb: { r: 0, g: 0.2, b: 0.4 },
            usage: 'primary',
        },
        {
            id: 'secondary-1',
            name: 'Secondary Teal',
            hex: '#00CCCC',
            rgb: { r: 0, g: 0.8, b: 0.8 },
            usage: 'secondary',
        },
        {
            id: 'accent-1',
            name: 'Accent Orange',
            hex: '#FF6600',
            rgb: { r: 1, g: 0.4, b: 0 },
            usage: 'accent',
        },
        {
            id: 'neutral-1',
            name: 'Neutral Gray',
            hex: '#666666',
            rgb: { r: 0.4, g: 0.4, b: 0.4 },
            usage: 'neutral',
        },
        {
            id: 'neutral-2',
            name: 'Light Gray',
            hex: '#F5F5F5',
            rgb: { r: 0.96, g: 0.96, b: 0.96 },
            usage: 'neutral',
        },
    ],
    fonts: [
        {
            id: 'font-1',
            name: 'Heading Font',
            family: 'Arial',
            postscriptName: 'Arial-BoldMT',
            usage: 'heading',
            weight: '700',
            minSize: 24,
            maxSize: 72,
            allowedWeights: [700, 600],
        },
        {
            id: 'font-2',
            name: 'Body Font',
            family: 'Arial',
            postscriptName: 'ArialMT',
            usage: 'body',
            weight: '400',
            minSize: 12,
            maxSize: 18,
            allowedWeights: [400, 500],
        },
        {
            id: 'font-3',
            name: 'Caption Font',
            family: 'Arial',
            postscriptName: 'ArialMT',
            usage: 'caption',
            weight: '400',
            minSize: 10,
            maxSize: 14,
            allowedWeights: [400],
        },
    ],
    logos: [
        {
            id: 'logo-1',
            name: 'Company Logo',
            minSize: 50,
            clearSpace: 20,
            allowedBackgrounds: ['#FFFFFF', '#F5F5F5'],
            prohibitedBackgrounds: ['#000000', '#333333'],
            minContrastRatio: 3.0,
        },
    ],
    spacing: {
        minMargin: 20,
        gridSize: 8,
        minElementSpacing: 8,
        maxElementSpacing: 100,
    },
    accessibility: {
        minContrastRatio: 4.5, // WCAG AA standard
        minFontSize: 12,
        maxTextWidth: 600,
        requireAltText: true,
    },
};

function evaluateCompliance(elements: any[]) {
    const violations: any[] = [];

    // ---------- COLOR CHECK ----------
    elements.forEach(el => {
        // Only enforce color rules for elements that SHOULD have color
        const requiresColor =
            el.type === "text" || el.type === "shape";

        if (!requiresColor) return;

        if (!el.color || typeof el.color.r !== "number") {
            violations.push({
                type: "COLOR",
                severity: "major",
                elementId: el.id,
                reason: "Color not detectable",
            });
            return;
        }

        const isBrandColor = brandRules.colors.some(c =>
            Math.abs(c.rgb.r - el.color.r) < 0.05 &&
            Math.abs(c.rgb.g - el.color.g) < 0.05 &&
            Math.abs(c.rgb.b - el.color.b) < 0.05
        );

        if (!isBrandColor) {
            violations.push({
                type: "COLOR",
                severity: "major",
                elementId: el.id,
                reason: "Non-brand color",
            });
        }
    });

    // ---------- FONT CHECK ----------
    elements
        .filter(e => e.type === "text")
        .forEach(el => {
            if (!el.font || typeof el.font.size !== "number") {
                violations.push({
                    type: "FONT",
                    severity: "major",
                    elementId: el.id,
                    reason: "Font metadata unavailable",
                });
                return;
            }

            const normalizeFontKey = (value: string | undefined) =>
                String(value || "")
                    .toLowerCase()
                    .replace(/\s+/g, "");
            const fontKey = normalizeFontKey(el.font.family);
            const fontWeight = typeof el.font.weight === "number" ? el.font.weight : null;

            const allowed = brandRules.fonts.some(f => {
                const familyKey = normalizeFontKey(f.family);
                const postscriptKey = normalizeFontKey((f as any).postscriptName);
                const familyMatches =
                    fontKey === familyKey ||
                    fontKey === postscriptKey ||
                    familyKey === postscriptKey;

                const sizeOk =
                    (!f.minSize || el.font.size >= f.minSize) &&
                    (!f.maxSize || el.font.size <= f.maxSize);

                const weightOk =
                    !Array.isArray(f.allowedWeights) ||
                    f.allowedWeights.length === 0 ||
                    fontWeight === null ||
                    f.allowedWeights.includes(fontWeight);

                return familyMatches && sizeOk && weightOk;
            });

            if (!allowed) {
                violations.push({
                    type: "FONT",
                    severity: "major",
                    elementId: el.id,
                    reason: "Font not compliant with brand rules",
                });
            }
        });

    // ---------- SCORE ----------
    let score = 100;
    violations.forEach(v => {
        if (v.severity === "critical") score -= 10;
        if (v.severity === "major") score -= 5;
    });

    score = Math.max(0, score);

    return {
        score,
        violations,
        violationCount: violations.length,
    };
}


// Store scan state
let isMonitoring = false;
let isScanning = false;
let lastScanResult: { elements: any[]; compliance?: any; timestamp: number } | null = null;
let scanCallbacks: Array<(result: { elements: any[]; compliance?: any; timestamp: number }) => void> = [];

// Helper function to normalize color channels (0-255 -> 0-1)
function normalizeChannel(value: number | undefined): number {
    if (typeof value !== "number") return 0;
    return value > 1 ? value / 255 : value;
}

// Helper function to extract color from fill
function extractColorFromFill(fill: any): { r: number; g: number; b: number; a: number } | null {
    if (!fill) return null;

    const hasColor = !!fill.color;
    const fillType = fill.type;
    const isColorFill =
        fillType === constants.FillType.color ||
        fillType === "color" ||
        fillType === "solid";

    if (hasColor && isColorFill) {
        return {
            r: normalizeChannel(fill.color.red ?? fill.color.r),
            g: normalizeChannel(fill.color.green ?? fill.color.g),
            b: normalizeChannel(fill.color.blue ?? fill.color.b),
            a: fill.color.alpha ?? fill.color.a ?? 1,
        };
    }

    // Fallback: some APIs return a color object without a type
    if (hasColor) {
        return {
            r: normalizeChannel(fill.color.red ?? fill.color.r),
            g: normalizeChannel(fill.color.green ?? fill.color.g),
            b: normalizeChannel(fill.color.blue ?? fill.color.b),
            a: fill.color.alpha ?? fill.color.a ?? 1,
        };
    }

    return null;
}

// Helper to retrieve a fill from a node (supports fill or fills[])
function getNodeFill(node: any): any | null {
    if (!node) return null;
    if (node.fill) return node.fill;
    if (Array.isArray(node.fills) && node.fills.length > 0) return node.fills[0];
    return null;
}

// Helper function to extract text color from text node
function extractTextColor(node: any): { r: number; g: number; b: number; a: number } | null {
    try {
        const ranges = node.textStyleRanges || node.fullContent?.characterStyleRanges;
        if (!ranges || ranges.length === 0) return null;

        const style = ranges[0];
        if (style.color) {
            return {
                r: normalizeChannel(style.color.red ?? style.color.r),
                g: normalizeChannel(style.color.green ?? style.color.g),
                b: normalizeChannel(style.color.blue ?? style.color.b),
                a: style.color.alpha ?? style.color.a ?? 1,
            };
        }

        if (style.fill) {
            return extractColorFromFill(style.fill);
        }

        const nodeFill = getNodeFill(node);
        if (nodeFill) {
            return extractColorFromFill(nodeFill);
        }
        if (node?.style?.color) {
            const c = node.style.color;
            return {
                r: normalizeChannel(c.red ?? c.r),
                g: normalizeChannel(c.green ?? c.g),
                b: normalizeChannel(c.blue ?? c.b),
                a: c.alpha ?? c.a ?? 1,
            };
        }
    } catch {
        return null;
    }
}

function extractTextColors(node: any): Array<{ r: number; g: number; b: number; a: number }> {
    const ranges =
        node.textStyleRanges ||
        node.fullContent?.characterStyleRanges ||
        node.fullContent?.styleRanges ||
        [];
    if (ranges && ranges.length > 0) {
        return ranges
            .map((range: any) => {
                if (range.color) {
                    return {
                        r: normalizeChannel(range.color.red ?? range.color.r),
                        g: normalizeChannel(range.color.green ?? range.color.g),
                        b: normalizeChannel(range.color.blue ?? range.color.b),
                        a: range.color.alpha ?? range.color.a ?? 1,
                    };
                }
                if (range.fill) {
                    return extractColorFromFill(range.fill);
                }
                return null;
            })
            .filter(Boolean);
    }

    const fallbacks = [
        node?.style?.color,
        node?.style?.fill?.color,
        node?.textColor,
        node?.color,
    ].filter(Boolean);

    for (const c of fallbacks) {
        const color = {
            r: normalizeChannel(c.red ?? c.r),
            g: normalizeChannel(c.green ?? c.g),
            b: normalizeChannel(c.blue ?? c.b),
            a: c.alpha ?? c.a ?? 1,
        };
        return [color];
    }

    const nodeFill = getNodeFill(node);
    if (nodeFill) {
        const extracted = extractColorFromFill(nodeFill);
        if (extracted) return [extracted];
    }

    return [];
}


// Helper function to extract font info from text node
function extractFontFromText(
    textNode: any
): { family: string; size: number; weight: number } | null {
    if (!textNode) {
        console.log("⚠️ extractFontFromText: No textNode");
        return null;
    }

    const buildFontInfo = (range: any, source: string) => {
        const family =
            range?.fontFamily ||
            range?.font?.family ||
            range?.font?.postscriptName;
        const size = range?.fontSize ?? range?.font?.size ?? range?.size;
        if (family && typeof size === "number") {
            const fontInfo = {
                family,
                size,
                weight: range?.fontWeight ?? range?.font?.weight ?? 400,
            };
            console.log(`✅ Font from ${source}:`, fontInfo);
            return fontInfo;
        }
        return null;
    };

    // ✅ PRIMARY SOURCE: fullContent.characterStyleRanges
    // applyCharacterStyles updates these during auto-fix.
    if (textNode.fullContent?.characterStyleRanges && textNode.fullContent.characterStyleRanges.length > 0) {
        const range = textNode.fullContent.characterStyleRanges[0];
        const info = buildFontInfo(range, "characterStyleRanges");
        if (info) return info;
    }

    // ✅ SECONDARY SOURCE: textStyleRanges
    if (textNode.textStyleRanges && textNode.textStyleRanges.length > 0) {
        const range = textNode.textStyleRanges[0];
        const info = buildFontInfo(range, "textStyleRanges");
        if (info) return info;
    }

    // ⚠️ OPTIONAL fallback (only if explicitly present)
    if (textNode.fontFamily && textNode.fontSize) {
        const fontInfo = {
            family: textNode.fontFamily,
            size: textNode.fontSize,
            weight: textNode.fontWeight ?? 400,
        };

        console.log("⚠️ Font from direct properties:", fontInfo);
        return fontInfo;
    }

    // ❌ DO NOT GUESS FONT
    console.log("❌ Font metadata unavailable");
    return null;
}


// Recursively scan all nodes in the document
function scanNode(node: any, elements: any[]): void {
    if (!node) return;

    try {
        const nodeType = node.type;
        const nodeTypeStr = String(nodeType).toLowerCase();

        const bounds = getNodeBounds(node);

        const element: any = {
            id: node.id || `element-${Date.now()}-${Math.random()}`,
            type: "other",
            bounds,
        };

        if (
            nodeType === constants.SceneNodeType.text ||
            nodeTypeStr.includes("text")
        ) {
            element.type = "text";
            element.font = extractFontFromText(node);
            element.color = extractTextColor(node);
            const textColors = extractTextColors(node);
            if (textColors.length > 0) {
                element.metadata = { ...(element.metadata || {}), textColors };
            }
        }
        else if (
            nodeType === constants.SceneNodeType.rectangle ||
            nodeType === constants.SceneNodeType.ellipse ||
            nodeType === constants.SceneNodeType.path ||
            nodeTypeStr.includes("shape") ||
            nodeTypeStr.includes("rect") ||
            nodeTypeStr.includes("rectangle") ||
            nodeTypeStr.includes("ellipse") ||
            nodeTypeStr.includes("path") ||
            nodeTypeStr.includes("polygon") ||
            nodeTypeStr.includes("line")
        ) {
            element.type = "shape";
            const shapeFill = getNodeFill(node);
            if (shapeFill) {
                element.color = extractColorFromFill(shapeFill);
            }
        }
        else if (
            nodeType === constants.SceneNodeType.imageRectangle ||
            nodeType === constants.SceneNodeType.unknownMediaRectangle ||
            nodeTypeStr.includes("image") ||
            nodeTypeStr.includes("media")
        ) {
            element.type = "image";
            const imageFill = getNodeFill(node);
            if (imageFill) {
                const extracted = extractColorFromFill(imageFill);
                if (extracted) {
                    element.color = extracted;
                } else {
                    element.metadata = { ...(element.metadata || {}), colorUnknown: true };
                }
            } else {
                element.metadata = { ...(element.metadata || {}), colorUnknown: true };
            }
        }

        elements.push(element);

        if (node.children) {
            for (const child of node.children) {
                scanNode(child, elements);
            }
        }
    } catch (e) {
        console.error("scanNode error", e);
    }
}


// Scan the entire document
function scanDocument(): any[] {
    const elements: any[] = [];
    
    try {
        const documentRoot = editor.documentRoot;
        if (!documentRoot) {
            console.log('⚠️ No document root found');
            return elements;
        }
        
        console.log('🔍 Starting document scan...');
        
        // Scan all pages
        if (documentRoot.pages) {
            const pageCount = documentRoot.pages.length;
            console.log(`📄 Found ${pageCount} page(s)`);
            
            for (const page of documentRoot.pages) {
                // Scan all artboards in the page
                if (page.artboards) {
                    const artboardCount = page.artboards.length;
                    console.log(`🎨 Found ${artboardCount} artboard(s) on page`);
                    
                    for (const artboard of page.artboards) {
                        // Scan all children of the artboard
                        if (artboard.children) {
                            const childCount = artboard.children.length;
                            console.log(`  📦 Artboard has ${childCount} child element(s)`);
                            
                            for (const child of artboard.children) {
                                scanNode(child, elements);
                            }
                        } else {
                            console.log('  📦 Artboard has no children');
                        }
                    }
                }
            }
        } else {
            console.log('⚠️ Document has no pages');
        }
        
        console.log(`✅ Scan complete: Found ${elements.length} total element(s)`);
        console.log(`   - Text: ${elements.filter(e => e.type === 'text').length}`);
        console.log(`   - Shapes: ${elements.filter(e => e.type === 'shape').length}`);
        console.log(`   - Images: ${elements.filter(e => e.type === 'image').length}`);
        console.log(`   - Groups: ${elements.filter(e => e.type === 'group').length}`);
        console.log(`   - Other: ${elements.filter(e => e.type === 'other').length}`);
    } catch (error) {
        console.error('❌ Error scanning document:', error);
    }
    
    return elements;
}

function getNodeBounds(node: any): { x: number; y: number; width: number; height: number } {
    if (!node) return { x: 0, y: 0, width: 0, height: 0 };

    // Prefer global bounds when available
    if (node.globalBounds) {
        return node.globalBounds;
    }

    // Fall back to local bounds + translation to approximate global position
    const bounds = node.bounds ?? { x: 0, y: 0, width: 0, height: 0 };
    const translation = node.translation ?? { x: 0, y: 0 };

    return {
        x: (bounds.x || 0) + (translation.x || 0),
        y: (bounds.y || 0) + (translation.y || 0),
        width: bounds.width || 0,
        height: bounds.height || 0,
    };
}

// Traverse document nodes and call visitor
function traverseNodes(node: any, visitor: (n: any) => void): void {
    if (!node) return;
    visitor(node);
    if (node.children) {
        for (const child of node.children) {
            traverseNodes(child, visitor);
        }
    }
}

// Find a node by its id in the current document
function findNodeById(nodeId: string): any | null {
    const documentRoot = editor.documentRoot;
    if (!documentRoot || !documentRoot.pages) return null;

    let found: any | null = null;
    for (const page of documentRoot.pages) {
        if (!page.artboards) continue;
        for (const artboard of page.artboards) {
            if (!artboard.children) continue;
            for (const child of artboard.children) {
                traverseNodes(child, (node) => {
                    if (node?.id === nodeId) {
                        found = node;
                    }
                });
                if (found) return found;
            }
        }
    }
    return null;
}

function getContainingArtboardBounds(node: any): { x: number; y: number; width: number; height: number } | null {
    const nodeBounds = getNodeBounds(node);
    const documentRoot = editor.documentRoot;
    if (!documentRoot || !documentRoot.pages) return null;

    for (const page of documentRoot.pages) {
        if (!page.artboards) continue;
        for (const artboard of page.artboards) {
            const artboardBounds = getNodeBounds(artboard);
            const withinX =
                nodeBounds.x >= artboardBounds.x &&
                nodeBounds.x <= artboardBounds.x + artboardBounds.width;
            const withinY =
                nodeBounds.y >= artboardBounds.y &&
                nodeBounds.y <= artboardBounds.y + artboardBounds.height;
            if (withinX && withinY) {
                return artboardBounds;
            }
        }
    }
    return null;
}

async function applyColorToNode(node: any, rgb: { r: number; g: number; b: number }) {
    const color = { red: rgb.r, green: rgb.g, blue: rgb.b, alpha: 1 };
    const nodeTypeStr = String(node.type).toLowerCase();
    
    console.log(`🎨 Applying color: rgb(${rgb.r}, ${rgb.g}, ${rgb.b}) to ${nodeTypeStr} node`);
    
    await editor.queueAsyncEdit(() => {
        try {
            if (nodeTypeStr.includes("text") && node.fullContent) {
                const length = getTextLength(node);
                if (!length) return;
        node.fullContent.applyCharacterStyles(
            { color },
                    { start: 0, length }
        );
                console.log(`✅ Applied color to text successfully`);
        return;
    }
    const fill = editor.makeColorFill(color);
    if (node.fill !== undefined) {
        node.fill = fill;
                console.log(`✅ Applied color to shape fill successfully`);
        return;
    }
    if (Array.isArray(node.fills)) {
        node.fills = [fill];
                console.log(`✅ Applied color to shape fills array successfully`);
            }
        } catch (e) {
            console.error(`❌ Failed to apply color:`, e);
        }
    });
}

function getTextFontSize(node: any): number | null {
    const ranges = node?.textStyleRanges || node?.fullContent?.characterStyleRanges;
    if (Array.isArray(ranges) && ranges.length > 0 && typeof ranges[0]?.fontSize === "number") {
        return ranges[0].fontSize;
    }
    if (typeof node?.fontSize === "number") {
        return node.fontSize;
    }
    return null;
}

function getTextLength(node: any): number {
    if (typeof node?.fullContent?.text === "string") {
        return node.fullContent.text.length;
    }
    if (typeof node?.text === "string") {
        return node.text.length;
    }
    return 0;
}

function pickBrandColor(
    usageOrder: Array<'primary' | 'secondary' | 'accent' | 'neutral'>,
    fallbackIndex: number = 0
): { r: number; g: number; b: number } | null {
    for (const usage of usageOrder) {
        const match = brandRules.colors.find((c: any) => c.usage === usage);
        if (match?.rgb) return match.rgb;
    }
    return brandRules.colors[fallbackIndex]?.rgb || null;
}

function pickAutoFixColorForNode(node: any): { r: number; g: number; b: number } | null {
    const nodeTypeStr = String(node?.type || '').toLowerCase();
    const isText = nodeTypeStr.includes("text");
    // Prefer different palettes for text vs shapes to avoid matching colors.
    if (isText) {
        return pickBrandColor(['primary', 'accent', 'secondary', 'neutral']);
    }
    return pickBrandColor(['secondary', 'accent', 'primary', 'neutral'], 1);
}

function findAvailableFontByFamily(family: string): any | null {
    const target = String(family).toLowerCase();
    const documentRoot = editor.documentRoot;
    if (!documentRoot?.pages) return null;

    let found: any | null = null;
    for (const page of documentRoot.pages) {
        if (!page.artboards) continue;
        for (const artboard of page.artboards) {
            if (!artboard.children) continue;
            for (const child of artboard.children) {
                traverseNodes(child, (node) => {
                    if (found) return;
                    const nodeTypeStr = String(node?.type).toLowerCase();
                    if (!nodeTypeStr.includes("text")) return;
                    const ranges = node?.fullContent?.characterStyleRanges;
                    if (!Array.isArray(ranges) || ranges.length === 0) return;
                    const font = ranges[0]?.font;
                    if (font?.family && String(font.family).toLowerCase() === target) {
                        found = font;
                    }
                });
                if (found) return found;
            }
        }
    }
    return found;
}

function findAvailableFontByPostscript(postscriptName: string): any | null {
    const target = String(postscriptName).toLowerCase();
    const documentRoot = editor.documentRoot;
    if (!documentRoot?.pages) return null;

    let found: any | null = null;
    for (const page of documentRoot.pages) {
        if (!page.artboards) continue;
        for (const artboard of page.artboards) {
            if (!artboard.children) continue;
            for (const child of artboard.children) {
                traverseNodes(child, (node) => {
                    if (found) return;
                    const nodeTypeStr = String(node?.type).toLowerCase();
                    if (!nodeTypeStr.includes("text")) return;
                    const ranges = node?.fullContent?.characterStyleRanges;
                    if (!Array.isArray(ranges) || ranges.length === 0) return;
                    const font = ranges[0]?.font;
                    if (font?.postscriptName && String(font.postscriptName).toLowerCase() === target) {
                        found = font;
                    }
                });
                if (found) return found;
            }
        }
    }
    return found;
}

function deriveRegularPostscriptName(postscriptName: string): string | null {
    const name = String(postscriptName);
    const candidates = new Set<string>();
    candidates.add(name.replace(/-?BoldMT$/i, "MT"));
    candidates.add(name.replace(/-?Bold$/i, ""));
    candidates.add(name.replace(/Bold/i, ""));
    candidates.add(name.replace(/-?Bd$/i, ""));
    candidates.add(name.replace(/-?BoldItalic$/i, "Italic"));
    candidates.add(name.replace(/-?BoldOblique$/i, "Oblique"));
    for (const candidate of candidates) {
        if (candidate && candidate !== name) {
            return candidate;
        }
    }
    return null;
}

function buildFontRuleForWeight(
    rule: { family?: string; postscriptName?: string } | null,
    desiredWeight: number
): { family?: string; postscriptName?: string } | null {
    if (!rule) return null;
    if (desiredWeight === 400 && rule.postscriptName) {
        const regular = deriveRegularPostscriptName(rule.postscriptName);
        if (regular) {
            return { ...rule, postscriptName: regular };
        }
    }
    return rule;
}

async function resolveFontFromRule(
    rule: { family?: string; postscriptName?: string } | null,
    fallbackRules: Array<{ family?: string; postscriptName?: string }> = []
): Promise<any | null> {
    if (rule?.postscriptName) {
        const direct = await fonts.fromPostscriptName(rule.postscriptName);
        if (direct) return direct;
    }
    if (rule?.family) {
        const direct = await fonts.fromPostscriptName(rule.family);
        if (direct) return direct;
    }
    if (rule?.family) {
        const found = findAvailableFontByFamily(rule.family);
        if (found) return found;
    }
    if (rule?.postscriptName) {
        const found = findAvailableFontByPostscript(rule.postscriptName);
        if (found) return found;
    }

    for (const fallback of fallbackRules) {
        if (fallback?.postscriptName) {
            const direct = await fonts.fromPostscriptName(fallback.postscriptName);
            if (direct) return direct;
        }
        if (fallback?.family) {
            const direct = await fonts.fromPostscriptName(fallback.family);
            if (direct) return direct;
        }
        if (fallback?.family) {
            const found = findAvailableFontByFamily(fallback.family);
            if (found) return found;
        }
        if (fallback?.postscriptName) {
            const found = findAvailableFontByPostscript(fallback.postscriptName);
            if (found) return found;
        }
    }

    return null;
}

async function applyTypographyToNode(
    node: any,
    fontRule: { family?: string; postscriptName?: string } | null,
    fontSize: number | null,
    fallbackRules: Array<{ family?: string; postscriptName?: string }> = [],
    resolvedFont?: any
) {
    const nodeTypeStr = String(node.type).toLowerCase();
    if (!nodeTypeStr.includes("text") || !node.fullContent) return;
    const length = getTextLength(node);
    if (!length) return;
    const range = { start: 0, length };
    const styles: any = {};
    if (typeof fontSize === "number") {
        styles.fontSize = fontSize;
    }

    const font = resolvedFont || (await resolveFontFromRule(fontRule, fallbackRules));
    
    console.log(`🔧 Typography fix: font=${font?.family || font?.postscriptName || 'none'}, size=${fontSize}`);
    
    if (font) {
        styles.font = font;
    }
    
    if (Object.keys(styles).length > 0) {
        await editor.queueAsyncEdit(() => {
            node.fullContent.applyCharacterStyles(styles, range);
            console.log(`✅ Applied typography styles successfully`);
        });
    } else {
        console.warn(`⚠️ No typography styles to apply`);
    }
}

function applyMarginFix(node: any, minMargin: number) {
    const bounds = getNodeBounds(node);
    const translation = node.translation || { x: bounds.x || 0, y: bounds.y || 0 };
    const artboardBounds = getContainingArtboardBounds(node);
    const originX = artboardBounds ? artboardBounds.x : 0;
    const originY = artboardBounds ? artboardBounds.y : 0;
    let dx = 0;
    let dy = 0;
    if (bounds.x < originX + minMargin) dx = originX + minMargin - bounds.x;
    if (bounds.y < originY + minMargin) dy = originY + minMargin - bounds.y;
    if (dx !== 0 || dy !== 0) {
        editor.queueAsyncEdit(() => {
        node.translation = { x: translation.x + dx, y: translation.y + dy };
        });
    }
}

function start() {
    runtime.exposeApi({
        // Scan document for brand compliance
        // force: if true, forces a new scan even if one is in progress
        scanDocument: (force: boolean = false) => {
            console.log(`🔍 scanDocument called (force: ${force}, isScanning: ${isScanning})`);
            
            if (isScanning && !force) {
                console.log('⏳ Scan already in progress, returning last result');
                // Return last result if scan is in progress
                if (lastScanResult) {
                    return { 
                        elements: lastScanResult.elements, 
                        compliance: lastScanResult.compliance, 
                        timestamp: lastScanResult.timestamp, 
                        error: null 
                    };
                }
                return { elements: [], compliance: null, timestamp: Date.now(), error: 'Scan already in progress' };
            }
            
            // If forcing, reset scanning state
            if (force) {
                isScanning = false;
            }
            
            isScanning = true;
            try {
                console.log('🚀 Starting FORCED scan...');
                const elements = scanDocument();
                const compliance = evaluateCompliance(elements);
                const timestamp = Date.now();
                lastScanResult = { elements, compliance, timestamp };
                isScanning = false;
                
                console.log(`📤 Emitting scan results: ${elements.length} elements, ${compliance.violationCount} violations, score: ${compliance.score}`);
                console.log(`   ${scanCallbacks.length} callback(s) registered`);
                
                // Notify callbacks
                scanCallbacks.forEach((callback, index) => {
                    try {
                        console.log(`  📢 Calling callback ${index + 1}/${scanCallbacks.length}`);
                        callback({ elements, compliance, timestamp });
                    } catch (error) {
                        console.error(`  ❌ Error in callback ${index + 1}:`, error);
                    }
                });
                
                console.log('✅ Scan results emitted successfully');
                return { elements, compliance, timestamp, error: null };
            } catch (error: any) {
                isScanning = false;
                console.error('❌ Scan failed:', error);
                return { elements: [], compliance: null, timestamp: Date.now(), error: error.message || 'Scan failed' };
            }
        },
        
        // Start real-time monitoring
        // Sets up event listeners to automatically scan when document changes
        startRealTimeMonitoring: () => {
            console.log("🟢 STARTING real-time monitoring...");
        
            // Turn monitoring ON
            isMonitoring = true;
        
            // Capture initial state
            previousSelectionState = getSelectionSnapshot();
            console.log(`📊 Initial selection count: ${previousSelectionState.count}`);
        
            // Run an initial scan immediately
            performScanAndNotify();
        
            // Set up Adobe-supported listeners (selection, text edits, property changes)
            setupDocumentChangeListeners();
        
            console.log("✅ Real-time monitoring active (event-driven)");
            console.log("⚠️ Timers are intentionally NOT used (sandbox restriction)");
        
            return {
                success: true,
                isMonitoring: true,
            };
        },
        
        
        // Stop real-time monitoring
        stopRealTimeMonitoring: () => {
            isMonitoring = false;
            cleanupDocumentChangeListeners();
            return { success: true };
        },
        
        // Check if monitoring is active
        isMonitoring: () => {
            console.log(`🔍 Monitoring status check: ${isMonitoring ? 'ON' : 'OFF'}`);
            return { isMonitoring };
        },
        
        // Get last scan result (for UI polling)
        getLastScanResult: () => {
            return lastScanResult || { elements: [], compliance: null, timestamp: 0 };
        },
        
        // Register a callback for scan results
        onScanResult: (callback: (result: { elements: any[]; compliance?: any; timestamp: number }) => void) => {
            scanCallbacks.push(callback);
            // Immediately return last result if available
            if (lastScanResult) {
                try {
                    callback(lastScanResult);
                } catch (error) {
                    console.error('Error in immediate callback:', error);
                }
            }
            return { success: true };
        },
        
        // Get brand rules
        getBrandRules: () => {
            return brandRules;
        },
        
        // Update brand rules (for admin configuration)
        updateBrandRules: (newRules: any) => {
            try {
                // Validate and merge new rules
                if (newRules.colors) {
                    brandRules.colors = newRules.colors;
                }
                if (newRules.fonts) {
                    brandRules.fonts = newRules.fonts;
                }
                if (newRules.logos) {
                    brandRules.logos = newRules.logos;
                }
                if (newRules.spacing) {
                    brandRules.spacing = { ...brandRules.spacing, ...newRules.spacing };
                }
                if (newRules.accessibility) {
                    brandRules.accessibility = { ...brandRules.accessibility, ...newRules.accessibility };
                }
                
                // Trigger a new scan with updated rules
                if (isMonitoring) {
                    performScanAndNotify();
                }
                
                return { success: true, message: 'Brand rules updated' };
            } catch (error: any) {
                return { success: false, error: error.message || 'Failed to update brand rules' };
            }
        },
        
        // Auto-fix a violation by modifying the document element
        autoFixViolation: async (violation: any) => {
            try {
                if (!violation || !violation.elementId) {
                    return { success: false, error: 'Missing elementId for auto-fix' };
                }

                const node = findNodeById(violation.elementId);
                if (!node) {
                    return { success: false, error: 'Target element not found' };
                }

                if (violation.category === 'color') {
                    const rgb = pickAutoFixColorForNode(node) || brandRules.colors[0]?.rgb;
                    if (!rgb) {
                        return { success: false, error: 'No brand color available for fix' };
                    }
                    await applyColorToNode(node, rgb);
                } else if (violation.category === 'typography') {
                    const brandFonts = brandRules.fonts || [];
                    if (brandFonts.length === 0) {
                        return { success: false, error: 'No brand fonts available for fix' };
                    }

                    const detectedFont = extractFontFromText(node);
                    const detectedFamily = detectedFont?.family || null;
                    const normalizeFontKey = (value?: string) =>
                        String(value || "")
                            .toLowerCase()
                            .replace(/\s+/g, "");
                    const detectedKey = normalizeFontKey(detectedFamily);

                    const matchedRule =
                        (detectedFamily &&
                            brandFonts.find((f: any) => {
                                const familyKey = normalizeFontKey(f.family);
                                const postscriptKey = normalizeFontKey(f.postscriptName);
                                return (
                                    detectedKey === familyKey ||
                                    detectedKey === postscriptKey ||
                                    familyKey === postscriptKey
                                );
                            })) ||
                        null;
                    const fontRule = matchedRule || brandFonts[0];
                    const weightOk =
                        !fontRule?.allowedWeights ||
                        fontRule.allowedWeights.length === 0 ||
                        (typeof detectedFont?.weight === 'number' &&
                            fontRule.allowedWeights.includes(detectedFont.weight));

                    const currentSize = detectedFont?.size ?? getTextFontSize(node);
                    let targetSize: number | null = null;
                    if (typeof currentSize === "number") {
                        if (fontRule?.minSize && currentSize < fontRule.minSize) {
                            targetSize = fontRule.minSize;
                        } else if (fontRule?.maxSize && currentSize > fontRule.maxSize) {
                            targetSize = fontRule.maxSize;
                        } else {
                            targetSize = currentSize;
                        }
                    } else {
                        targetSize = fontRule?.minSize ?? 12;
                    }

                    const parsedWeight = Number(fontRule?.weight);
                    const desiredWeight = Number.isFinite(parsedWeight) ? parsedWeight : null;
                    const shouldEnforceWeight =
                        desiredWeight !== null &&
                        typeof detectedFont?.weight === 'number' &&
                        detectedFont.weight !== desiredWeight;

                    const fontRuleToApply = fontRule || brandFonts[0];
                    const weightedRule = desiredWeight
                        ? buildFontRuleForWeight(fontRuleToApply, desiredWeight)
                        : fontRuleToApply;
                    const resolvedFont = await resolveFontFromRule(weightedRule, brandFonts);
                    if (!resolvedFont) {
                        return { success: false, error: 'No available brand font for auto-fix' };
                    }
                    await applyTypographyToNode(node, weightedRule, targetSize, brandFonts, resolvedFont);
                } else if (violation.category === 'spacing') {
                    if (violation.title === 'Insufficient margin') {
                        applyMarginFix(node, brandRules.spacing.minMargin);
                    } else {
                        return { success: false, error: 'Spacing fix not supported for this violation' };
                    }
                } else {
                    return { success: false, error: 'Auto-fix not supported for this violation type' };
                }

                if (isMonitoring) {
                    performScanAndNotify();
                }

                return { success: true, message: 'Fix applied' };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        },
        
        // Legacy shape creation methods (for testing)
        createRectangle: (color: { red: number; green: number; blue: number; alpha: number }) => {
            const rectangle = editor.createRectangle();
            rectangle.width = 240;
            rectangle.height = 180;
            rectangle.translation = { x: 50, y: 50 };
            
            const rectangleFill = editor.makeColorFill(color);
            rectangle.fill = rectangleFill;
            
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(rectangle);
        },
        
        createEllipse: (color: { red: number; green: number; blue: number; alpha: number }) => {
            const ellipse = editor.createEllipse();
            ellipse.rx = 120;
            ellipse.ry = 90;
            ellipse.translation = { x: 150, y: 150 };
            
            const ellipseFill = editor.makeColorFill(color);
            ellipse.fill = ellipseFill;
            
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(ellipse);
        },
        
        createRainbowRect: () => {
            const colors = [
                { red: 1, green: 0, blue: 0, alpha: 0.8 },
                { red: 1, green: 0.5, blue: 0, alpha: 0.8 },
                { red: 1, green: 1, blue: 0, alpha: 0.8 },
                { red: 0, green: 1, blue: 0, alpha: 0.8 },
                { red: 0, green: 0, blue: 1, alpha: 0.8 },
                { red: 0.5, green: 0, blue: 0.5, alpha: 0.8 },
            ];
            
            colors.forEach((color, index) => {
                const rect = editor.createRectangle();
                rect.width = 40;
                rect.height = 200;
                rect.translation = { x: 50 + (index * 50), y: 100 };
                
                const fill = editor.makeColorFill(color);
                rect.fill = fill;
                
                const insertionParent = editor.context.insertionParent;
                insertionParent.children.append(rect);
            });
        },
        
        // Test function: Create text with non-brand color and font to test detection
        createTestViolationText: () => {
            const textNode = editor.createText();
            textNode.text = "Test Text with Violations";
            textNode.translation = { x: 100, y: 100 };
            
            // Use a non-brand color (bright red, not in brand palette)
            const nonBrandColor = { red: 1, green: 0, blue: 0, alpha: 1 };
            
            // Apply color to text using applyCharacterStyles (correct way for text nodes)
            const contentModel = textNode.fullContent;
            contentModel.applyCharacterStyles(
                { color: nonBrandColor },
                { start: 0, length: textNode.text.length }
            );
            
            // Try to set a non-brand font if possible
            // Note: Font setting might be limited by SDK
            
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(textNode);
            
            console.log('🧪 Created test text with non-brand color (red)');
            
            // Trigger a scan if monitoring is active
            // Note: setTimeout is not available in sandbox, so we trigger immediately
            // The UI polling will catch the change
            if (isMonitoring) {
                performScanAndNotify();
            }
            
            return { success: true, message: 'Test text created' };
        }
    });
}

// Function to perform scan and notify listeners
function performScanAndNotify(): void {
    if (!isMonitoring || isScanning) return;

    isScanning = true;
    try {
        const elements = scanDocument();
        const compliance = evaluateCompliance(elements);

        lastScanResult = {
            elements,
            compliance,
            timestamp: Date.now(),
        };

        console.log(`📤 Emitting scan results: ${elements.length} elements, ${compliance.violationCount} violations, score: ${compliance.score}`);
        
        // 🔥 SEND COMPLIANCE RESULT to registered callbacks
        scanCallbacks.forEach((callback, index) => {
            try {
                console.log(`  📢 Notifying callback ${index + 1}/${scanCallbacks.length}`);
                callback(lastScanResult!);
            } catch (error) {
                console.error(`  ❌ Error in callback ${index + 1}:`, error);
            }
        });
        
        console.log('✅ Scan and notify complete');
    } catch (error) {
        console.error('❌ Error performing scan:', error);
    } finally {
        isScanning = false;
    }
}

// Store event handler IDs for cleanup
let selectionHandlerId: string | null = null;

// Track previous selection state to detect changes
let previousSelectionState: {
    count: number;
    nodeIds: string[];
    nodeProperties: Map<string, any>;
} = {
    count: 0,
    nodeIds: [],
    nodeProperties: new Map(),
};

// Helper function to get a snapshot of selected elements' properties
function getSelectionSnapshot(): {
    count: number;
    nodeIds: string[];
    nodeProperties: Map<string, any>;
} {
    const selection = editor.context.selection || [];
    const snapshot = {
        count: selection.length,
        nodeIds: [] as string[],
        nodeProperties: new Map<string, any>(),
    };

    selection.forEach((node: any, index: number) => {
        try {
            const nodeId = node.id || `node-${index}`;
            snapshot.nodeIds.push(nodeId);

            const properties: any = {
                bounds: node.bounds
                    ? {
                          x: node.bounds.x,
                          y: node.bounds.y,
                          width: node.bounds.width,
                          height: node.bounds.height,
                      }
                    : null,
            };

            // ✅ TEXT NODES (FIXED)
            if (
                node.type === constants.SceneNodeType.text ||
                String(node.type).includes("text")
            ) {
                properties.text = node.text || node.textContent || "";
                properties.textLength = properties.text.length;

                if (node.textStyleRanges && node.textStyleRanges.length > 0) {
                    const firstRange = node.textStyleRanges[0];
                    properties.font = {
                        family: firstRange.fontFamily,
                        size: firstRange.fontSize,
                        weight: firstRange.fontWeight,
                    };
                }

                // 🔥 CORRECT: text color from text styles
                properties.color = extractTextColor(node);
            }
            // ✅ SHAPES
            else {
                const nodeFill = getNodeFill(node);
                if (nodeFill) {
                    properties.color = extractColorFromFill(nodeFill);
                }
            }

            snapshot.nodeProperties.set(nodeId, properties);
        } catch (e) {
            console.log(`⚠️ Error capturing properties for node ${index}:`, e);
        }
    });

    return snapshot;
}


// Helper function to detect if selection properties changed
function hasSelectionChanged(current: typeof previousSelectionState): boolean {
    // Check if selection count changed
    if (current.count !== previousSelectionState.count) {
        console.log(`  📊 Selection count changed: ${previousSelectionState.count} → ${current.count}`);
        return true;
    }
    
    // Check if node IDs changed (different elements selected)
    const idsChanged = current.nodeIds.some((id, idx) => id !== previousSelectionState.nodeIds[idx]);
    if (idsChanged) {
        console.log(`  🔄 Different elements selected`);
        return true;
    }
    
    // Check if properties of selected nodes changed
    for (const nodeId of current.nodeIds) {
        const currentProps = current.nodeProperties.get(nodeId);
        const previousProps = previousSelectionState.nodeProperties.get(nodeId);
        
        if (!currentProps || !previousProps) {
            continue;
        }
        
        // Check bounds (resize)
        if (currentProps.bounds && previousProps.bounds) {
            const boundsChanged = 
                currentProps.bounds.x !== previousProps.bounds.x ||
                currentProps.bounds.y !== previousProps.bounds.y ||
                currentProps.bounds.width !== previousProps.bounds.width ||
                currentProps.bounds.height !== previousProps.bounds.height;
            
            if (boundsChanged) {
                console.log(`  📏 Node ${nodeId} resized or moved`);
                return true;
            }
        }
        
        // Check text content (text edit)
        if (currentProps.textLength !== undefined && previousProps.textLength !== undefined) {
            if (currentProps.textLength !== previousProps.textLength) {
                console.log(`  ✏️ Text edited on node ${nodeId}: ${previousProps.textLength} → ${currentProps.textLength} chars`);
                return true;
            }
        }
        
        // Check font (font change)
        if (currentProps.font && previousProps.font) {
            const fontChanged = 
                currentProps.font.family !== previousProps.font.family ||
                currentProps.font.size !== previousProps.font.size ||
                currentProps.font.weight !== previousProps.font.weight;
            
            if (fontChanged) {
                console.log(`  🔤 Font changed on node ${nodeId}`);
                return true;
            }
        }
        
        // Check color (color change)
        if (currentProps.color && previousProps.color) {
            const colorChanged = 
                currentProps.color.r !== previousProps.color.r ||
                currentProps.color.g !== previousProps.color.g ||
                currentProps.color.b !== previousProps.color.b ||
                currentProps.color.a !== previousProps.color.a;
            
            if (colorChanged) {
                console.log(`  🎨 Color changed on node ${nodeId}`);
                return true;
            }
        }
    }
    
    return false;
}

// Set up event listeners for document changes
function setupDocumentChangeListeners(): void {
    try {
        // Listen for selection changes using EditorEvent
        // This fires when:
        // - Text is edited (typing, deleting)
        // - Selection changes (clicking on elements)
        // - Properties change (color, font, size) - often triggers selection change
        if (editor.context && editor.context.on) {
            // Clean up existing handler if any
            if (selectionHandlerId) {
                try {
                    editor.context.off(EditorEvent.selectionChange, selectionHandlerId);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
            
            // Initialize previous selection state
            previousSelectionState = getSelectionSnapshot();
            
            // Register selection change handler
            // This will fire for text edits, color changes, font changes, and resize
            selectionHandlerId = editor.context.on(EditorEvent.selectionChange, () => {
                console.log('🎯 Selection changed event fired!');
                console.log(`   Monitoring: ${isMonitoring ? 'ON' : 'OFF'}`);
                
                if (isMonitoring) {
                    // Get current selection state
                    const currentState = getSelectionSnapshot();
                    
                    // Check if anything actually changed
                    const changed = hasSelectionChanged(currentState);
                    
                    if (changed) {
                        console.log('   ✅ Changes detected, triggering scan...');
                        // Update previous state
                        previousSelectionState = currentState;
                        // Trigger scan
                        performScanAndNotify();
                    } else {
                        console.log('   ℹ️ Selection changed but no property changes detected');
                        // Still update state even if no changes (selection might have changed)
                        previousSelectionState = currentState;
                    }
                } else {
                    console.log('   ⚠️ Monitoring is OFF, ignoring event');
                }
            });
            
            console.log('✅ Real-time monitoring listeners set up');
            console.log(`   Handler ID: ${selectionHandlerId}`);
            console.log(`   Monitoring for: Text edits, Color changes, Font changes, Resize`);
        }
    } catch (error) {
        console.error('Error setting up document change listeners:', error);
    }
}

// Clean up event listeners
function cleanupDocumentChangeListeners(): void {
    if (selectionHandlerId && editor.context && editor.context.off) {
        try {
            editor.context.off(EditorEvent.selectionChange, selectionHandlerId);
            selectionHandlerId = null;
            // Reset selection state tracking
            previousSelectionState = {
                count: 0,
                nodeIds: [],
                nodeProperties: new Map(),
            };
            console.log('✅ Event listeners cleaned up');
        } catch (error) {
            console.error('Error cleaning up listeners:', error);
        }
    }
}

start();




