import { setupConfigForIntegration } from './Config';

global.beforeAll(async () => {
  await setupConfigForIntegration();
});
