import path from 'path';
import fs from 'fs';

import { IcalConverter, UberTripConverter, YoutubeWatchConverter, Util, ConvertError } from '@src/lib/rdf_converter';
import PwnDataInput from '@src/index';

const outputFolder = 'src/__tests__/output';
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
const seed = '0x8c9971953c5c82a51e3ab0ec9a16ced7054585081483e2489241b5b059f5f3cf';

describe('Module Test', () => {
  describe('Core Test', () => {
    beforeAll(() => {
      fs.rmSync(outputFolder, { recursive: true, force: true });
      fs.promises.mkdir(outputFolder, { recursive: true });
    });
    test('function', () => {
      expect(PwnDataInput.test()).toBeDefined();
    });
    test('convert RDF', async () => {
      expect(await PwnDataInput.convertRDF(sampleIcs, 'ical')).toBeDefined();
      expect(await PwnDataInput.convertRDF(sampleYtWatch, 'youtube-watch')).toBeDefined();
      expect(await PwnDataInput.convertRDF(sampleUberTrip, 'uber-trip')).toBeDefined();
    });
    test('did test', async () => {
      const didSet: Record<string, any> = await PwnDataInput.getDIDSet(seed);
      expect(didSet.seed).toEqual(seed);
    });
    test('issue Credential', async () => {
      const icalJsonld = await PwnDataInput.convertRDF(sampleIcs, 'ical');
      const signedVC = await PwnDataInput.IssueCredential('did:infra:sample', 'ical', JSON.parse(icalJsonld));
      fs.writeFileSync(path.join(outputFolder, 'ical.signedVC.json'), JSON.stringify(signedVC, null, 2), {
        encoding: 'utf-8',
      });
      expect(signedVC.proof).toBeDefined();
    });
  });

  describe('Util', () => {
    test('getUrn', async () => {
      const urn = Util.getUrn('test', 'testevent');
      expect(urn.value.startsWith('urn:newnal.com:test:testevent')).toBeTruthy();
    });
  });

  describe('RDF Converters', () => {
    describe('Lib:ical Converter', () => {
      test('empty data-> ConvertError', async () => {
        await expect(async () => await IcalConverter.convert('')).rejects.toThrow(new ConvertError());
      });
      test('ical to jsonld', async () => {
        const res = await IcalConverter.convert(sampleIcs, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolder, 'ical.jsonld'), res, {
          encoding: 'utf-8',
        });
      });
      test('ical to ttl', async () => {
        const res = await IcalConverter.convert(sampleIcs, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolder, 'ical.ttl'), res, {
          encoding: 'utf-8',
        });
      });
    });

    describe('Lib:youtube watch history Converter', () => {
      test('empty data -> ConvertError', async () => {
        await expect(async () => await YoutubeWatchConverter.convert('')).rejects.toThrow(new ConvertError());
      });
      test('to jsonld', async () => {
        const res = await YoutubeWatchConverter.convert(sampleYtWatch, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolder, 'ytwatch.jsonld'), res, {
          encoding: 'utf-8',
        });
      });
      test('to ttl', async () => {
        const res = await YoutubeWatchConverter.convert(sampleYtWatch, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix wd: <http://www.wikidata.org/entity/>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolder, 'ytwatch.ttl'), res, {
          encoding: 'utf-8',
        });
      });
    });

    describe('Lib:Uber trip csv data Converter', () => {
      test('empty data -> ConvertError', async () => {
        await expect(async () => await UberTripConverter.convert('')).rejects.toThrow(new ConvertError());
      });
      test('to jsonld', async () => {
        const res = await UberTripConverter.convert(sampleUberTrip, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolder, 'uber.jsonld'), res, {
          encoding: 'utf-8',
        });
      });
      test('to ttl', async () => {
        const res = await UberTripConverter.convert(sampleUberTrip, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix newn: <https://newnal.com/ontology/>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolder, 'uber.ttl'), res, {
          encoding: 'utf-8',
        });
      });
    });
  });
});
