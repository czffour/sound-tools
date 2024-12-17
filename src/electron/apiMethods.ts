export type Device = {
  name: string
  deviceId: string
}

export type DeviceBindingMap = {
  [deviceId: string]: {
    hotkey: string
    enabled: boolean
  }
}

export type ApiMethods = {
  user: {
    login: (username: string, password: string) => Promise<any>
    logout: () => Promise<void>
  }
  device: {
    getList: () => Promise<any>
    connect: (id: string) => Promise<any>
  }
  svcl: {
    getDevices: () => Promise<Device[]>
    execCommand: (args: string) => Promise<string>
    spawnProcess: (args: string[]) => Promise<string>
    registerHotkeys: (bindings: DeviceBindingMap) => Promise<boolean>
    unregisterHotkeys: () => Promise<boolean>
  }
} 