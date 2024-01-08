import fs from 'fs';
import path from 'path';
import PwnDataInput from '../dist/dev/index.esm.js';
import { decodeSDJWT } from 'infra-did-js';

const __filename = path.basename(import.meta.url);
const runDirect = process.argv.pop()?.includes(__filename);

const outputFolderPath = `src/__tests__/output`;

const sampleIcs = fs.readFileSync(path.join(outputFolderPath, `ical.signedVC.json`), { encoding: `utf-8` });

async function main() {
  await PwnDataInput.initDIDSet(`0x8c9971953c5c82a51e3ab0ec9a16ced7054585081483e2489241b5b059f5f3cf`);
  const icalSignedVC = JSON.parse(sampleIcs);
  const icalSdjwt = await PwnDataInput.issueSdJwt(icalSignedVC);
  const icalDecodedSDJWT = decodeSDJWT(icalSdjwt);
  if (runDirect) {
    console.log(icalSdjwt);
    console.log(icalDecodedSDJWT);
    console.log(!!icalDecodedSDJWT.unverifiedInputSdJwt[`credentialSubject`][`newn:data`]);
  }

  return !!icalDecodedSDJWT.unverifiedInputSdJwt[`credentialSubject`][`newn:data`];
}
export default main;

if (runDirect) {
  main();
}
