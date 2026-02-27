module.exports = {
  apps: [
    {
      name: "mission-control",
      script: "npm",
      args: "start",
      cwd: "/home/clawdbot/dev/tony-mission-control",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        CLAWD_PATH: "/home/clawdbot/clawd",
        DB_PATH: "/home/clawdbot/dev/tony-mission-control/data/mission-control.db",
      },
      max_memory_restart: "500M",
      exp_backoff_restart_delay: 100,
    },
  ],
};
