const { test, expect, chromium } = require('@playwright/test');
import path from 'path';
const timestamp = Date.now();

test('Invoke URL and submit business idea using voice prompt', async ({ context, page }) => {
    // const context = await browser.newContext();

    // //This removes the location prompt per browser context
    // await context.grantPermissions(['geolocation']);
    // await context.setGeolocation({ latitude: 52.0907, longitude: 5.1214 });
    // const page = await context.newPage();
    await page.goto('https://www.innovationexchange.nl/');
    await page.waitForLoadState('networkidle');
    expect(await page.title()).toBe('Capgemini Innovation Day 2025 - Spark Idea Generator');

    // Navigate to the submission page and wait for BO label (deterministic)
    await Promise.all([
        page.waitForSelector('.btn-text', { state: 'visible' }),
        page.locator('.btn-text').click(),
        await page.waitForLoadState('networkidle')
    ]);

    //await page.locator('.btn-text').click();

    // Option A: wait for the BO label specifically
    // const boLabel = page.locator('label[for="opportunity"]');
    // await expect(boLabel).toBeVisible();

    await page.waitForLoadState('networkidle');
    const ideapage = page.locator("label[data-slot='label']");
    await ideapage.first().textContent().then(async (text) => {
        console.log("BO Idea generated: " + text);
    })
    //await expect(ideapage).toBeVisible();

    // Business Opportunity record/stop flow
    // One stable locator that flips its text from "Start recording" to "Stop recording"
    const startStopOpp = page.locator("div.space-y-2 span.audio-recorder-action-text").first();

    // Ensure the control is on screen and initially says "Start recording"
    await expect(startStopOpp).toBeVisible();
    await expect(startStopOpp).toHaveText(/^Start recording\s*$/i);
    await startStopOpp.click();

    // (Optional) wait for a visual recording indicator
    const timer = page.locator(".audio-recorder-timer-text");
    await expect(timer).toBeVisible();

    // After click, the same element should say "Stop recording"
    await expect(startStopOpp).toHaveText(/^Stop recording\s*$/i);

    // (Optional) wait a bit to let WAV play into the mic
    // Recording stopped
    await page.screenshot({ path: `./screenshots/BO_${timestamp}.png` });
    await page.waitForTimeout(2000);

    // poll until final text contains expectedSnippet:
    await expect
        .poll(async () => (await startStopOpp.textContent())?.trim() ?? '', {
            timeout: 30000,
            intervals: [250, 500, 1000],
        })
        .toBe('Stop recording');

    // Stop recording by clicking the same control again
    await startStopOpp.click();

    // It should flip back to "Start recording"
    await expect(startStopOpp).toHaveText(/^Start recording\s*$/i);
    await startStopOpp.screenshot({ path: `./screenshots/partial_${timestamp}.png` });


    // await expect(page.getByTestId('opportunity'))
    //     .toHaveText(/need top 10 highlights recent parliament dutch party election results\./i);

    //expect(txt?.trim()).toBe(expectedSnippet);
    await page.waitForTimeout(2000);

    const ideapage2 = page.locator("label[data-slot='label']");
    await ideapage2.last().textContent().then(async (text) => {
        console.log("BV Idea generated: " + text);
    })
    const startStopValue = page.locator("span.audio-recorder-action-text").last();

    // Ensure the control is on screen and initially says "Start recording"
    await expect(startStopValue).toBeVisible();
    await expect(startStopValue).toHaveText(/^Start recording\s*$/i);
    await startStopValue.click();

    // (Optional) wait for a visual recording indicator
    const timer2 = page.locator(".audio-recorder-timer-text");
    await expect(timer2).toBeVisible();

    // After click, the same element should say "Stop recording"
    await expect(startStopValue).toHaveText(/^Stop recording\s*$/i);

    // (Optional) wait a bit to let WAV play into the mic
    // Recording stopped
    await page.screenshot({ path: `./screenshots/BV_${timestamp}.png` });
    await page.waitForTimeout(2000);

    // Stop recording by clicking the same control again
    await startStopValue.click();

    // It should flip back to "Start recording"
    await expect(startStopValue).toHaveText(/^Start recording\s*$/i);
    await startStopValue.screenshot({ path: `./screenshots/partialBV_${timestamp}.png` });

    //----done business value recording, now fill form ----

    await page.getByLabel('First name').fill('Triveni');
    await page.getByLabel('Last name').fill('Bika3');
    await page.getByLabel('Email address').fill('triveni.bika@gmail.com');
    await page.getByLabel('Phone number').fill('+31 874325222 ');



});

