import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { permission } from 'process';
const wavPath = path.resolve(__dirname, 'fixtures/business_opportunity.wa');
const wavPath2 = path.resolve(__dirname, 'fixtures/business_value.wav');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  timeout: 40 * 1000,
  expect: {
    timeout: 50 * 1000,
  },
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    trace: 'on'  // 'on-first-retry',
  },
  launchOptions: {
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      `--use-file-for-fake-audio-capture=${wavPath}%noloop`,
      `--use-file-for-fake-audio-capture=${wavPath2}%noloop`,
    ],
  },
  permissions: ['geolocation', 'microphone'],
  geolocation: { latitude: 52.0907, longitude: 5.1214 }, // e.g., Utrecht
  locale: 'en-US',

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: false,   //launch GUI mode
        //headless : true,  //no gui, default is true
        viewport: { width: 1280, height: 720 },
        //viewport: null,
        video: 'on',
        screenshot: 'retain-on-failure',
        workers: 1, // run tests sequentially 1worker = 1 spec.js file at a time  
      },

    },
    {
      name: 'edge',
      use: {
        headless: false,
        viewport: null,
        channel: 'msedge',
        screenshot: 'on',
      },
    },

    {
      name: 'safariexecution',
      use: {
        browserName: 'webkit',
        headless: false,
        actionTimeout: 0,
        //handle ssl certificate errors
        ignoreHTTPSErrors: true,
        video: 'on-first-retry',
        screenshot: 'off',
        ...devices['iphone 11']
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    Test against branded browsers. */
     {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

