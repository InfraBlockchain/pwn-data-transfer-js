import path from 'path';
import fs from 'fs';
import PwnDataInput from '../index';
import { ConvertError } from '../lib/error';
import Util from '../lib/util';

import IcalConverter from '../lib/rdf_converter/ical2rdf';
import YoutubeWatchConverter from '../lib/rdf_converter/ytwatch2rdf';
import UberTripConverter from '../lib/rdf_converter/ubertrip2rdf';

jest.setTimeout(1000 * 60 * 10);

const outputFolder = 'src/__tests__/output';
const sampleFolder = 'src/__tests__/sample';

const sampleIcs = fs.readFileSync(path.join(sampleFolder, 'calendar.ics'), {
  encoding: 'utf-8'
});
const sampleYtWatch = fs.readFileSync(path.join(sampleFolder, 'yt_watch.html'), {
  encoding: 'utf-8'
});
const sampleUberTrip = fs.readFileSync(path.join(sampleFolder, 'uber_trips_data.csv'), {
  encoding: 'utf-8'
});

describe('Module Test', () => {
  describe('Core Test', () => {
    beforeAll(() => {
      fs.rmSync(outputFolder, { recursive: true, force: true });
      fs.promises.mkdir(outputFolder, { recursive: true });
    });
    test('func', () => {
      const cls = new PwnDataInput();
      const res = cls.test();
      expect(res).toBeDefined();
    });
    test('convert Ical', async () => {
      const res = await PwnDataInput.convertIcal(sampleIcs);
      expect(res).toBeDefined();
    });
    test('convert yt watched', async () => {
      const res = await PwnDataInput.convertYtWatched(sampleYtWatch);
      expect(res).toBeDefined();
    });
  });

  describe('Util', () => {
    test('getUrn', async () => {
      const urn = Util.getUrn('test', 'testevent');
      expect(urn.toString().startsWith('urn:test:testevent'));
    });
  });

  describe('RDF Converters', () => {

    describe('Lib:ical Converter', () => {
      test('ical empty data', async () => {
        await expect(async () => await IcalConverter.convert('')).rejects.toThrow(new ConvertError());
      });
      test('ical to jsonld', async () => {
        const res = await IcalConverter.convert(sampleIcs, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolder, 'ical.jsonld'), res, {
          encoding: 'utf-8'
        });
      });
      test('ical to ttl', async () => {
        const res = await IcalConverter.convert(sampleIcs, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolder, 'ical.ttl'), res, {
          encoding: 'utf-8'
        });
      });
    });

    describe('Lib:youtube watch history Converter', () => {
      test('empty data', async () => {
        await expect(async () => await YoutubeWatchConverter.convert('')).rejects.toThrow(new ConvertError());
      });
      test('to jsonld', async () => {
        const res = await YoutubeWatchConverter.convert(sampleYtWatch, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolder, 'ytwatch.jsonld'), res, {
          encoding: 'utf-8'
        });
      });
      test('to ttl', async () => {
        const res = await YoutubeWatchConverter.convert(sampleYtWatch, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix wd: <http://www.wikidata.org/entity/>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolder, 'ytwatch.ttl'), res, {
          encoding: 'utf-8'
        });
      });
    });

    describe('Lib:Uber trip csv data Converter', () => {

      test('empty data', async () => {
        await expect(async () => await UberTripConverter.convert('')).rejects.toThrow(new ConvertError());
      });
      test('to jsonld', async () => {
        const res = await UberTripConverter.convert(sampleUberTrip, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolder, 'uber.jsonld'), res, {
          encoding: 'utf-8'
        });
      });
      test('to ttl', async () => {
        const res = await UberTripConverter.convert(sampleUberTrip, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix newn: <https://newnal.com/ontology/>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolder, 'uber.ttl'), res, {
          encoding: 'utf-8'
        });
      });
    });
  });


});
