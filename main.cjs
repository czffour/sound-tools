const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, globalShortcut } = require('electron')
const path = require('path')
const { apiMethods } = require('./src/electron/apiMethods.cjs')

let tray = null
let mainWindow = null

// 在文件顶部添加一个变量来检查是否是开机启动
let isOpenAtLogin = process.argv.includes('--openAsHidden')

// 检查是否是第二个实例
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // 等待 app ready 后再显示对话框
  // app.whenReady().then(() => {
  //   dialog.showMessageBox({
  //     type: 'info',
  //     title: '提示',
  //     message: '程序已经在运行中',
  //     buttons: ['确定']
  //   }).then(() => {
  //     app.quit()
  //   })
  // })
  return // 提前返回，不执行后续代码
}

// 处理第二个实例的启动
app.on('second-instance', () => {
  // 如果存在主窗口，显示并聚焦
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
})

// 设置开机自启动
const setAutoLaunch = (enable) => {
  if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: true,
      path: process.execPath,
      args: ["--openAsHidden"],
    })
  }
}

// 默认启用开机自启
// setAutoLaunch(true)

// 自动注册所有 API 方法
function registerApiMethods(methods, prefix = '') {
  Object.entries(methods).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    console.log(`Registering method: ${fullKey}`)
    
    if (typeof value === 'function') {
      ipcMain.handle(fullKey, async (event, ...args) => {
        try {
          console.log(`Executing ${fullKey} with args:`, args)
          return await value(...args)
        } catch (error) {
          console.error(`Error in ${fullKey}:`, error)
          throw error
        }
      })
    } else if (typeof value === 'object') {
      // 递归注册嵌套的方法
      registerApiMethods(value, fullKey)
    }
  })
}

// 在 registerApiMethods 之前添加
ipcMain.handle('window-control', (event, command) => {
  switch (command) {
    case 'minimize':
      mainWindow.minimize()
      break
    case 'close':
      mainWindow.close()
      break
  }
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: app.isPackaged
      ? path.join(process.resourcesPath, 'icon.png')
      : path.join(__dirname, 'resources', 'icon.png'),
    maximizable: false,
    fullscreenable: false,
    resizable: false,
    show: !isOpenAtLogin,  // 如果是开机启动，则不显示窗口
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  })

  mainWindow.removeMenu()

  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.insertCSS(`
      .titlebar {
        -webkit-app-region: drag;
      }
      .titlebar button {
        -webkit-app-region: no-drag;
      }
    `)
  })

  
  // mainWindow.webContents.openDevTools()
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }

  // 处理窗口关闭事件
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
    return false
  })
}

function createTray() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'tray-icon.png')
    : path.join(__dirname, 'resources', 'tray-icon.png')

  tray = new Tray(iconPath)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        mainWindow.show()
      }
    },
    {
      label: '重新加载设备',
      click: async () => {
        mainWindow.webContents.send('refresh-devices')
      }
    },
    { type: 'separator' },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        setAutoLaunch(menuItem.checked)
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('音频设备管理')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow.show()
  })
}

app.whenReady().then(() => {
  app.on('ready', () => {
    Menu.setApplicationMenu(null)
  })
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 修改窗口关闭行为
app.on('before-quit', () => {
  app.isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 注册所有方法
registerApiMethods(apiMethods)

// 在程序退出时注销热键
app.on('will-quit', () => {
  if (globalShortcut) {
    globalShortcut.unregisterAll()
  }
}) 