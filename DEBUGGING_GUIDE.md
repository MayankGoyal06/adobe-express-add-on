# Debugging Guide: Real-Time Monitoring & Score Issues

## Issues Fixed

### 1. ✅ Monitoring Status
- **Fixed**: Added comprehensive logging to track monitoring state
- **Check**: Look for `🟢 STARTING real-time monitoring...` and `✅ Monitoring is now: ON` in console
- **UI Indicator**: Monitoring status now shows 🟢 ON / 🔴 OFF in the side panel

### 2. ✅ Results Emission
- **Fixed**: Added logging throughout scan process
- **Check**: Look for `📤 Emitting scan results: X elements, Y callback(s) registered`
- **Verify**: Console shows element counts and callback notifications

### 3. ✅ UI Listening
- **Fixed**: Improved polling mechanism - polls every 1.5 seconds
- **Check**: Look for `🔄 UI: Polling - triggering scan` messages
- **Verify**: UI processes both event-triggered and polled results

### 4. ✅ Element Collection
- **Fixed**: Enhanced `scanNode()` with detailed logging
- **Check**: Look for `📝 Found text element:` messages with font/color info
- **Verify**: Console shows element counts by type (text, shapes, images, etc.)

### 5. ✅ Force Re-scan
- **Fixed**: Re-scan button now forces new scan with `force: true` parameter
- **Check**: Look for `🔄 UI: Re-scan button clicked - forcing new scan`
- **Verify**: Forced scans bypass "already scanning" check

## How to Debug

### Step 1: Check Console Logs

Open browser DevTools Console and look for:

```
🟢 STARTING real-time monitoring...
✅ Monitoring is now: ON
🔍 Starting document scan...
📄 Found 1 page(s)
🎨 Found 1 artboard(s) on page
📦 Artboard has X child element(s)
📝 Found text element: { font: {...}, color: {...}, text: "..." }
✅ Scan complete: Found X total element(s)
📤 Emitting scan results: X elements, Y callback(s) registered
```

### Step 2: Verify Elements Are Being Collected

Look for these logs:
- `📝 Found text element:` - Text elements are being detected
- `✅ Scan complete: Found X total element(s)` - Elements are being collected
- Element breakdown: Text, Shapes, Images, Groups counts

### Step 3: Verify Violation Detection

Look for these logs:
- `🔍 ViolationDetector: Scanning X elements against brand rules`
- `🎨 Checking color:` - Color compliance checks
- `🔤 Checking font:` - Typography compliance checks
- `⚠️ Color violation` or `⚠️ Typography violation` - Violations found
- `📊 ViolationDetector: Found X total violations`
- `📊 Final score calculation: base=X, penalties=Y, final=Z`

### Step 4: Test with Non-Brand Elements

The sandbox now has a test function. In the console, you can call:
```javascript
// This will create text with a non-brand color (red) to test detection
sandboxProxy.createTestViolationText()
```

## Common Issues & Solutions

### Issue: Score Always 100

**Possible Causes:**
1. No elements being collected → Check `scanNode()` logs
2. Elements don't have color/font properties → Check element extraction
3. Brand rules not matching → Check color/font matching logic
4. Violations not being detected → Check violation detector logs

**Solution:**
- Check console for `📊 ViolationDetector: Found X total violations`
- If 0 violations but score is 100, elements might not have properties
- Verify brand rules are loaded: `📋 UI: Using brand rules: { colors: X, fonts: Y }`

### Issue: Real-Time Not Working

**Possible Causes:**
1. Monitoring not started → Check `isMonitoring` status
2. Event listeners not set up → Check `✅ Real-time monitoring listeners set up`
3. Selection change events not firing → Check `🎯 Selection changed event fired!`
4. UI not polling → Check `🔄 UI: Polling - triggering scan`

**Solution:**
- Verify monitoring toggle is ON (🟢 indicator)
- Check for `🎯 Selection changed event fired!` when typing text
- Verify polling is active: `🔄 UI: Polling - triggering scan (poll #X)`

## Testing Checklist

- [ ] Monitoring starts automatically on load
- [ ] Console shows monitoring is ON
- [ ] Elements are being collected (check element counts)
- [ ] Text elements show font and color info
- [ ] Violations are detected (check violation logs)
- [ ] Score updates when violations found
- [ ] Re-scan button forces new scan
- [ ] Typing text triggers selection change events
- [ ] Polling catches changes every 1.5 seconds

## Expected Console Output

When working correctly, you should see:

```
🚀 UI: Initializing Smart Brand Kit...
🟢 UI: Starting real-time monitoring...
🟢 STARTING real-time monitoring...
✅ Monitoring is now: ON
👂 Setting up document change listeners...
✅ Real-time monitoring listeners set up
🔍 Starting document scan...
📄 Found 1 page(s)
🎨 Found 1 artboard(s) on page
📦 Artboard has 3 child element(s)
📝 Found text element: { font: {family: "Arial", size: 24, weight: 400}, color: {r: 1, g: 0, b: 0, a: 1}, text: "Hello" }
✅ Scan complete: Found 3 total element(s)
📤 Emitting scan results: 3 elements, 1 callback(s) registered
🔍 ViolationDetector: Scanning 3 elements against brand rules
🎨 Checking color: {r: 1, g: 0, b: 0, a: 1} against 6 brand colors
❌ Color check: Non-brand color
⚠️ Color violation on element element-123: Non-brand color detected
📊 ViolationDetector: Found 1 total violations
📊 Final score calculation: base=83.3, penalties=8, final=75.3
📊 UI: Detection complete: 1 violations, score: 75
```

If you see this output, everything is working! If not, check which step is missing.
