// 设备数据类型
export interface Device {
  name: string
  deviceId: string
}

// 设备绑定数据类型
export interface DeviceBinding {
  deviceId: string
  hotkey: string
  enabled: boolean
  timestamp?: number
}

// 设备绑定映射类型
export interface DeviceBindingMap {
  [deviceId: string]: {
    hotkey: string
    enabled: boolean
    timestamp?: number
  }
} 