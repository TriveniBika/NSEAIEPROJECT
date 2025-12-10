import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { permission } from 'process';
const wavPath = path.resolve(__dirname, 'fixtures/business_opportunity.wa');
const wavPath2 = path.resolve(__dirname, 'fixtures/business_value.wav');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  reporter: 'html',
  testDir: './tests',
  timeout: 40 * 1000,
  expect: {
    timeout: 50 * 1000,
  },

  //re-try run tests on failure
  retries: 0,
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: false,   //launch GUI mode
        //headless : true,  //no gui, default is true
        viewport: { width: 1280, height: 720 },
        //viewport: null,

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry', //on-first-retry,retain-on-failure, on, off
        //video consume more disk space
        video: 'off',    //on , off, on-first-retry, retain-on-failure
        screenshot: 'retain-on-failure',
        workers: 1, // run tests sequentially 1worker = 1 spec.js file at a time
        //handle location browser launching for different devices

        //critical for fake mic:Microphone/Camera (Chromium), pass the Chromium flags:
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
            `--use-file-for-fake-audio-capture=${wavPath}%noloop`,
            `--use-file-for-fake-audio-capture=${wavPath2}%noloop`,
          ],
        },
        //grant permission and provide coordinates either globally in config or per test:
        permissions: ['geolocation', 'microphone'],
        geolocation: { latitude: 52.0907, longitude: 5.1214 }, // e.g., Utrecht
        locale: 'en-US',

      },
    },
    // {
    //   name: 'edge',
    //   //channel: 'msedge',
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     channel: 'msedge',
    //   }
    // } //end-edge block
  ],
});


