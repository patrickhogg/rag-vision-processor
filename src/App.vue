<script setup lang="ts">
import ProcessorDashboard from './components/ProcessorDashboard.vue'
</script>

<template>
  <ProcessorDashboard />
</template>

<style>
/* Reset body styles for Electron */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

#app {
  height: 100%;
  width: 100%;
}
</style>
