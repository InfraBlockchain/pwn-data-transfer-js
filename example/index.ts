import sig from './sig';
import convert from './convert';
import did from './did';

async function main(): Promise<void> {
  console.log('run sig example: ', await sig());
  console.log('run convert example: ', await convert());
  console.log('run did example: ', await did());
}

main();
