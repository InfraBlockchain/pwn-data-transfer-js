import fs from 'fs';
import path from 'path';
import PwnDataInput from '../dist/dev/index.esm.js';

const __filename = path.basename(import.meta.url);
const runDirect = process.argv.pop()?.includes(__filename);
console.log('arg', process.argv.pop(), import.meta.url, __filename, runDirect);

const sampleFolder = 'src/__tests__/sample';

const sampleIcs = fs.readFileSync(path.join(sampleFolder, 'calendar.ics'), {
  encoding: 'utf-8',
});
const sampleYtWatch = fs.readFileSync(path.join(sampleFolder, 'yt_watch.html'), {
  encoding: 'utf-8',
});
const sampleUberTrip = fs.readFileSync(path.join(sampleFolder, 'uber_trips_data.csv'), {
  encoding: 'utf-8',
});

async function main(): Promise<boolean> {
  const ical = await PwnDataInput.convertRDF(sampleIcs, 'ical');
  const yt = await PwnDataInput.convertRDF(sampleYtWatch, 'youtube-watch');
  const uber = await PwnDataInput.convertRDF(sampleUberTrip, 'uber-trip');

  if (runDirect) {
    console.log('ical', ical);
    console.log('yt', yt);
    console.log('uber', uber);
  }

  return !!ical && !!yt && !!uber;
}
export default main;

if (runDirect) {
  main();
}
