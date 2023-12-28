import sig from './sig';
import convert from './convert';
import did from './did';

async function main(): Promise<void> {
  console.log('sig', await sig());
  console.log('convert', await convert());
  console.log('did', await did());
}

main();
