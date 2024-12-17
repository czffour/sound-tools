import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import type { ApiMethods } from './electron/apiMethods.d'

// 修改类型定义，添加 svcl
declare global {
  interface Window {
    electronAPI: {
      svcl: {
        [K in keyof ApiMethods['svcl']]: (...args: any[]) => Promise<any>
      } & {
        onOutput: (callback: (data: string) => void) => void
      }
    }
  }
}

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
