# ADB MCP Server

MCP (Model Context Protocol) server for Android Debug Bridge with natural language processing capabilities.

## Features

- **Natural Language Commands**: Use phrases like "go home", "take screenshot", "swipe up" instead of memorizing ADB commands
- **Device Management**: List and select specific devices when multiple are connected
- **Common Actions**: Tap, swipe, type text, take screenshots, install/uninstall apps
- **Key Events**: Send any Android key event (home, back, enter, volume, etc.)
- **App Management**: Launch, clear data, list packages
- **Custom Commands**: Execute any ADB shell command directly

## Installation

```bash
cd adb-mcp
npm install
npm run build
```

## Prerequisites

- Android Debug Bridge (ADB) installed and in PATH
- Android device with USB debugging enabled
- Node.js 18+

## Configuration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "adb-mcp": {
      "command": "node",
      "args": ["/path/to/adb-mcp/dist/index.js"]
    }
  }
}
```

## Available Tools

### Device Management
- `adb_devices` - List all connected Android devices
- `adb_select_device` - Select a specific device for commands

### Natural Language
- `adb_natural` - Execute commands using natural language
  - "go home" - Navigate to home screen
  - "go back" - Go back
  - "press enter" - Press enter key
  - "open recent apps" - Open app switcher
  - "open notifications" - Open notification panel
  - "take screenshot" - Capture screenshot
  - "volume up/down" - Adjust volume
  - "lock screen" - Lock the device
  - "wake up" - Wake the device
  - "open settings" - Open settings app
  - "swipe up/down/left/right" - Swipe gestures
  - "play pause" - Media control
  - "next/previous track" - Media navigation

### Direct Control
- `adb_keyevent` - Send specific key events
- `adb_tap` - Tap at coordinates
- `adb_swipe` - Swipe between coordinates
- `adb_text` - Type text
- `adb_screenshot` - Take and save screenshot

### App Management
- `adb_install` - Install APK file
- `adb_uninstall` - Uninstall app
- `adb_launch_app` - Launch app by package name
- `adb_clear_app` - Clear app data and cache
- `adb_list_packages` - List installed packages

### Advanced
- `adb_custom` - Execute custom ADB shell commands

## Usage Examples

### Using with Claude Desktop

Once configured, you can use natural language to control your Android device:

```
"Take a screenshot of my Android device"
"Go to the home screen"
"Open the recent apps"
"Swipe up to see more content"
"Type 'Hello World' on the device"
"Install the app from /path/to/app.apk"
"List all installed packages that contain 'google'"
```

### Key Events

The server supports all standard Android key events:
- Navigation: HOME, BACK, MENU, APP_SWITCH
- Media: PLAY_PAUSE, STOP, NEXT, PREVIOUS
- Volume: VOLUME_UP, VOLUME_DOWN, MUTE
- Power: POWER, SLEEP, WAKEUP, LOCK
- Input: ENTER, TAB, SPACE, DELETE, ESCAPE
- D-Pad: DPAD_UP, DPAD_DOWN, DPAD_LEFT, DPAD_RIGHT, DPAD_CENTER
- System: SETTINGS, NOTIFICATION, SEARCH, SCREENSHOT
- And many more...

## Development

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Troubleshooting

1. **No devices found**: Ensure USB debugging is enabled on your Android device
2. **Permission denied**: Make sure ADB has proper permissions to access your device
3. **Command not found**: Verify ADB is installed and in your system PATH
4. **Multiple devices**: Use `adb_select_device` to choose which device to control

## License

MIT