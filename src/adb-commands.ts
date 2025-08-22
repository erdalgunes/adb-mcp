export interface AdbCommand {
  name: string;
  description: string;
  command: string;
  params?: Record<string, any>;
}

export const KEY_EVENTS = {
  HOME: 3,
  BACK: 4,
  CALL: 5,
  END_CALL: 6,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  POWER: 26,
  CAMERA: 27,
  CLEAR: 28,
  ENTER: 66,
  TAB: 61,
  SPACE: 62,
  DELETE: 67,
  ESCAPE: 111,
  DPAD_UP: 19,
  DPAD_DOWN: 20,
  DPAD_LEFT: 21,
  DPAD_RIGHT: 22,
  DPAD_CENTER: 23,
  MENU: 82,
  NOTIFICATION: 83,
  SEARCH: 84,
  PLAY_PAUSE: 85,
  STOP: 86,
  NEXT: 87,
  PREVIOUS: 88,
  REWIND: 89,
  FAST_FORWARD: 90,
  MUTE: 91,
  PAGE_UP: 92,
  PAGE_DOWN: 93,
  SETTINGS: 176,
  BRIGHTNESS_UP: 221,
  BRIGHTNESS_DOWN: 220,
  SLEEP: 223,
  WAKEUP: 224,
  APP_SWITCH: 187,
  ASSIST: 219,
  SCREENSHOT: 120,
  LOCK: 276,
};

export const NATURAL_LANGUAGE_MAPPINGS: Record<string, AdbCommand> = {
  'go home': {
    name: 'Go to Home Screen',
    description: 'Navigate to the Android home screen',
    command: `input keyevent ${KEY_EVENTS.HOME}`,
  },
  'go back': {
    name: 'Go Back',
    description: 'Navigate back to the previous screen',
    command: `input keyevent ${KEY_EVENTS.BACK}`,
  },
  'press enter': {
    name: 'Press Enter',
    description: 'Press the enter/confirm key',
    command: `input keyevent ${KEY_EVENTS.ENTER}`,
  },
  'open recent apps': {
    name: 'Open Recent Apps',
    description: 'Open the recent applications switcher',
    command: `input keyevent ${KEY_EVENTS.APP_SWITCH}`,
  },
  'open notifications': {
    name: 'Open Notifications',
    description: 'Open the notification panel',
    command: `input keyevent ${KEY_EVENTS.NOTIFICATION}`,
  },
  'take screenshot': {
    name: 'Take Screenshot',
    description: 'Capture a screenshot of the current screen',
    command: `input keyevent ${KEY_EVENTS.SCREENSHOT}`,
  },
  'volume up': {
    name: 'Volume Up',
    description: 'Increase the device volume',
    command: `input keyevent ${KEY_EVENTS.VOLUME_UP}`,
  },
  'volume down': {
    name: 'Volume Down',
    description: 'Decrease the device volume',
    command: `input keyevent ${KEY_EVENTS.VOLUME_DOWN}`,
  },
  'lock screen': {
    name: 'Lock Screen',
    description: 'Lock the device screen',
    command: `input keyevent ${KEY_EVENTS.LOCK}`,
  },
  'wake up': {
    name: 'Wake Up',
    description: 'Wake up the device from sleep',
    command: `input keyevent ${KEY_EVENTS.WAKEUP}`,
  },
  'open settings': {
    name: 'Open Settings',
    description: 'Open the Android settings app',
    command: `input keyevent ${KEY_EVENTS.SETTINGS}`,
  },
  'play pause': {
    name: 'Play/Pause',
    description: 'Toggle play/pause for media',
    command: `input keyevent ${KEY_EVENTS.PLAY_PAUSE}`,
  },
  'next track': {
    name: 'Next Track',
    description: 'Skip to the next media track',
    command: `input keyevent ${KEY_EVENTS.NEXT}`,
  },
  'previous track': {
    name: 'Previous Track',
    description: 'Go to the previous media track',
    command: `input keyevent ${KEY_EVENTS.PREVIOUS}`,
  },
  'swipe up': {
    name: 'Swipe Up',
    description: 'Perform a swipe up gesture',
    command: 'input swipe 500 1500 500 300 300',
  },
  'swipe down': {
    name: 'Swipe Down',
    description: 'Perform a swipe down gesture',
    command: 'input swipe 500 300 500 1500 300',
  },
  'swipe left': {
    name: 'Swipe Left',
    description: 'Perform a swipe left gesture',
    command: 'input swipe 900 500 100 500 300',
  },
  'swipe right': {
    name: 'Swipe Right',
    description: 'Perform a swipe right gesture',
    command: 'input swipe 100 500 900 500 300',
  },
};

export function findBestMatch(input: string): AdbCommand | null {
  const normalizedInput = input.toLowerCase().trim();
  
  for (const [key, command] of Object.entries(NATURAL_LANGUAGE_MAPPINGS)) {
    if (normalizedInput.includes(key) || key.includes(normalizedInput)) {
      return command;
    }
  }
  
  const words = normalizedInput.split(' ');
  for (const [key, command] of Object.entries(NATURAL_LANGUAGE_MAPPINGS)) {
    const keyWords = key.split(' ');
    const matchCount = keyWords.filter(kw => 
      words.some(w => w.includes(kw) || kw.includes(w))
    ).length;
    
    if (matchCount >= keyWords.length * 0.5) {
      return command;
    }
  }
  
  return null;
}