/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',                      // genera el service worker y assets en /public
  register: true,                      // registra automáticamente el SW
  skipWaiting: true,                   // toma control apenas se instala
  disable: process.env.NODE_ENV === 'development' // PWA solo en build prod
})

module.exports = withPWA({
  reactStrictMode: true
})
