import IcalConverter from '../lib/ical2rdf';
import YoutubeWatchHistoryConverter from '../lib/ytwatch2rdf';
import { ConvertError } from '../lib/error';
import PwnDataInput from '../index';
import fs from 'fs';
import path from 'path';

jest.setTimeout(1000 * 60 * 10);

const outputFolder = 'src/__tests__/output';
const sampleIcs = fs.readFileSync('src/__tests__/sample/calendar.ics', {
  encoding: 'utf-8'
});
const sampleYtWatch = fs.readFileSync('src/__tests__/sample/ytwatch.html', {
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
      await expect(async () => await YoutubeWatchHistoryConverter.convert('')).rejects.toThrow(new ConvertError());
    });
    test('to jsonld', async () => {
      const res = await YoutubeWatchHistoryConverter.convert(sampleYtWatch, 'application/ld+json');
      expect(res).toBeDefined();
      expect(JSON.stringify(res)).toBeTruthy();
      fs.writeFileSync(path.join(outputFolder, 'ytwatch.jsonld'), res, {
        encoding: 'utf-8'
      });
    });
    test('to ttl', async () => {
      const res = await YoutubeWatchHistoryConverter.convert(sampleYtWatch, 'text/turtle');
      expect(res).toBeDefined();
      expect(res.includes('@prefix wd: <http://www.wikidata.org/entity/>.')).toBeTruthy();
      fs.writeFileSync(path.join(outputFolder, 'ytwatch.ttl'), res, {
        encoding: 'utf-8'
      });
    });
  });
});
