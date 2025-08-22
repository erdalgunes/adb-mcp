#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { findBestMatch, NATURAL_LANGUAGE_MAPPINGS, KEY_EVENTS } from './adb-commands.js';

const execAsync = promisify(exec);

class AdbMcpServer {
  private server: Server;
  private selectedDevice: string | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'adb-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private async executeAdbCommand(command: string): Promise<string> {
    try {
      const deviceFlag = this.selectedDevice ? `-s ${this.selectedDevice}` : '';
      const fullCommand = `adb ${deviceFlag} shell ${command}`;
      const { stdout, stderr } = await execAsync(fullCommand);
      
      if (stderr && !stderr.includes('warning')) {
        throw new Error(stderr);
      }
      
      return stdout || 'Command executed successfully';
    } catch (error: any) {
      throw new Error(`ADB command failed: ${error.message}`);
    }
  }

  private async getDevices(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('adb devices');
      const lines = stdout.split('\n').filter(line => line.includes('\t'));
      return lines.map(line => line.split('\t')[0]);
    } catch (error) {
      return [];
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'adb_devices',
          description: 'List all connected Android devices',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'adb_select_device',
          description: 'Select a specific device for subsequent commands',
          inputSchema: {
            type: 'object',
            properties: {
              device_id: {
                type: 'string',
                description: 'The device ID to select',
              },
            },
            required: ['device_id'],
          },
        },
        {
          name: 'adb_natural',
          description: 'Execute ADB command using natural language (e.g., "go home", "take screenshot", "swipe up")',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                description: 'Natural language description of the action to perform',
              },
            },
            required: ['action'],
          },
        },
        {
          name: 'adb_keyevent',
          description: 'Send a key event to the device',
          inputSchema: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                description: `Key name or code. Available keys: ${Object.keys(KEY_EVENTS).join(', ')}`,
              },
            },
            required: ['key'],
          },
        },
        {
          name: 'adb_tap',
          description: 'Tap at specific coordinates on the screen',
          inputSchema: {
            type: 'object',
            properties: {
              x: {
                type: 'number',
                description: 'X coordinate',
              },
              y: {
                type: 'number',
                description: 'Y coordinate',
              },
            },
            required: ['x', 'y'],
          },
        },
        {
          name: 'adb_swipe',
          description: 'Perform a swipe gesture on the screen',
          inputSchema: {
            type: 'object',
            properties: {
              x1: {
                type: 'number',
                description: 'Starting X coordinate',
              },
              y1: {
                type: 'number',
                description: 'Starting Y coordinate',
              },
              x2: {
                type: 'number',
                description: 'Ending X coordinate',
              },
              y2: {
                type: 'number',
                description: 'Ending Y coordinate',
              },
              duration: {
                type: 'number',
                description: 'Duration in milliseconds (optional)',
                default: 300,
              },
            },
            required: ['x1', 'y1', 'x2', 'y2'],
          },
        },
        {
          name: 'adb_text',
          description: 'Type text on the device',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'Text to type',
              },
            },
            required: ['text'],
          },
        },
        {
          name: 'adb_screenshot',
          description: 'Take a screenshot and save it locally',
          inputSchema: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'Local filename to save the screenshot (optional)',
                default: 'screenshot.png',
              },
            },
          },
        },
        {
          name: 'adb_install',
          description: 'Install an APK file on the device',
          inputSchema: {
            type: 'object',
            properties: {
              apk_path: {
                type: 'string',
                description: 'Path to the APK file',
              },
            },
            required: ['apk_path'],
          },
        },
        {
          name: 'adb_uninstall',
          description: 'Uninstall an app from the device',
          inputSchema: {
            type: 'object',
            properties: {
              package_name: {
                type: 'string',
                description: 'Package name of the app to uninstall',
              },
            },
            required: ['package_name'],
          },
        },
        {
          name: 'adb_launch_app',
          description: 'Launch an app by package name',
          inputSchema: {
            type: 'object',
            properties: {
              package_name: {
                type: 'string',
                description: 'Package name of the app to launch',
              },
            },
            required: ['package_name'],
          },
        },
        {
          name: 'adb_clear_app',
          description: 'Clear app data and cache',
          inputSchema: {
            type: 'object',
            properties: {
              package_name: {
                type: 'string',
                description: 'Package name of the app to clear',
              },
            },
            required: ['package_name'],
          },
        },
        {
          name: 'adb_list_packages',
          description: 'List installed packages on the device',
          inputSchema: {
            type: 'object',
            properties: {
              filter: {
                type: 'string',
                description: 'Optional filter string to search for specific packages',
              },
            },
          },
        },
        {
          name: 'adb_custom',
          description: 'Execute a custom ADB shell command',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Custom shell command to execute',
              },
            },
            required: ['command'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'adb_devices': {
            const devices = await this.getDevices();
            if (devices.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'No devices connected. Please connect an Android device and ensure USB debugging is enabled.',
                  },
                ],
              };
            }
            return {
              content: [
                {
                  type: 'text',
                  text: `Connected devices:\n${devices.join('\n')}\n\nCurrent device: ${this.selectedDevice || 'none (using first available)'}`,
                },
              ],
            };
          }

          case 'adb_select_device': {
            const { device_id } = args as { device_id: string };
            const devices = await this.getDevices();
            
            if (!devices.includes(device_id)) {
              throw new Error(`Device ${device_id} not found. Available devices: ${devices.join(', ')}`);
            }
            
            this.selectedDevice = device_id;
            return {
              content: [
                {
                  type: 'text',
                  text: `Selected device: ${device_id}`,
                },
              ],
            };
          }

          case 'adb_natural': {
            const { action } = args as { action: string };
            const command = findBestMatch(action);
            
            if (!command) {
              const availableCommands = Object.keys(NATURAL_LANGUAGE_MAPPINGS).join(', ');
              throw new Error(`Could not understand action: "${action}". Available commands: ${availableCommands}`);
            }
            
            const result = await this.executeAdbCommand(command.command);
            return {
              content: [
                {
                  type: 'text',
                  text: `Executed: ${command.name}\nCommand: adb shell ${command.command}\n${result}`,
                },
              ],
            };
          }

          case 'adb_keyevent': {
            const { key } = args as { key: string };
            let keyCode: number;
            
            if (key.toUpperCase() in KEY_EVENTS) {
              keyCode = KEY_EVENTS[key.toUpperCase() as keyof typeof KEY_EVENTS];
            } else if (!isNaN(Number(key))) {
              keyCode = Number(key);
            } else {
              throw new Error(`Unknown key: ${key}. Available keys: ${Object.keys(KEY_EVENTS).join(', ')}`);
            }
            
            const result = await this.executeAdbCommand(`input keyevent ${keyCode}`);
            return {
              content: [
                {
                  type: 'text',
                  text: `Sent key event: ${key} (code: ${keyCode})\n${result}`,
                },
              ],
            };
          }

          case 'adb_tap': {
            const { x, y } = args as { x: number; y: number };
            const result = await this.executeAdbCommand(`input tap ${x} ${y}`);
            return {
              content: [
                {
                  type: 'text',
                  text: `Tapped at (${x}, ${y})\n${result}`,
                },
              ],
            };
          }

          case 'adb_swipe': {
            const { x1, y1, x2, y2, duration = 300 } = args as {
              x1: number;
              y1: number;
              x2: number;
              y2: number;
              duration?: number;
            };
            const result = await this.executeAdbCommand(`input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
            return {
              content: [
                {
                  type: 'text',
                  text: `Swiped from (${x1}, ${y1}) to (${x2}, ${y2}) over ${duration}ms\n${result}`,
                },
              ],
            };
          }

          case 'adb_text': {
            const { text } = args as { text: string };
            const escapedText = text.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/ /g, '%s');
            const result = await this.executeAdbCommand(`input text '${escapedText}'`);
            return {
              content: [
                {
                  type: 'text',
                  text: `Typed text: "${text}"\n${result}`,
                },
              ],
            };
          }

          case 'adb_screenshot': {
            const { filename = 'screenshot.png' } = args as { filename?: string };
            const devicePath = '/sdcard/screenshot.png';
            
            await this.executeAdbCommand(`screencap -p ${devicePath}`);
            
            const deviceFlag = this.selectedDevice ? `-s ${this.selectedDevice}` : '';
            await execAsync(`adb ${deviceFlag} pull ${devicePath} ${filename}`);
            await this.executeAdbCommand(`rm ${devicePath}`);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Screenshot saved to: ${filename}`,
                },
              ],
            };
          }

          case 'adb_install': {
            const { apk_path } = args as { apk_path: string };
            const deviceFlag = this.selectedDevice ? `-s ${this.selectedDevice}` : '';
            const { stdout } = await execAsync(`adb ${deviceFlag} install -r ${apk_path}`);
            return {
              content: [
                {
                  type: 'text',
                  text: `APK installed: ${apk_path}\n${stdout}`,
                },
              ],
            };
          }

          case 'adb_uninstall': {
            const { package_name } = args as { package_name: string };
            const deviceFlag = this.selectedDevice ? `-s ${this.selectedDevice}` : '';
            const { stdout } = await execAsync(`adb ${deviceFlag} uninstall ${package_name}`);
            return {
              content: [
                {
                  type: 'text',
                  text: `Package uninstalled: ${package_name}\n${stdout}`,
                },
              ],
            };
          }

          case 'adb_launch_app': {
            const { package_name } = args as { package_name: string };
            const result = await this.executeAdbCommand(
              `monkey -p ${package_name} -c android.intent.category.LAUNCHER 1`
            );
            return {
              content: [
                {
                  type: 'text',
                  text: `Launched app: ${package_name}\n${result}`,
                },
              ],
            };
          }

          case 'adb_clear_app': {
            const { package_name } = args as { package_name: string };
            const result = await this.executeAdbCommand(`pm clear ${package_name}`);
            return {
              content: [
                {
                  type: 'text',
                  text: `Cleared app data: ${package_name}\n${result}`,
                },
              ],
            };
          }

          case 'adb_list_packages': {
            const { filter } = args as { filter?: string };
            let command = 'pm list packages';
            if (filter) {
              command += ` | grep -i ${filter}`;
            }
            const result = await this.executeAdbCommand(command);
            const packages = result
              .split('\n')
              .filter(line => line.startsWith('package:'))
              .map(line => line.replace('package:', ''))
              .join('\n');
            
            return {
              content: [
                {
                  type: 'text',
                  text: filter 
                    ? `Packages matching "${filter}":\n${packages}`
                    : `All installed packages:\n${packages}`,
                },
              ],
            };
          }

          case 'adb_custom': {
            const { command } = args as { command: string };
            const result = await this.executeAdbCommand(command);
            return {
              content: [
                {
                  type: 'text',
                  text: `Executed: ${command}\n${result}`,
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ADB MCP Server running on stdio');
  }
}

const server = new AdbMcpServer();
server.run().catch(console.error);