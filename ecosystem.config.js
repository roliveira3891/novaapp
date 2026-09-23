module.exports = {
  apps: [
    {
      name: "novaapp",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3300",
      cwd: "/home/goper/novaapp",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
