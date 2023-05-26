const p = require('path');
const de = require('dotenv');

const infrastructure = require('./EnvironmentConfig');

de.config({ path: p.join(__dirname, './.env') });

(async () => {
  await infrastructure.configure();
})().catch((e) => {
  console.error(`Error setting up dev mode: ${e.message} ${e.stack}`);
});
