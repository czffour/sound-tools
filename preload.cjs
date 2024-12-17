const { contextBridge, ipcRenderer } = require('electron')

// 创建可序列化的 API 对象
const exposedApi = {
  user: {
    login: (...args) => ipcRenderer.invoke('user.login', ...args),
    logout: (...args) => ipcRenderer.invoke('user.logout', ...args)
  },
  device: {
    getList: (...args) => ipcRenderer.invoke('device.getList', ...args),
    connect: (...args) => ipcRenderer.invoke('device.connect', ...args)
  },
  svcl: {
    getDevices: (...args) => ipcRenderer.invoke('svcl.getDevices', ...args),
    execCommand: (...args) => ipcRenderer.invoke('svcl.execCommand', ...args),
    spawnProcess: (...args) => ipcRenderer.invoke('svcl.spawnProcess', ...args),
    registerHotkeys: (...args) => ipcRenderer.invoke('svcl.registerHotkeys', ...args),
    unregisterHotkeys: (...args) => ipcRenderer.invoke('svcl.unregisterHotkeys', ...args)
  },
  tray: {
    onRefreshDevices: (callback) => {
      ipcRenderer.on('refresh-devices', () => callback())
    }
  },
  window: {
    minimize: () => ipcRenderer.invoke('window-control', 'minimize'),
    close: () => ipcRenderer.invoke('window-control', 'close')
  }
}

// 添加日志，但不要序列化函数
console.log('Exposing API with methods:', {
  user: Object.keys(exposedApi.user),
  device: Object.keys(exposedApi.device),
  svcl: Object.keys(exposedApi.svcl)
})

try {
  // 分别暴露每个模块，包括 tray
  contextBridge.exposeInMainWorld('electronAPI', {
    user: exposedApi.user,
    device: exposedApi.device,
    svcl: exposedApi.svcl,
    tray: exposedApi.tray
  })
} catch (error) {
  console.error('Error exposing API:', error)
} 