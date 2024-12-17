import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Device, DeviceBinding, DeviceBindingMap } from '../types/device'

export const useDeviceStore = defineStore('device', () => {
  // 设备列表
  const devices = ref<Device[]>([])
  
  // 设备绑定映射
  const deviceBindings = ref<DeviceBindingMap>({})

  // 获取设备列表
  const fetchDevices = async () => {
    try {
      const deviceList = await window.electronAPI.svcl.getDevices()
      devices.value = deviceList
      
      // 为新设备初始化绑定数据
      deviceList.forEach((device: Device) => {
        if (!deviceBindings.value[device.deviceId]) {
          deviceBindings.value[device.deviceId] = {
            hotkey: '',
            enabled: false,
            timestamp: Date.now()
          }
        }
      })
    } catch (error) {
      console.error('Failed to fetch devices:', error)
    }
  }

  // 更新设备绑定
  const updateDeviceBinding = async (deviceId: string, binding: Partial<Omit<DeviceBinding, 'deviceId'>>) => {
    // 确保设备ID存在
    if (!deviceBindings.value[deviceId]) {
      deviceBindings.value[deviceId] = {
        hotkey: '',
        enabled: false,
        timestamp: Date.now()
      }
    }

    // 如果是更新热键，更新时间戳
    if ('hotkey' in binding && binding.hotkey) {
      binding.timestamp = Date.now()
    }
    
    deviceBindings.value[deviceId] = {
      ...deviceBindings.value[deviceId],
      ...binding
    }
  }

  // 获取设备的绑定数据
  const getDeviceBinding = (deviceId: string) => {
    if (!deviceBindings.value[deviceId]) {
      deviceBindings.value[deviceId] = {
        hotkey: '',
        enabled: false,
        timestamp: Date.now()
      }
    }
    return deviceBindings.value[deviceId]
  }

  // 计算属性：获取所有已启用的设备绑定
  const enabledBindings = computed(() => {
    return Object.entries(deviceBindings.value)
      .filter(([_, binding]) => binding.enabled)
      .map(([deviceId, binding]) => ({
        deviceId,
        ...binding
      }))
  })

  // 保存绑定数据并注册热键
  const saveBindings = async () => {
    try {
      // 先注销所有热键
      await window.electronAPI.svcl.unregisterHotkeys()
      
      // 将响应式对象转换为普通对象
      const plainBindings = Object.entries(deviceBindings.value).reduce((acc, [deviceId, binding]) => {
        if (binding.hotkey || binding.enabled) {
          acc[deviceId] = {
            hotkey: binding.hotkey,
            enabled: binding.enabled,
            timestamp: binding.timestamp || Date.now()
          }
        }
        return acc
      }, {} as DeviceBindingMap)
      
      // 保存到本地存储
      localStorage.setItem('deviceBindings', JSON.stringify(plainBindings))
      
      // 注册新的热键配置
      await window.electronAPI.svcl.registerHotkeys(plainBindings)
    } catch (error) {
      console.error('保存配置失败:', error)
      throw error
    }
  }

  // 从本地存储加载绑定数据
  const loadBindings = () => {
    try {
      const savedBindings = localStorage.getItem('deviceBindings')
      if (savedBindings) {
        const parsedBindings = JSON.parse(savedBindings)
        // 确保每个设备都有绑定数据
        devices.value.forEach(device => {
          if (!parsedBindings[device.deviceId]) {
            parsedBindings[device.deviceId] = {
              hotkey: '',
              enabled: false,
              timestamp: Date.now()
            }
          }
        })
        deviceBindings.value = parsedBindings
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }

  // 清空所有绑定配置
  const clearAllBindings = async () => {
    try {
      // 先注销所有热键
      await window.electronAPI.svcl.unregisterHotkeys()
      
      // 清空本地存储
      localStorage.removeItem('deviceBindings')
      
      // 重新获取设备列表
      await loadBindings()
      await fetchDevices()
      
      // 重新初始化每个设备的绑定
      const newBindings: DeviceBindingMap = {}
      devices.value.forEach(device => {
        newBindings[device.deviceId] = {
          hotkey: '',
          enabled: false,
          timestamp: Date.now()
        }
      })
      
      // 更新状态
      deviceBindings.value = newBindings
      
      // 保存新的空配置
      await saveBindings()
      
      return true
    } catch (error) {
      console.error('清空配置失败:', error)
      throw error
    }
  }

  // 记录热键
  const recordHotkey = async (deviceId: string, event: KeyboardEvent) => {
    event.preventDefault()
    console.log('Key Event:', event.key)
    const keys: string[] = []
    if (event.ctrlKey) keys.push('Ctrl')
    if (event.altKey) keys.push('Alt')
    if (event.shiftKey) keys.push('Shift')
    
    // 转换特殊键名
    let key = event.key

    // 媒体键名称映射
    const mediaKeyMap: { [key: string]: string } = {
      'MediaTrackPrevious': 'MediaPreviousTrack',
      'MediaTrackNext': 'MediaNextTrack',
      'MediaStop': 'MediaStop',
      'MediaPlayPause': 'MediaPlayPause'
    }

    // 如果不是修饰键
    if (!['Control', 'Alt', 'Shift'].includes(key)) {
      // 处理媒体键的不同命名
      if (key in mediaKeyMap || Object.values(mediaKeyMap).includes(key)) {
        // 统一使用标准命名
        key = Object.entries(mediaKeyMap).find(([k, v]) => k === key || v === key)?.[1] || key
      } else {
        // 其他键将第一个字母大写
        key = key.length === 1 ? key.toUpperCase() : key
      }
      keys.push(key)
    }
    
    console.log('Processed Keys:', keys)
    if (keys.length > 0) {
      const hotkey = keys.join('+')
      await updateDeviceBinding(deviceId, { hotkey })
    }
  }

  return {
    devices,
    deviceBindings,
    fetchDevices,
    updateDeviceBinding,
    getDeviceBinding,
    enabledBindings,
    saveBindings,
    loadBindings,
    recordHotkey,
    clearAllBindings
  }
}) 