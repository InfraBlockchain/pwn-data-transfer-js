import sig from './sig.js';
import convert from './convert.js';
import did from './did.js';
import sdJwt from './sd-jwt.js';

async function main() {
  let exit = true;
  let res = false;
  console.log(`run did example: `);
  res = await did();
  exit &&= res;
  console.log(res);
  console.log(`run convert example: `);
  res = await convert();
  exit &&= res;
  console.log(res);
  console.log(`run sig example: `);
  res = await sig();
  exit &&= res;
  console.log(res);
  console.log(`run sd-jwt example: `);
  res = await sdJwt();
  exit &&= res;

  if (!exit) {
    throw new Error(`Example Failed`);
  }
}

main();
