const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const timestamp = Date.now();

const audio1Path = path.resolve(process.cwd(), 'fixtures', 'BO_trafficeAI.wav');
const audio2Path = path.resolve(process.cwd(), 'fixtures', 'BV_improveimpactAI.wav');
// const audio1Path = path.resolve(process.cwd(), 'fixtures', 'business_opportunity.wav');
// const audio2Path = path.resolve(process.cwd(), 'fixtures', 'business_value.wav');

// Checks so failures are explicit
if (!fs.existsSync(audio1Path)) {
    throw new Error(`wav audio #1 not found: ${audio1Path}`);
}
if (!fs.existsSync(audio2Path)) {
    throw new Error(`wav audio #2 not found: ${audio2Path}`);
}

// Context-level 'addInitScript ' installs our getUserMedia override for all frames/pages in this test.
async function injectAudioFeeder(page) {
    await page.context().addInitScript(() => {
        (function () {
            const state = {
                nextClipBytes: null,
                sampleRate: null,
                passThrough: false,
            };

            const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
                navigator.mediaDevices
            );

            async function bytesToBuffer(audioBytes) {
                const ctx = new (window.AudioContext || window.webkitAudioContext)({
                    sampleRate: state.sampleRate || undefined,
                });
                const audioBuffer = await ctx.decodeAudioData(
                    audioBytes instanceof ArrayBuffer ? audioBytes : audioBytes.buffer
                );
                const destination = ctx.createMediaStreamDestination();
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(destination);
                source.start(0);
                destination.stream.__audioFeeder = { ctx, source, destination };
                return destination.stream;
            }

            window.__audioFeeder = {
                async setNextClipFromUrl(url, sampleRate) {
                    state.sampleRate = sampleRate || null;
                    const resp = await fetch(url);
                    const buf = await resp.arrayBuffer();
                    state.nextClipBytes = buf;
                    state.passThrough = false;
                },
                async setNextClipFromBase64(base64, sampleRate) {
                    state.sampleRate = sampleRate || null;
                    const bin = atob(base64);
                    const len = bin.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
                    state.nextClipBytes = bytes.buffer;
                    state.passThrough = false;
                },
                enablePassThrough() {
                    state.passThrough = true;
                },
                stop() {
                    try {
                        const s = window.__lastSyntheticStream;
                        if (s && s.__audioFeeder) {
                            s.__audioFeeder.source.stop();
                            s.__audioFeeder.ctx.close();
                        }
                    } catch { }
                },
            };

            navigator.mediaDevices.getUserMedia = async function (constraints) {
                const wantAudio =
                    constraints && (constraints.audio === true || typeof constraints.audio === 'object');

                if (wantAudio && !state.passThrough && state.nextClipBytes) {
                    const stream = await bytesToBuffer(state.nextClipBytes);
                    window.__lastSyntheticStream = stream;
                    state.nextClipBytes = null;


                    if (!window.__audioFeeder) window.__audioFeeder = {};
                    window.__audioFeeder.lastServedAt = Date.now();
                    window.__audioFeeder.servedCount = (window.__audioFeeder.servedCount || 0) + 1;

                    return stream;
                }

                return originalGetUserMedia(constraints);
            };
        })();
    });

    // Guard in case current document was loaded before the init script landed.
    const hasFeeder = await page.evaluate(() => typeof window.__audioFeeder !== 'undefined');
    if (!hasFeeder) {
        await page.addScriptTag({
            content: `(${(() => {
                const state = { nextClipBytes: null, sampleRate: null, passThrough: false };
                const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
                async function bytesToBuffer(audioBytes) {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)({
                        sampleRate: state.sampleRate || undefined,
                    });
                    const audioBuffer = await ctx.decodeAudioData(
                        audioBytes instanceof ArrayBuffer ? audioBytes : audioBytes.buffer
                    );
                    const destination = ctx.createMediaStreamDestination();
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(destination);
                    source.start(0);
                    destination.stream.__audioFeeder = { ctx, source, destination };
                    return destination.stream;
                }
                window.__audioFeeder = {
                    async setNextClipFromUrl(url, sampleRate) {
                        state.sampleRate = sampleRate || null;
                        const resp = await fetch(url);
                        const buf = await resp.arrayBuffer();
                        state.nextClipBytes = buf;
                        state.passThrough = false;
                    },
                    async setNextClipFromBase64(base64, sampleRate) {
                        state.sampleRate = sampleRate || null;
                        const bin = atob(base64);
                        const len = bin.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
                        state.nextClipBytes = bytes.buffer;
                        state.passThrough = false;
                    },
                    enablePassThrough() { state.passThrough = true; },
                    stop() { try { const s = window.__lastSyntheticStream; if (s && s.__audioFeeder) { s.__audioFeeder.source.stop(); s.__audioFeeder.ctx.close(); } } catch { } }
                };
                navigator.mediaDevices.getUserMedia = async function (constraints) {
                    const wantAudio = constraints && (constraints.audio === true || typeof constraints.audio === 'object');
                    if (wantAudio && !state.passThrough && state.nextClipBytes) {
                        const stream = await bytesToBuffer(state.nextClipBytes);
                        window.__lastSyntheticStream = stream;
                        state.nextClipBytes = null;
                        return stream;
                    }
                    return orig(constraints);
                };
            }).toString()})();`,
        });
    }
}

test('Verify E2E prototype: Enable stakeholders to submit voice-based BO & BV, complete mandatory details, receive Submission ID & email, and open GitHub Spark prototype', async ({ page }) => {
    // Route /fixtures/* point to local files so the page can fetch them
    await page.route('**/fixtures/*', async (route) => {
        const url = new URL(route.request().url());
        const fileName = path.basename(url.pathname); // e.g., business_opportunity.wav
        const localPath = path.resolve(process.cwd(), 'fixtures', fileName);
        const body = await fs.promises.readFile(localPath);
        // using MP3s, change to 'audio/mpeg'
        await route.fulfill({
            status: 200,
            headers: { 'content-type': 'audio/wav' },
            body,
        });
    });

    // Navigate to app and inject feeder
    await page.goto('https://www.innovationexchange.nl/');
    await page.waitForLoadState('networkidle');
    await expect(await page.title()).toBe('Capgemini Innovation Day 2025 - Spark Idea Generator');

    await injectAudioFeeder(page);

    // Go to the submission page:
    await Promise.all([
        page.waitForSelector('.btn-text', { state: 'visible' }),
        page.locator('.btn-text').click(),
        page.waitForLoadState('networkidle'),
    ]);

    // Ensure feeder exists after navigation
    const feederReady = await page.evaluate(() => typeof window.__audioFeeder !== 'undefined');
    if (!feederReady) throw new Error('audioFeeder not present after navigation');

    // --- Prepare AUDIO #1: Business Opportunity ---
    await page.evaluate((fname) => {
        return window.__audioFeeder.setNextClipFromUrl(`/fixtures/${fname}`);
    }, path.basename(audio1Path));

    // Read servedCount before clicking (baseline)
    //const beforeCount = await page.evaluate(() => window.__audioFeeder?.servedCount ?? 0);


    const startStopOpp = page.locator('div.space-y-2 span.audio-recorder-action-text').first();
    await expect(startStopOpp).toBeVisible();
    await expect(startStopOpp).toHaveText(/^Start recording\s*$/i);

    // Start recording -> getUserMedia picks up audio #1
    await startStopOpp.click();
    const timer = page.locator('.audio-recorder-timer-text');
    await expect(timer).toBeVisible();

    //this gives you synthetic stream1 being consumed & Wait until override reports it served a stream
    // await expect.poll(async () => {
    //     const count = await page.evaluate(() => window.__audioFeeder?.servedCount ?? 0);
    //     return count;
    // }, { timeout: 5000, intervals: [100, 200, 500] }).toBeGreaterThan(beforeCount);

    // // (Optional) check timestamp too
    // const servedAt = await page.evaluate(() => window.__audioFeeder?.lastServedAt ?? 0);
    // console.log('Synthetic audio1 served at:', servedAt);


    await expect(startStopOpp).toHaveText(/^Stop recording\s*$/i);

    // Let the first clip play (adjust to match your real clip length)
    await page.waitForTimeout(3000);

    // Stop recording
    await startStopOpp.click();
    await expect(startStopOpp).toHaveText(/^Start recording\s*$/i);
    await page.screenshot({ path: `./screenshots/BO_${timestamp}.png` });
    // --- Prepare AUDIO #2: Business Value ---
    // await page.evaluate(() =>
    //     window.__audioFeeder.setNextClipFromUrl('/fixtures/business_value.wav')
    // );

    await page.evaluate((fname) => {
        return window.__audioFeeder.setNextClipFromUrl(`/fixtures/${fname}`);
    }, path.basename(audio2Path));

    const startStopValue = page.locator('span.audio-recorder-action-text').last();
    await expect(startStopValue).toBeVisible();
    await expect(startStopValue).toHaveText(/^Start recording\s*$/i);

    // Start recording -> now getUserMedia returns audio #2
    await startStopValue.click();
    const timer2 = page.locator('.audio-recorder-timer-text');
    await expect(timer2).toBeVisible();

    //this gives you synthetic stream2 being consumed & Wait until override reports it served a stream
    // await expect.poll(async () => {
    //     const count = await page.evaluate(() => window.__audioFeeder?.servedCount ?? 0);
    //     return count;
    // }, { timeout: 5000, intervals: [100, 200, 500] }).toBeGreaterThan(beforeCount2);

    // // (Optional) check timestamp too
    // const servedAt2 = await page.evaluate(() => window.__audioFeeder?.lastServedAt ?? 0);
    // console.log('Synthetic audio2 served at:', servedAt2);

    await expect(startStopValue).toHaveText(/^Stop recording\s*$/i);

    // Let the second clip play
    await page.waitForTimeout(3000);

    // Stop recording
    await startStopValue.click();
    await expect(startStopValue).toHaveText(/^Start recording\s*$/i);

    // Fill form (personal details)
    await page.getByLabel('First name').fill('Triveni');
    await page.getByLabel('Last name').fill('Bika3');
    await page.getByLabel('Email address').fill('triveni.bika@capgemini.com');
    await page.getByLabel('Phone number').fill('+31 674325222');

    //Company details:
    await page.getByLabel('Company name').fill('Capgemini');
    await page.getByLabel('Your role').fill('AI Software Engineer');
    //const goToIndustry = page.getByRole('combobox', { name: /Industry/i });


    await page.getByRole('combobox').filter({ hasText: /Select your industry/i }).click();
    await page.getByText('Healthcare & Life Sciences').click();
    await page.getByRole('combobox').filter({ hasText: 'Select organizational area' }).click();
    await page.getByRole('option', { name: 'IT & Technology' }).click();
    await page.screenshot({ path: `./screenshots/org_${timestamp}.png` });

    await page.getByRole('button', { name: /Go to Prompt Summary/i }).click();
    await page.screenshot({ path: `./screenshots/goto_prompt_${timestamp}.png` });
});
