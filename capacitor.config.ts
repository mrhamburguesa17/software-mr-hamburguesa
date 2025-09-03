import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mrhamburguesa.app',
  appName: 'Software Mr Hamburguesa',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    url: 'http://192.168.1.53:3000', // emulador -> tu localhost
    cleartext: true
  }
}
export default config