import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    screenshot: 'on',
    video: 'retain-on-failure',
  },
});
