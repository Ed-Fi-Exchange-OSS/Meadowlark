import { join } from 'path';
import dotenv from 'dotenv';

const infrastructure = require('./SetupTestContainers');

dotenv.config({ path: join(__dirname, './.env-e2e') });

(async () => {
  await infrastructure.configure();
})().catch((e) => {
  console.error(`Error setting up dev mode: ${e.message} ${e.stack}`);
});
