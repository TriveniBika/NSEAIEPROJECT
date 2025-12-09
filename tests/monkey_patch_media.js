
// --- Add this function to your test file and call before interacting with record controls ---
async function injectAudioFeeder(page) {
    await page.addInitScript(() => {
        // A tiny in-page audio feeder that hijacks getUserMedia and returns our synthetic stream.
        (function () {
            const state = {
                // The next audio buffer we want to use (ArrayBuffer or Float32Array)
                nextClipBytes: null,
                // Optional: sampleRate override
                sampleRate: null,
                // Whether we should return microphone (original getUserMedia) instead of synthetic
                passThrough: false,
            };

            // Keep a reference to the original gUM
            const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

            async function bytesToBuffer(audioBytes) {
                const ctx = new (window.AudioContext || window.webkitAudioContext)({
                    sampleRate: state.sampleRate || undefined,
                });
                const audioBuffer = await ctx.decodeAudioData(
                    audioBytes instanceof ArrayBuffer ? audioBytes : audioBytes.buffer
                );

                // Make a stream from the decoded buffer
                const destination = ctx.createMediaStreamDestination();
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(destination);
                // Start immediately; the page's recorder will catch it as soon as it gets the stream
                source.start(0);

                // Attach helpers so we can stop if needed
                destination.stream.__audioFeeder = { ctx, source, destination };
                return destination.stream;
            }

            // Public API on window to configure the next clip
            window.__audioFeeder = {
                /**
                 * Provide next audio clip via URL that the page can fetch (CORS must allow)
                 * @param {string} url
                 * @param {number=} sampleRate
                 */
                async setNextClipFromUrl(url, sampleRate) {
                    state.sampleRate = sampleRate || null;
                    const resp = await fetch(url);
                    const buf = await resp.arrayBuffer();
                    state.nextClipBytes = buf;
                    state.passThrough = false;
                },

                /**
                 * Provide next audio clip via raw bytes (Base64 string of WAV/MP3)
                 * @param {string} base64
                 * @param {number=} sampleRate
                 */
                async setNextClipFromBase64(base64, sampleRate) {
                    state.sampleRate = sampleRate || null;
                    const bin = atob(base64);
                    const len = bin.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
                    state.nextClipBytes = bytes.buffer;
                    state.passThrough = false;
                },

                /**
                 * Temporarily disable synthetic audio (use real mic if available)
                 */
                enablePassThrough() {
                    state.passThrough = true;
                },

                /**
                 * Stop current synthetic audio (if any)
                 */
                stop() {
                    try {
                        const s = window.__lastSyntheticStream;
                        if (s && s.__audioFeeder) {
                            s.__audioFeeder.source.stop();
                            s.__audioFeeder.ctx.close();
                        }
                    } catch { }
                }
            };

            // Override getUserMedia
            navigator.mediaDevices.getUserMedia = async function (constraints) {
                // If user asked for audio and we have a next clip prepared, return synthetic
                const wantAudio =
                    constraints && (constraints.audio === true || typeof constraints.audio === 'object');

                if (wantAudio && !state.passThrough && state.nextClipBytes) {
                    const stream = await bytesToBuffer(state.nextClipBytes);
                    // remember last stream; clear the next clip so we don't reuse it accidentally
                    window.__lastSyntheticStream = stream;
                    state.nextClipBytes = null;
                    return stream;
                }

                // Otherwise fallback to original
                return originalGetUserMedia(constraints);
            };
        })();
    });
}