import path from 'path';
import fs from 'fs';

import { IcalConverter, UberTripConverter, YoutubeWatchConverter, Util, ConvertError } from '@src/lib/rdf_converter';
import PwnDataInput from '@src/index';
import { NoDIDSetError } from '@src/lib/error';
import { Hasher, VerifiableCredential, decodeSDJWT } from 'infra-did-js';

const outputFolderPath = 'src/__tests__/output';
const sampleFolderPath = 'src/__tests__/sample';

const sampleIcs = fs.readFileSync(path.join(sampleFolderPath, 'calendar.ics'), { encoding: 'utf-8' });
const sampleYtWatch = fs.readFileSync(path.join(sampleFolderPath, 'yt_watch.html'), { encoding: 'utf-8' });
const sampleUberTrip = fs.readFileSync(path.join(sampleFolderPath, 'uber_trips_data.csv'), { encoding: 'utf-8' });
const seed = '0x8c9971953c5c82a51e3ab0ec9a16ced7054585081483e2489241b5b059f5f3cf';
const holderDID = 'did:infra:space:holder12345';
class TestClassForProtected extends PwnDataInput {
  constructor() {
    super();
  }

  static async testGetHasher(hashAlg: string): Promise<Hasher> {
    return await this.getHasher(hashAlg);
  }
}

describe('Module Test', () => {
  describe('Core Test', () => {
    let icalJsonld: Record<string, unknown>;
    let ytWatchJsonld: Record<string, unknown>;
    let uberTripJsonld: Record<string, unknown>;
    let icalSignedVC: VerifiableCredential;
    let issuerSignedSdjwt: string;
    beforeAll(async () => {
      fs.rmSync(outputFolderPath, { recursive: true, force: true });
      fs.promises.mkdir(outputFolderPath, { recursive: true });
    });

    test('convert RDF', async () => {
      icalJsonld = JSON.parse(await PwnDataInput.convertRDF(sampleIcs, 'ical'));
      ytWatchJsonld = JSON.parse(await PwnDataInput.convertRDF(sampleYtWatch, 'youtube-watch'));
      uberTripJsonld = JSON.parse(await PwnDataInput.convertRDF(sampleUberTrip, 'uber-trip'));

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
      fs.writeFileSync(path.join(outputFolderPath, 'ical.signedVC.json'), JSON.stringify(icalSignedVC, null, 2), {
        encoding: 'utf-8',
      });
      expect(icalSignedVC.proof).toBeDefined();

      const ytWatchSignedVC = await PwnDataInput.IssueCredential(
        'did:infra:sample',
        holderDID,
        'youtube-watch',
        ytWatchJsonld,
      );
      fs.writeFileSync(path.join(outputFolderPath, 'ytwatch.signedVC.json'), JSON.stringify(ytWatchSignedVC, null, 2), {
        encoding: 'utf-8',
      });
      expect(ytWatchSignedVC.proof).toBeDefined();

      const uberTripSignedVC = await PwnDataInput.IssueCredential(
        'did:infra:sample',
        holderDID,
        'uber-trip',
        uberTripJsonld,
      );
      fs.writeFileSync(path.join(outputFolderPath, 'uber.signedVC.json'), JSON.stringify(uberTripSignedVC, null, 2), {
        encoding: 'utf-8',
      });
      expect(uberTripSignedVC.proof).toBeDefined();
    });

    test('issue SDJWT', async () => {
      issuerSignedSdjwt = await PwnDataInput.issueSdJwt(icalSignedVC.toJSON());

      expect(issuerSignedSdjwt).toBeDefined();

      const decodedSDJWT = decodeSDJWT(issuerSignedSdjwt);
      expect(decodedSDJWT).toBeDefined();
    });

    test('error: issue SDJWT', async () => {
      await expect(
        async () => await PwnDataInput.issueSdJwt(icalSignedVC.toJSON(), { headerAlg: 'ES256' }),
      ).rejects.toThrow();
    });

    test('verify SDJWT', async () => {
      expect(await PwnDataInput.verifySdJwt(issuerSignedSdjwt)).toBeTruthy();
    });

    test('error: verify SDJWT', async () => {
      expect(await PwnDataInput.verifySdJwt('asdf')).toBeFalsy();

      const issuerSignedSdjwt_512 = await PwnDataInput.issueSdJwt(icalSignedVC.toJSON(), { hashAlg: 'sha-512' });
      expect(await PwnDataInput.verifySdJwt(issuerSignedSdjwt_512)).toBeFalsy();
    });

    test('for coverage', async () => {
      const hasher = await TestClassForProtected.testGetHasher('sha-256');
      expect(hasher('asdf')).toBeDefined();
      await expect(async () => await TestClassForProtected.testGetHasher('wrong-alg')).rejects.toThrow(
        'hash alg must be sha-256',
      );
    });
  });

  describe('Util', () => {
    test('getUrn', async () => {
      const urn = Util.getUrn('test', 'test-event', '');
      expect(urn.value.startsWith('urn:newnal.com:test:test-event')).toBeTruthy();
    });
  });

  describe('RDF Converters', () => {
    describe('Lib:ical Converter', () => {
      test('empty data-> ConvertError', async () => {
        await expect(async () => await IcalConverter.convert('')).rejects.toThrow(new ConvertError());
      });
      test('to jsonld', async () => {
        const res = await IcalConverter.convert(sampleIcs, 'application/ld+json');
        expect(res).toBeDefined();
        expect(JSON.stringify(res)).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'ical.jsonld'), res, {
          encoding: 'utf-8',
        });
      });
      test('to ttl', async () => {
        const res = await IcalConverter.convert(sampleIcs, 'text/turtle');
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
        const res = await YoutubeWatchConverter.convert(sampleYtWatch, 'application/ld+json');
        expect(res).toBeDefined();
        fs.writeFileSync(path.join(outputFolderPath, 'ytwatch.jsonld'), res, {
          encoding: 'utf-8',
        });
        expect(JSON.stringify(res)).toBeTruthy();
      });
      test('to ttl', async () => {
        const res = await YoutubeWatchConverter.convert(sampleYtWatch, 'text/turtle');
        expect(res).toBeDefined();
        fs.writeFileSync(path.join(outputFolderPath, 'ytwatch.ttl'), res, {
          encoding: 'utf-8',
        });
        expect(res.includes('@prefix schema: <http://schema.org/>.')).toBeTruthy();
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
        fs.writeFileSync(path.join(outputFolderPath, 'uber.jsonld'), res, {
          encoding: 'utf-8',
        });
      });
      test('to ttl', async () => {
        const res = await UberTripConverter.convert(sampleUberTrip, 'text/turtle');
        expect(res).toBeDefined();
        expect(res.includes('@prefix schema: <http://schema.org/>.')).toBeTruthy();
        fs.writeFileSync(path.join(outputFolderPath, 'uber.ttl'), res, {
          encoding: 'utf-8',
        });
      });
    });
  });
});
