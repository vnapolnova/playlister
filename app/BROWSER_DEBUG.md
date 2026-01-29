# Browser Debug Mode

The Playlister renderer can run in a regular browser (Chrome, Edge, Firefox, etc.) for easier debugging with browser DevTools.

## How to Use Browser Debug Mode

### 1. Start the Development Server

```bash
cd app
npm start
```

This will:
- Start the Vite dev server on `http://localhost:5173`
- Launch the Electron app

### 2. Open in Browser

While the dev server is running, open your browser and navigate to:

```
http://localhost:5173
```

You'll see a yellow banner indicating "Browser Debug Mode" with mock API.

## Features in Browser Debug Mode

### ✅ What Works:
- Full UI rendering and styling
- React component state management
- React Router navigation
- All button clicks and form interactions
- **Mock API** - simulates all backend calls
- Browser DevTools (Console, Network, React DevTools, etc.)

### ⚠️ Limitations:
- **Data doesn't persist** - uses in-memory mock storage
- **OAuth flow is simulated** - won't actually connect to YouTube
- **File system operations** - encryption is mocked
- **IPC calls** - replaced with mock implementations

## Debugging Tips

### Opening DevTools

In your browser:
- **Chrome/Edge**: F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
- **Firefox**: F12 or Ctrl+Shift+K (Cmd+Option+K on Mac)

### Useful Console Messages

The app logs detailed information to the console:

```
[Renderer API] Using browser mode - mock API
[Mock API] saveSettings called with: {...}
[Settings] Saving settings...
[Settings] Settings saved successfully
```

### Testing Button Functionality

All buttons work in browser mode:

1. **Save Settings** - Saves to mock storage, shows success message
2. **Connect YouTube** - Simulates OAuth flow, sets mock connection status
3. **Disconnect** - Clears mock connection status
4. **List Playlists** - Returns mock playlist data
5. **Import Playlist** - Returns mock tracks

### React DevTools

Install the [React Developer Tools](https://react.dev/learn/react-developer-tools) browser extension to:
- Inspect component props and state
- View component hierarchy
- Profile performance
- Debug hooks

## Switching Back to Electron

The Electron app window runs simultaneously. Any changes you make in the browser won't affect the Electron app's storage.

To test with real Electron IPC and storage, use the Electron app window instead.

## Development Workflow

**Recommended workflow:**

1. **Initial UI development** → Use browser mode with DevTools
2. **Fix styling/layout issues** → Use browser mode for fast iteration
3. **Test component logic** → Use browser mode with mock data
4. **Test IPC integration** → Switch to Electron app
5. **Test OAuth/encryption** → Use Electron app with real credentials

## Environment Detection

The app automatically detects if it's running in Electron or a browser:

```typescript
// In browser: window.api is undefined
// In Electron: window.api is provided by preload script

const isBrowserMode = !window.api;
```

When `window.api` is not available, the app automatically uses the mock API from `src/renderer/api.mock.ts`.

## Troubleshooting

### Port Already in Use

If port 5173 is already taken, Vite will automatically try the next available port (5174, 5175, etc.). Check the terminal output for the actual URL.

### Mock API Not Working

Check the browser console for errors. All mock API calls are logged with `[Mock API]` prefix.

### Changes Not Appearing

Vite uses Hot Module Replacement (HMR). If changes don't appear:
1. Check the browser console for HMR errors
2. Manually refresh the page (F5 or Ctrl+R)
3. Restart the dev server if needed

## Implementation Details

### Mock API Location
`src/renderer/api.mock.ts` - Contains all mock implementations

### Detection Logic
`src/renderer/api.ts` - Detects environment and returns appropriate API

### Dev Mode Banner
`src/renderer/App.tsx` - Shows warning banner in browser mode

### Mock Data Storage
In-memory JavaScript objects - resets on page refresh
