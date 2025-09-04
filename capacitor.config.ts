import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mrh.software',
  appName: 'Software Mr Hamburguesa',
  webDir: 'out',
  server: {
    url: 'http://192.168.1.53:3000', // usalo solo si lo necesitás en desarrollo
    cleartext: true,
  },
}

export default config

