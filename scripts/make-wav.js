// scripts/make-wav.js - this .js creates speak text or export it to a WAV file on mac/windows [on linux not supported]
const say = require('say');
const fs = require('fs');
const path = require('path');

// 1) Your speech text (change this to any phrase you need)
const businessOpportunity = 'AI-powered traffic flow prediction and dynamic routing for urban mobility in cities like Amsterdam, Utrecht, and Rotterdam';
const businessValue = "Improves commuter experience, reduces congestion and emissions, and aligns with Dutch smart-city initiatives";

// 2) Output folder + file
const outDir = path.resolve(__dirname, '../fixtures');
// const fileOpp   = path.join(outDir, 'business_opportunity.wav');
// const fileVal   = path.join(outDir, 'business_value.wav');

const fileOpp   = path.join(outDir, 'BO_trafficeAI.wav');
const fileVal   = path.join(outDir, 'BV_improveimpactAI.wav');

// 3) Ensure fixtures/ exists
fs.mkdirSync(outDir, { recursive: true });

// 4)  Helper to export one WAV
function exportWav(text, outFile, voice = null, speed = 1.0) {
  return new Promise((resolve, reject) => {
    say.export(text, voice, speed, outFile, (err) => {
      if (err) return reject(err);
      resolve(outFile);
    });
  });
}


(async () => {
  try {
    // 4a) Export both files (sequential for stability)  | valid system voice name?  | On macOS you can list voices with [say -v "?"] 
    const oppPath = await exportWav(businessOpportunity, fileOpp, /*voice*/ null, /*speed*/ 1.0);
    const valPath = await exportWav(businessValue,       fileVal, /*voice*/ null, /*speed*/ 1.0);

    console.log('WAVs saved:', oppPath, 'and', valPath);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create WAV audio files:', err);
    process.exit(1);
  }
})();


// 4a.  Export to WAV (voice=null picks system default; speed=1.0 is normal speed)
//4a1. say.export(text, voiceOrNull, speedNumber, filename, callback) — only one file per call. Your call passes six arguments
// say.export(businessOpportunity,null, 1.0, fileOpp, (err) => {
//   if (err) {
//     console.error('Failed to create WAV audio files:', err);
//     process.exit(1);
//   }
//   console.log('WAV saved at:', fileOpp);
// });

//NOTE: On Linux export isn’t supported; 
//  for Linux CI, use a cloud TTS (Azure/Google) to synthesize WAVs instead.
