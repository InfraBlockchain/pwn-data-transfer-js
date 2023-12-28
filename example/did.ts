import path from 'path';
import PwnDataInput from '../dist/dev/index.esm.js';

const __filename = path.basename(import.meta.url);
const runDirect = process.argv.pop()?.includes(__filename);

const seed = '0x8c9971953c5c82a51e3ab0ec9a16ced7054585081483e2489241b5b059f5f3cf';
async function main(): Promise<boolean> {
  const didSet = await PwnDataInput.initDIDSet(seed);
  if (runDirect) {
    console.log(didSet);
  }

  return didSet.seed === seed;
}
export default main;

if (runDirect) {
  main();
}
