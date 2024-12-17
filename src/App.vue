<template>
  <div class="app">
    <!-- <h1>音频设备管理</h1> -->
    <DeviceList />
  </div>
</template>

<script setup lang="ts">
import DeviceList from './components/DeviceList.vue'
</script>

<style>
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  margin-bottom: 2rem;
  text-align: center;
}
</style>
