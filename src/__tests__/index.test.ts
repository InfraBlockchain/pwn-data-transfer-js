import path from 'path';
import fs from 'fs';

import { IcalConverter, UberTripConverter, YoutubeWatchConverter, Util, ConvertError } from '@src/lib/rdf_converter';
import PwnDataInput from '@src/index';

const outputFolderPath = 'src/__tests__/output';
const sampleFolderPath = 'src/__tests__/sample';

const sampleIcsData = fs.readFileSync(path.join(sampleFolderPath, 'calendar.ics'), {
  encoding: 'utf-8',
});
const sampleYtWatchData = fs.readFileSync(path.join(sampleFolderPath, 'yt_watch.html'), {
  encoding: 'utf-8',
});
const sampleUberTripData = fs.readFileSync(path.join(sampleFolderPath, 'uber_trips_data.csv'), {
  encoding: 'utf-8',
});
const seed = '0x8c9971953c5c82a51e3ab0ec9a16ced7054585081483e2489241b5b059f5f3cf';

describe('Module Test', () => {
  describe('Core Test', () => {
    beforeAll(() => {
      fs.rmSync(outputFolderPath, { recursive: true, force: true });
      fs.promises.mkdir(outputFolderPath, { recursive: true });
    });
    test('convert RDF', async () => {
      expect(await PwnDataInput.convertRDF(sampleIcsData, 'ical')).toBeDefined();
      expect(await PwnDataInput.convertRDF(sampleYtWatchData, 'youtube-watch')).toBeDefined();
      expect(await PwnDataInput.convertRDF(sampleUberTripData, 'uber-trip')).toBeDefined();
    });
    test('did test', async () => {
      const didSet: Record<string, any> = await PwnDataInput.initDIDSet(seed);
      expect(didSet.seed).toEqual(seed);
    });
    test('issue Credential', async () => {
      const icalJsonld = await PwnDataInput.convertRDF(sampleIcsData, 'ical', 'application/ld+json');
      const icalSignedVC = await PwnDataInput.IssueCredential('did:infra:sample', 'ical', JSON.parse(icalJsonld));
      fs.writeFileSync(path.join(outputFolderPath, 'ical.signedVC.json'), JSON.stringify(icalSignedVC, null, 2), {
        encoding: 'utf-8',
      });
      expect(icalSignedVC.proof).toBeDefined();

      const ytWatchJsonld = await PwnDataInput.convertRDF(sampleYtWatchData, 'youtube-watch', 'application/ld+json');
      const ytWatchSignedVC = await PwnDataInput.IssueCredential(
        'did:infra:sample',
        'youtube-watch',
        JSON.parse(ytWatchJsonld),
      );
      fs.writeFileSync(path.join(outputFolderPath, 'ytwatch.signedVC.json'), JSON.stringify(ytWatchSignedVC, null, 2), {
        encoding: 'utf-8',
      });
      expect(ytWatchSignedVC.proof).toBeDefined();

      const uberTripJsonld = await PwnDataInput.convertRDF(sampleUberTripData, 'uber-trip', 'application/ld+json');
      const uberTripSignedVC = await PwnDataInput.IssueCredential(
        'did:infra:sample',
        'uber-trip',
        JSON.parse(uberTripJsonld),
      );
      fs.writeFileSync(path.join(outputFolderPath, 'uber.signedVC.json'), JSON.stringify(uberTripSignedVC, null, 2), {
        encoding: 'utf-8',
      });
      expect(uberTripSignedVC.proof).toBeDefined();
    });
  });

  describe('Util', () => {
    test('getUrn', async () => {
      const urn = Util.getUrn('test', 'testevent', '');
      expect(urn.value.startsWith('urn:newnal.com:test:testevent')).toBeTruthy();
    });
  });

  describe('RDF Converters', () => {
    describe('Lib:ical Converter', () => {
      test('empty data-> ConvertError', async () => {
        await expect(async () => await IcalConverter.convert('')).rejects.toThrow(new ConvertError());
      });
      test('ical to jsonld', async () => {
        const res = await IcalConverter.convert(sampleIcsData, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'ical.jsonld'), res, {
          encoding: 'utf-8',
        });
      });
      test('ical to ttl', async () => {
        const res = await IcalConverter.convert(sampleIcsData, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'ical.ttl'), res, {
          encoding: 'utf-8',
        });
      });
    });

    describe('Lib:youtube watch history Converter', () => {
      test('empty data -> ConvertError', async () => {
        await expect(async () => await YoutubeWatchConverter.convert('')).rejects.toThrow(new ConvertError());
      });
      test('to jsonld', async () => {
        const res = await YoutubeWatchConverter.convert(sampleYtWatchData, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'ytwatch.jsonld'), res, {
          encoding: 'utf-8',
        });
      });
      test('to ttl', async () => {
        const res = await YoutubeWatchConverter.convert(sampleYtWatchData, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix schema: <http://schema.org/>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'ytwatch.ttl'), res, {
          encoding: 'utf-8',
        });
      });
    });

    describe('Lib:Uber trip csv data Converter', () => {
      test('empty data -> ConvertError', async () => {
        await expect(async () => await UberTripConverter.convert('')).rejects.toThrow(new ConvertError());
      });
      test('to jsonld', async () => {
        const res = await UberTripConverter.convert(sampleUberTripData, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'uber.jsonld'), res, {
          encoding: 'utf-8',
        });
      });
      test('to ttl', async () => {
        const res = await UberTripConverter.convert(sampleUberTripData, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix schema: <http://schema.org/>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'uber.ttl'), res, {
          encoding: 'utf-8',
        });
      });
    });
  });
});
