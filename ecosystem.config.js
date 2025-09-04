module.exports = {
  apps: [
    {
      name: "hamburguesa-erp",
      cwd: "/home/ubuntu/erp",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        DATABASE_URL: "postgresql://mrh_user:SuperPassword123@localhost:5432/mrh_erp?schema=public",
        JWT_SECRET: "cambia-este-secreto-por-uno-largo"
      }
    }
  ]
}

