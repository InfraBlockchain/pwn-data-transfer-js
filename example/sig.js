import fs from 'fs';
import path from 'path';
import PwnDataInput from '../dist/dev/index.esm.js';

const __filename = path.basename(import.meta.url);
const runDirect = process.argv.pop()?.includes(__filename);

const outputFolderPath = `src/__tests__/output`;

const sampleIcs = fs.readFileSync(path.join(outputFolderPath, `ical`, `all.jsonld`), { encoding: `utf-8` });

async function main() {
  await PwnDataInput.initDIDSet(`0x8c9971953c5c82a51e3ab0ec9a16ced7054585081483e2489241b5b059f5f3cf`);
  const signedVc = await PwnDataInput.IssueCredential(
    `did:infra:example:1114`,
    `did:infra:space:holder12345`,
    `ical`,
    JSON.parse(sampleIcs),
  );
  if (runDirect) {
    console.log(signedVc);
  }

  return !!signedVc.proof.type;
}
export default main;

if (runDirect) {
  main();
}
