const infrastructure = require('./EnvironmentConfig');

(async () => {
  await infrastructure.configure();
})().catch((e) => {
  console.error(`Error setting up dev mode: ${e.message} ${e.stack}`);
});
