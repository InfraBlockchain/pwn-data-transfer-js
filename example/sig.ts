import fs from 'fs';
import path from 'path';
import PwnDataInput from '../dist/dev/index.esm.js';

const __filename = path.basename(import.meta.url);
const runDirect = process.argv.pop()?.includes(__filename);

const sampleFolder = 'src/__tests__/sample';
const sampleIcs = fs.readFileSync(path.join(sampleFolder, 'calendar.ics'), {
  encoding: 'utf-8',
});

async function main(): Promise<boolean> {
  await PwnDataInput.initDIDSet('0x8c9971953c5c82a51e3ab0ec9a16ced7054585081483e2489241b5b059f5f3cf');
  const rdf = await PwnDataInput.convertRDF(sampleIcs, 'ical');
  const signedVc = await PwnDataInput.IssueCredential('did:infra:example:1114', 'ical', JSON.parse(rdf));
  if (runDirect) {
    console.log(signedVc);
  }

  return !!signedVc.proof.type;
}
export default main;

if (runDirect) {
  main();
}
