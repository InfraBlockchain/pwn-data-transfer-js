import sig from './sig.js';
import convert from './convert.js';
import did from './did.js';
import sdJwt from './sd-jwt.js';

async function main() {
  console.log(`run did example: `);
  console.log(await did());
  console.log(`run convert example: `);
  console.log(await convert());
  console.log(`run sig example: `);
  console.log(await sig());
  console.log(`run sd-jwt example: `);
  console.log(await sdJwt());
}

main();
