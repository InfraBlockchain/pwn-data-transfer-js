import path from 'path';
import fs from 'fs';

import { IcalConverter, UberTripConverter, YoutubeWatchConverter, Util, ConvertError } from '@src/lib/rdf_converter';
import PwnDataInput from '@src/index';
import { NoDIDSetError } from '@src/lib/error';
import { Hasher, VerifiableCredential, decodeSDJWT } from 'infra-did-js';

const outputFolderPath = 'src/__tests__/output';
const sampleFolderPath = 'src/__tests__/sample';

const icsData = fs.readFileSync(path.join(sampleFolderPath, 'calendar.ics'), { encoding: 'utf-8' });
const ytWatchData = fs.readFileSync(path.join(sampleFolderPath, 'yt_watch.html'), { encoding: 'utf-8' });
const uberTripData = fs.readFileSync(path.join(sampleFolderPath, 'uber_trips_data.csv'), { encoding: 'utf-8' });
const seed = '0x8c9971953c5c82a51e3ab0ec9a16ced7054585081483e2489241b5b059f5f3cf';
const holderDID = 'did:infra:space:holder12345';
class ProtectedTest extends PwnDataInput {
  constructor() {
    super();
  }

  static async testGetHasher(hashAlg: string): Promise<Hasher> {
    return await this.getHasher(hashAlg);
  }
}

describe('Module Test', () => {
  describe('Util', () => {
    test('getUrn', () => {
      expect(Util.getUrn('test', 'test-event', '').value.startsWith('urn:newnal.com:test:test-event')).toBeTruthy();
    });
  });

  describe('RDF Converters', () => {
    describe('Lib:ical Converter', () => {
      test('error: empty data', async () => {
        await expect(async () => await IcalConverter.convert('')).rejects.toThrow(new ConvertError());
      });

      test('to jsonld', async () => {
        const res = await IcalConverter.convert(icsData, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'ical.jsonld'), res, { encoding: 'utf-8' });
      });

      test('to ttl', async () => {
        const res = await IcalConverter.convert(icsData, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'ical.ttl'), res, { encoding: 'utf-8' });
      });
    });

    describe('Lib:youtube watch history Converter', () => {
      test('error:empty data', async () => {
        await expect(async () => await YoutubeWatchConverter.convert('')).rejects.toThrow(new ConvertError());
      });

      test('to jsonld', async () => {
        const res = await YoutubeWatchConverter.convert(ytWatchData, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'ytwatch.jsonld'), res, { encoding: 'utf-8' });
      });

      test('to ttl', async () => {
        const res = await YoutubeWatchConverter.convert(ytWatchData, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix schema: <http://schema.org/>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'ytwatch.ttl'), res, { encoding: 'utf-8' });
      });
    });

    describe('Lib:Uber trip csv data Converter', () => {
      test('empty data -> ConvertError', async () => {
        await expect(async () => await UberTripConverter.convert('')).rejects.toThrow(new ConvertError());
      });

      test('to jsonld', async () => {
        const res = await UberTripConverter.convert(uberTripData, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'uber.jsonld'), res, { encoding: 'utf-8' });
      });

      test('to ttl', async () => {
        const res = await UberTripConverter.convert(uberTripData, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix schema: <http://schema.org/>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'uber.ttl'), res, { encoding: 'utf-8' });
      });
    });
  });

  describe('Core Test', () => {
    let icalJsonld: Record<string, unknown>;
    let ytWatchJsonld: Record<string, unknown>;
    let uberTripJsonld: Record<string, unknown>;
    let icalSignedVC: VerifiableCredential;
    let uberTripSignedVC: VerifiableCredential;
    let ytWatchSignedVC: VerifiableCredential;
    let icalSdjwt: string;
    let uberTripSdjwt: string;
    let ytWatchSdjwt: string;

    beforeAll(async () => {
      fs.rmSync(outputFolderPath, { recursive: true, force: true });
      fs.promises.mkdir(outputFolderPath, { recursive: true });
    });

    test('convert RDF', async () => {
      icalJsonld = JSON.parse(await PwnDataInput.convertRDF(icsData, 'ical'));
      ytWatchJsonld = JSON.parse(await PwnDataInput.convertRDF(ytWatchData, 'youtube-watch'));
      uberTripJsonld = JSON.parse(await PwnDataInput.convertRDF(uberTripData, 'uber-trip'));

      expect(icalJsonld).toBeDefined();
      expect(ytWatchJsonld).toBeDefined();
      expect(uberTripJsonld).toBeDefined();
    });

    test('error: sign before init DID', async () => {
      await expect(
        async () => await PwnDataInput.IssueCredential('did:infra:sample', holderDID, 'ical', icalJsonld),
      ).rejects.toThrow(new NoDIDSetError());
    });

    test('did test', async () => {
      await PwnDataInput.initDIDSet(seed);
      expect(PwnDataInput.didSet.seed).toEqual(seed);
    });

    test('issue Credential', async () => {
      icalSignedVC = await PwnDataInput.IssueCredential('did:infra:sample', holderDID, 'ical', icalJsonld);
      expect(icalSignedVC.proof).toBeDefined();
      fs.writeFileSync(path.join(outputFolderPath, 'ical.signedVC.json'), JSON.stringify(icalSignedVC, null, 2), {
        encoding: 'utf-8',
      });

      ytWatchSignedVC = await PwnDataInput.IssueCredential(
        'did:infra:sample',
        holderDID,
        'youtube-watch',
        ytWatchJsonld,
      );
      expect(ytWatchSignedVC.proof).toBeDefined();
      fs.writeFileSync(path.join(outputFolderPath, 'ytwatch.signedVC.json'), JSON.stringify(ytWatchSignedVC, null, 2), {
        encoding: 'utf-8',
      });

      uberTripSignedVC = await PwnDataInput.IssueCredential('did:infra:sample', holderDID, 'uber-trip', uberTripJsonld);
      expect(uberTripSignedVC.proof).toBeDefined();
      fs.writeFileSync(path.join(outputFolderPath, 'uber.signedVC.json'), JSON.stringify(uberTripSignedVC, null, 2), {
        encoding: 'utf-8',
      });
    });

    test('issue SDJWT', async () => {
      icalSdjwt = await PwnDataInput.issueSdJwt(icalSignedVC.toJSON());
      expect(icalSdjwt).toBeDefined();
      fs.writeFileSync(path.join(outputFolderPath, 'ical.sdjwt.txt'), icalSdjwt, { encoding: 'utf-8' });
      const icalDecodedSDJWT = decodeSDJWT(icalSdjwt);
      expect(icalDecodedSDJWT).toBeDefined();
      fs.writeFileSync(
        path.join(outputFolderPath, 'ical.sdjwt.decoded.json'),
        JSON.stringify(icalDecodedSDJWT, null, 2),
        { encoding: 'utf-8' },
      );

      ytWatchSdjwt = await PwnDataInput.issueSdJwt(ytWatchSignedVC.toJSON());
      expect(ytWatchSdjwt).toBeDefined();
      fs.writeFileSync(path.join(outputFolderPath, 'ytwatch.sdjwt.txt'), ytWatchSdjwt, { encoding: 'utf-8' });
      const ytWatchDecodedSDJWT = decodeSDJWT(ytWatchSdjwt);
      expect(ytWatchDecodedSDJWT).toBeDefined();
      fs.writeFileSync(
        path.join(outputFolderPath, 'ytwatch.sdjwt.decoded.json'),
        JSON.stringify(ytWatchDecodedSDJWT, null, 2),
        { encoding: 'utf-8' },
      );

      uberTripSdjwt = await PwnDataInput.issueSdJwt(uberTripSignedVC.toJSON());
      expect(uberTripSdjwt).toBeDefined();
      fs.writeFileSync(path.join(outputFolderPath, 'uber.sdjwt.txt'), uberTripSdjwt, { encoding: 'utf-8' });
      const uberTripDecodedSDJWT = decodeSDJWT(uberTripSdjwt);
      expect(uberTripDecodedSDJWT).toBeDefined();
      fs.writeFileSync(
        path.join(outputFolderPath, 'uber.sdjwt.decoded.json'),
        JSON.stringify(uberTripDecodedSDJWT, null, 2),
        { encoding: 'utf-8' },
      );
    });

    test('error: issue SDJWT', async () => {
      await expect(
        async () => await PwnDataInput.issueSdJwt(icalSignedVC.toJSON(), { headerAlg: 'ES256' }),
      ).rejects.toThrow();
    });

    test('verify SDJWT', async () => {
      expect(await PwnDataInput.verifySdJwt('asdf')).toBeFalsy();
      expect(await PwnDataInput.verifySdJwt(icalSdjwt)).toBeTruthy();
    });

    test('error: verify SDJWT(not supported hash alg)', async () => {
      const issuerSignedSdjwt_512 = await PwnDataInput.issueSdJwt(icalSignedVC.toJSON(), { hashAlg: 'sha-512' });
      expect(await PwnDataInput.verifySdJwt(issuerSignedSdjwt_512)).toBeFalsy();
    });

    test('getHasher standalone', async () => {
      const hasher = await ProtectedTest.testGetHasher('sha-256');
      expect(hasher('asdf')).toBeDefined();
    });
  });
});
