module.exports = {
  apps: [
    {
      name: 'front',
      script: 'server.js',
      cwd: '/var/www/html/main-admin',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'backend',
      script: 'dist/index.js',
      cwd: '/var/www/html/main-admin/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
