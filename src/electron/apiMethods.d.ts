declare module '*/apiMethods.cjs' {
  export interface ApiMethods {
    svcl: {
      getDevices: () => Promise<Array<{name: string, deviceId: string}>>
      execCommand: (args: string) => Promise<string>
      spawnProcess: (args: string[]) => Promise<string>
      getCurrentDevice: () => Promise<string>
      registerHotkeys: (bindings: {
        [deviceId: string]: {
          hotkey: string
          enabled: boolean
          timestamp?: number
        }
      }) => Promise<boolean>
      unregisterHotkeys: () => Promise<boolean>
    }
  }

  export const apiMethods: {
    svcl: ApiMethods['svcl']
  }
} 