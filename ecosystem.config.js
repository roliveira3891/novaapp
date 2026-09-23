module.exports = {
  apps: [
    {
      name: "novaapp",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3300 -H 0.0.0.0",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
