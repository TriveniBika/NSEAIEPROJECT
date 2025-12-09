const { test, expect, chromium } = require('@playwright/test');
import path from 'path';

test('Browser playwright test', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://google.com/');
    await page.waitForLoadState('networkidle');
    console.log(await page.title());
    expect(await page.title()).toBe('Google');
    await expect(page).toHaveTitle("Google");

});


test('Page playwright test2', async ({ page }) => {
    await page.goto('https://www.innovationexchange.nl/');

});


test.only('User perform voice promt', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    //This removes the location prompt per browser context
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 52.0907, longitude: 5.1214 });

    await page.goto('https://www.innovationexchange.nl/');
    await page.waitForLoadState('networkidle');
    expect(await page.title()).toBe('Capgemini Innovation Day 2025 - Spark Idea Generator');


    await page.locator('.btn-text').click()
    await page.waitForLoadState('networkidle');
    const ideapage = page.locator("label[data-slot='label']");
    await ideapage.last().textContent().then(async (text) => {
        console.log("Idea generated: " + text);
    })
    // Click the "Record" button (adjust role/name/locator to your DOM)
    const startstoprecordingbtn = page.locator("div[class='space-y-2'] span[class='audio-recorder-action-text']");
    //await page.getByRole('button', { name: /record/i }).click();
    await startstoprecordingbtn.click();

    // (Optional) wait for your recording indicator if you have one
    //Verify recording started (timer visible)
    const timer = page.locator(".audio-recorder-timer-text");
    await expect(timer).toBeVisible();


    // (Optional) wait a bit to let WAV play into the mic
    // Recording stopped
    await page.waitForTimeout(2000);


    // Stop recording
    //await page.getByRole('button', { name: /stop/i }).click();
    await startstoprecordingbtn.click();


    // Assert the transcript contains our WAV content
    const transcript = page.getByTestId('opportunity')
    await expect(transcript).toBeVisible();
    //const expectedPrompt = 'need top 10 highlights recent parliament dutch party election results';


    // poll until final text contains expectedSnippet:
    await expect
        .poll(async () => (await transcript.textContent())?.trim(), {
            timeout: 10000,
            intervals: [250, 500, 1000],
        })
        .toContain(expectedSnippet);


    await expect(page.getByTestId('opportunity'))
        .toHaveText(/need top 10 highlights recent parliament dutch party election results\./i);

    // Substring (more forgiving)
    await expect(transcript).toContainText(expectedPrompt);

    // Exact match (fails if there’s extra whitespace/characters)
    await expect(transcript).toHaveText(expectedPrompt);
    console.log('DEBUG transcript:', await transcript.textContent());
    const txt = await transcript.textContent();
    expect(txt?.trim()).toBe(expectedPrompt);
    await page.waitForTimeout(2000);
});

