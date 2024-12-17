const { exec, spawn } = require('child_process')
const { promisify } = require('util')
const path = require('path')
const { app, globalShortcut } = require('electron')
const fs = require('fs').promises
const iconv = require('iconv-lite')

const execAsync = promisify(exec)

/**
 * @typedef {Object} ApiMethods
 * @property {Object} svcl
 * @property {() => Promise<Array<{name: string, deviceId: string}>>} svcl.getDevices
 * @property {(args: string) => Promise<string>} svcl.execCommand
 * @property {(args: string[]) => Promise<string>} svcl.spawnProcess
 * @property {() => Promise<string>} svcl.getCurrentDevice
 * @property {(bindings: Object) => Promise<boolean>} svcl.registerHotkeys
 * @property {() => Promise<boolean>} svcl.unregisterHotkeys
 */

/** @type {ApiMethods} */
const apiMethods = {
  svcl: {
    getSvclPath: () => {
      return app.isPackaged
        ? path.join(process.resourcesPath, 'svcl.exe')
        : path.join(app.getAppPath(), 'resources', 'svcl.exe')
    },

    execSvclJson: async (args) => {
      try {
        const tmpFile = path.join(app.getPath('temp'), 'tmplist.json')
        const svclPath = apiMethods.svcl.getSvclPath()
        
        // 执行命令并将输出保存到临时文件
        await execAsync(`"${svclPath}" ${args} "${tmpFile}"`)
        
        // 读取临时文件
        const fileContent = await fs.readFile(tmpFile, 'binary')
        const jsonContent = iconv.decode(fileContent, 'utf-8')
        
        // 解析 JSON
        return JSON.parse(jsonContent)
      } catch (error) {
        console.error(`执行 svcl 命令失败 (${args}):`, error)
        throw error
      }
    },

    formatDeviceInfo: (item) => ({
      name: `${item["Name"]}(${item["Device Name"]})`,
      deviceId: item["Item ID"],
      isDefault: item["Default Multimedia"] === "Render"
    }),

    getDevices: async () => {
      try {
        const devices = await apiMethods.svcl.execSvclJson('/sjson')

        return devices
          .filter(item => 
            item["Direction"] === "Render" && 
            item["Type"] === "Device"
          )
          .map(apiMethods.svcl.formatDeviceInfo)
          .filter(device => device.name && device.deviceId)

      } catch (error) {
        console.error('获取设备列表失败:', error)
        throw error
      }
    },

    execCommand: async (args) => {
      try {
        const svclPath = app.isPackaged
          ? path.join(process.resourcesPath, 'svcl.exe')
          : path.join(app.getAppPath(), 'resources', 'svcl.exe')
          
        const { stdout, stderr } = await execAsync(`"${svclPath}" ${args}`)
        
        if (stderr) {
          throw new Error(stderr)
        }
        
        return stdout
      } catch (error) {
        console.error('执行 svcl.exe 失败:', error)
        throw error
      }
    },

    spawnProcess: async (args) => {
      return new Promise((resolve, reject) => {
        const svclPath = app.isPackaged
          ? path.join(process.resourcesPath, 'svcl.exe')
          : path.join(app.getAppPath(), 'resources', 'svcl.exe')
          
        const process = spawn(svclPath, args)
        
        let output = ''
        let errorOutput = ''

        process.stdout.on('data', (data) => {
          output += data.toString()
        })

        process.stderr.on('data', (data) => {
          errorOutput += data.toString()
        })

        process.on('close', (code) => {
          if (code === 0) {
            resolve(output)
          } else {
            reject(new Error(`进程退出码: ${code}, 错误: ${errorOutput}`))
          }
        })

        process.on('error', (error) => {
          reject(error)
        })
      })
    },

    getCurrentDevice: async () => {
      try {
        const devices = await apiMethods.svcl.execSvclJson('/sjson')
        const currentDevice = devices.find(item => 
          item["Direction"] === "Render" && 
          item["Type"] === "Device" && 
          item["Default Multimedia"] === "Render"
        )

        if (!currentDevice) {
          throw new Error('未找到当前默认设备')
        }
        
        return currentDevice["Item ID"]
      } catch (error) {
        console.error('获取当前设备失败:', error)
        throw error
      }
    },

    registerHotkeys: async (bindings) => {
      try {
        // 先注销所有已注册的热键
        globalShortcut.unregisterAll()

        // 确保 bindings 是可序列化的对象
        const bindingsObj = JSON.parse(JSON.stringify(bindings))

        // 按热键分组重组数据
        const hotkeyGroups = {}
        Object.entries(bindingsObj).forEach(([deviceId, binding]) => {
          if (binding.enabled && binding.hotkey) {
            if (!hotkeyGroups[binding.hotkey]) {
              hotkeyGroups[binding.hotkey] = []
            }
            hotkeyGroups[binding.hotkey].push({
              deviceId,
              timestamp: binding.timestamp || Date.now()
            })
          }
        })

        // 注册新的热键
        Object.entries(hotkeyGroups).forEach(([hotkey, devices]) => {
          try {
            // 按时间戳排序
            const sortedDevices = devices.sort((a, b) => a.timestamp - b.timestamp)
            
            globalShortcut.register(hotkey, async () => {
              try {
                const currentDeviceId = await apiMethods.svcl.getCurrentDevice()
                const svclPath = app.isPackaged
                  ? path.join(process.resourcesPath, 'svcl.exe')
                  : path.join(app.getAppPath(), 'resources', 'svcl.exe')
                
                // 在排序后的设备列表中找到当前设备的索引
                const currentIndex = sortedDevices.findIndex(
                  device => device.deviceId === currentDeviceId
                )
                
                let nextDevice
                if (currentIndex === -1) {
                  // 如果当前设备不在列表中，切换到第一个设备
                  nextDevice = sortedDevices[0]
                } else {
                  // 如果当前设备在列表中，切换到下一个设备（如果是最后一个则回到第一个）
                  nextDevice = sortedDevices[(currentIndex + 1) % sortedDevices.length]
                }
                
                exec(`"${svclPath}" /SetDefault "${nextDevice.deviceId}"`, (error) => {
                  if (error) {
                    console.error('切换设备失败:', error)
                  }
                })
              } catch (error) {
                console.error('设备切换过程中出错:', error)
              }
            })
          } catch (error) {
            console.error(`注册热键 ${hotkey} 失败:`, error)
          }
        })

        return true
      } catch (error) {
        console.error('注册热键失败:', error)
        throw error
      }
    },

    unregisterHotkeys: async () => {
      globalShortcut.unregisterAll()
      return true
    }
  }
}

module.exports = { apiMethods }

// 为了 TypeScript 支持，添加类型导出
/** @typedef {typeof apiMethods} ApiMethodsType */
module.exports.ApiMethods = /** @type {ApiMethodsType} */ ({}) 