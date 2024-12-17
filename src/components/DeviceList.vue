<template>
  <div class="device-list">
    <div class="controls">
      <button @click="refreshDevices">刷新设备列表</button>
      <button @click="saveConfig">保存配置</button>
      <button @click="clearConfig" class="clear-button">清空配置</button>
    </div>
    <div class="message" v-if="message" :class="{ error: isError }">
      {{ message }}
    </div>
    <table class="device-table">
      <thead>
        <tr>
          <th class="device-name">设备名称</th>
          <th class="hotkey">热键</th>
          <th class="enabled">启用</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="device in devices" :key="device.deviceId">
          <td class="device-name">{{ device.name }}</td>
          <td class="hotkey">
            <div class="hotkey-input-group">
              <input
                type="text"
                :value="deviceBindings[device.deviceId]?.hotkey"
                readonly
                @keydown="recordHotkey($event, device.deviceId)"
                @focus="onHotkeyFocus(device.deviceId)"
                @blur="onHotkeyBlur"
                
                :placeholder="isRecording === device.deviceId ? '请按键...' : '点击设置热键'"
                :data-device-id="device.deviceId"
                ref="hotkeyInputs"
              />
              <button 
                class="clear-hotkey" 
                @click="clearHotkey(device.deviceId)"
                v-if="deviceBindings[device.deviceId]?.hotkey"
                title="清除热键"
              >
                ×
              </button>
            </div>
          </td>
          <td class="enabled">
            <input
              type="checkbox"
              :checked="deviceBindings[device.deviceId]?.enabled"
              @change="updateBinding(device.deviceId, 'enabled', $event.target.checked)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="devices.length === 0" class="no-devices">
      未找到设备
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useDeviceStore } from '../stores/deviceStore'

const deviceStore = useDeviceStore()
const devices = computed(() => deviceStore.devices)
const deviceBindings = computed(() => deviceStore.deviceBindings)

onMounted(() => {
  deviceStore.loadBindings()
  deviceStore.fetchDevices()
  deviceStore.saveBindings()
  
  // 添加错误处理
  if (window.electronAPI?.tray?.onRefreshDevices) {
    window.electronAPI.tray.onRefreshDevices(() => {
      refreshDevices()
    })
  }
})

// 记录当前正在录制热键的设备ID
const isRecording = ref<string | null>(null)

// 刷新设备列表
const refreshDevices = async () => {
  await deviceStore.fetchDevices()
}

const message = ref('')
const isError = ref(false)

// 保存配置
const saveConfig = async () => {
  try {
    message.value = '正在保存配置...'
    isError.value = false
    await deviceStore.saveBindings()
    message.value = '配置保存成功'
    setTimeout(() => {
      message.value = ''
    }, 2000)
  } catch (error) {
    message.value = '保存配置失败: ' + (error instanceof Error ? error.message : '未知错误')
    isError.value = true
  }
}

// 清空配置
const clearConfig = async () => {
  // if (confirm('确定要清空所有配置吗？此操作不可恢复。')) {
    try {
      message.value = '正在清空配置...'
      isError.value = false
      
      // 先重置录制状态
      isRecording.value = null
      
      // 清空配置
      await deviceStore.clearAllBindings()
      
      // 重新获取设备列表
      await deviceStore.fetchDevices()
      
      // 强制刷新组件状态
      await nextTick()
      
      message.value = '配置已清空'
      setTimeout(() => {
        message.value = ''
      }, 2000)
    } catch (error) {
      message.value = '清空配置失败: ' + (error instanceof Error ? error.message : '未知错误')
      isError.value = true
    }
  // }
}

// 更新绑定
const updateBinding = async (deviceId: string, field: 'hotkey' | 'enabled', value: any) => {
  await deviceStore.updateDeviceBinding(deviceId, { [field]: value })
}

// 添加清除热键方法
const clearHotkey = async (deviceId: string) => {
  await deviceStore.updateDeviceBinding(deviceId, { hotkey: '' })
}

// 修改记录热键的方法
const recordHotkey = async (event: KeyboardEvent, deviceId: string) => {
  // 确保设备存在且正在录制状态
  if (isRecording.value === deviceId && deviceStore.deviceBindings[deviceId]) {
    try {
      await deviceStore.recordHotkey(deviceId, event)
    } catch (error) {
      message.value = error instanceof Error ? error.message : '设置热键失败'
      isError.value = true
      setTimeout(() => {
        message.value = ''
      }, 2000)
    }
  }
}

// 焦点处理
const onHotkeyFocus = (deviceId: string) => {
  if (deviceStore.deviceBindings[deviceId]) {
    isRecording.value = deviceId
  }
}

const onHotkeyBlur = () => {
  nextTick(() => {
    isRecording.value = null
  })
}

// 添加新的方法用于手动触发焦点
const focusHotkeyInput = (deviceId: string) => {
  const input = hotkeyInputs.value.find(el => el.dataset.deviceId === deviceId)
  if (input) {
    input.focus()
  }
}

const hotkeyInputs = ref<HTMLInputElement[]>([])
</script>

<style scoped>
.device-list {
  padding: 1rem;
}

.controls {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
}

.device-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.device-table th,
.device-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.device-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.device-table tr:hover {
  background-color: #f8f9fa;
}

.device-name {
  width: 60%;
}

.hotkey {
  width: 30%;
}

.enabled {
  width: 10%;
  text-align: center;
}

.hotkey-input-group {
  position: relative;
  display: flex;
  align-items: center;
  width: 120px;
}

input[type="text"] {
  padding: 0.25rem 0.5rem;
  padding-right: 25px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 120px;
  cursor: pointer;
}

input[type="text"]:focus {
  outline: 2px solid #007bff;
  border-color: #007bff;
}

.clear-hotkey {
  position: absolute;
  right: 5px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 2px 6px;
  font-size: 16px;
  line-height: 1;
}

.clear-hotkey:hover {
  color: #ff4444;
  background-color: #f0f0f0;
  border-radius: 50%;
}

.no-devices {
  text-align: center;
  padding: 1rem;
  color: #666;
  font-style: italic;
}

button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

input[type="checkbox"] {
  transform: scale(1.2);
}

.message {
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  text-align: center;
  background-color: #d4edda;
  color: #155724;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
}

.clear-button {
  background-color: #dc3545;
}

.clear-button:hover {
  background-color: #c82333;
}
</style> 