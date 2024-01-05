import { Hasher } from 'infra-did-js';
import PwnDataInput from '@src/index';
import path from 'path';
import fs from 'fs';
import { PeriodUnit } from '@src/lib/interface';
import { ConvertError } from '@src/lib/rdf_converter';
import { Converter } from '@src/lib/rdf_converter/converter.interface';

const OUTPUT_PATH = path.join(`src/__tests__/output`);
const INPUT_PATH = `src/__tests__/sample`;
export class TestHelper extends PwnDataInput {
  static CONST = {
    OUTPUT_PATH,
    INPUT_PATH,
    ICS_SAMPLE: fs.readFileSync(path.join(INPUT_PATH, `calendar.ics`), { encoding: `utf-8` }),
    YT_WATCH_SAMPLE: fs.readFileSync(path.join(INPUT_PATH, `yt_watch.html`), { encoding: `utf-8` }),
    UBER_TRIP_SAMPLE: fs.readFileSync(path.join(INPUT_PATH, `uber_trips_data.csv`), { encoding: `utf-8` }),
    SEED: `0x8c9971953c5c82a51e3ab0ec9a16ced7054585081483e2489241b5b059f5f3cf`,
    HOLDER_DID: `did:infra:space:holder12345`,
  };

  static async testGetHasher(hashAlg: string): Promise<Hasher> {
    return await this.getHasher(hashAlg);
  }

  static rdfConverterTester(
    IConverter: typeof Converter,
    rawData: string,
    prefix: string,
  ): { emptyTest: () => void; jsonTest: () => void; ttlTest: () => void } {
    return {
      emptyTest: async () => {
        await expect(async () => await IConverter.convert(``)).rejects.toThrow(new ConvertError());
      },
      jsonTest: async () => {
        for (const unit of Object.values(PeriodUnit)) {
          const results = await IConverter.convert(rawData, unit);
          expect(results.periodUnit).toBeDefined();
          Object.entries(results.serializes).forEach(([period, data]) => {
            fs.writeFileSync(path.join(TestHelper.CONST.OUTPUT_PATH, prefix, `${period}.jsonld`), data, {
              encoding: `utf-8`,
            });
            expect(JSON.stringify(data)).toBeTruthy();
          });
        }
      },
      ttlTest: async () => {
        for (const unit of Object.values(PeriodUnit)) {
          const results = await IConverter.convert(rawData, unit as PeriodUnit, `text/turtle`);
          expect(results.periodUnit).toBeDefined();
          Object.entries(results.serializes).forEach(([period, data]) => {
            fs.writeFileSync(path.join(TestHelper.CONST.OUTPUT_PATH, prefix, `${period}.ttl`), data, {
              encoding: `utf-8`,
            });
            expect(data.includes(`@prefix`)).toBeTruthy();
          });
        }
      },
    };
  }
}
