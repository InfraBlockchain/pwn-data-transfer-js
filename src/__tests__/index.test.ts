import path from 'path';
import fs from 'fs';

import { IcalConverter, UberTripConverter, YoutubeWatchConverter, Util } from '@src/lib/rdf_converter';
import PwnDataInput from '@src/index';
import { NoDIDSetError } from '@src/lib/error';
import { HexString, VerifiableCredential, decodeSDJWT } from 'infra-did-js';
import { TestHelper } from './test.module';
import { Converter } from '@src/lib/rdf_converter/converter.interface';

describe(`Module Test`, () => {
  beforeAll(async () => {
    fs.rmSync(TestHelper.CONST.OUTPUT_PATH, { recursive: true, force: true });
  });

  describe(`Util`, () => {
    test(`standalone getUrn`, () => {
      expect(
        Util.getUrnNamedNode(`test`, `test-event`, ``).value.startsWith(`urn:newnal.com:test:test-event`),
      ).toBeTruthy();
    });
    test(`standalone Converter`, async () => {
      await expect(async () => await Converter.convert(``)).rejects.toThrow();
    });
  });

  describe(`RDF Converters`, () => {
    describe(`Lib:ical Converter`, () => {
      const prefix = `ical`;
      const rawData = TestHelper.CONST.ICS_SAMPLE;
      const tester = TestHelper.rdfConverterTester(IcalConverter, rawData, prefix);
      beforeAll(async () => {
        await fs.promises.mkdir(path.join(TestHelper.CONST.OUTPUT_PATH, prefix), { recursive: true });
      });
      // eslint-disable-next-line jest/expect-expect
      test(`error:empty data`, tester.emptyTest);
      // eslint-disable-next-line jest/expect-expect
      test(`jsonld`, tester.jsonTest);
      // eslint-disable-next-line jest/expect-expect
      test(`to ttl`, tester.ttlTest);
    });

    describe(`Lib:youtube watch history Converter`, () => {
      const prefix = `ytWatch/`;
      const rawData = TestHelper.CONST.YT_WATCH_SAMPLE;
      const tester = TestHelper.rdfConverterTester(YoutubeWatchConverter, rawData, prefix);
      beforeAll(async () => {
        await fs.promises.mkdir(path.join(TestHelper.CONST.OUTPUT_PATH, prefix), { recursive: true });
      });
      // eslint-disable-next-line jest/expect-expect
      test(`error:empty data`, tester.emptyTest);
      // eslint-disable-next-line jest/expect-expect
      test(`jsonld`, tester.jsonTest);
      // eslint-disable-next-line jest/expect-expect
      test(`to ttl`, tester.ttlTest);
    });

    describe(`Lib:Uber trip csv data Converter`, () => {
      const prefix = `uberTrip/`;
      const rawData = TestHelper.CONST.UBER_TRIP_SAMPLE;
      const tester = TestHelper.rdfConverterTester(UberTripConverter, rawData, prefix);
      beforeAll(async () => {
        await fs.promises.mkdir(path.join(TestHelper.CONST.OUTPUT_PATH, prefix), { recursive: true });
      });
      // eslint-disable-next-line jest/expect-expect
      test(`error:empty data`, tester.emptyTest);
      // eslint-disable-next-line jest/expect-expect
      test(`jsonld`, tester.jsonTest);
      // eslint-disable-next-line jest/expect-expect
      test(`to ttl`, tester.ttlTest);
    });
  });

  describe(`Core Test`, () => {
    let icalJsonld: Record<string, unknown>;
    let ytWatchJsonld: Record<string, unknown>;
    let uberTripJsonld: Record<string, unknown>;
    let icalSignedVC: VerifiableCredential;
    let uberTripSignedVC: VerifiableCredential;
    let ytWatchSignedVC: VerifiableCredential;
    let icalSdjwt: string;
    let uberTripSdjwt: string;
    let ytWatchSdjwt: string;

    test(`convert RDF`, async () => {
      const icalRdfs = await PwnDataInput.convertRDF(TestHelper.CONST.ICS_SAMPLE, `ical`);
      icalJsonld = JSON.parse(icalRdfs.serializes[`all`]);
      expect(icalJsonld).toBeDefined();

      const ytWatchRdfs = await PwnDataInput.convertRDF(TestHelper.CONST.YT_WATCH_SAMPLE, `youtube-watch`);
      ytWatchJsonld = JSON.parse(ytWatchRdfs.serializes[`all`]);
      expect(ytWatchJsonld).toBeDefined();

      const uberTripRdfs = await PwnDataInput.convertRDF(TestHelper.CONST.UBER_TRIP_SAMPLE, `uber-trip`);
      uberTripJsonld = JSON.parse(uberTripRdfs.serializes[`all`]);
      expect(uberTripJsonld).toBeDefined();
    });

    test(`error: sign before init DID`, async () => {
      await expect(
        async () =>
          await PwnDataInput.IssueCredential(`did:infra:sample`, TestHelper.CONST.HOLDER_DID, `ical`, icalJsonld),
      ).rejects.toThrow(new NoDIDSetError());
    });

    test(`did test`, async () => {
      await PwnDataInput.initDIDSet(TestHelper.CONST.SEED as HexString);
      expect(PwnDataInput.didSet.seed).toEqual(TestHelper.CONST.SEED);
    });

    test(`issue Credential`, async () => {
      icalSignedVC = await PwnDataInput.IssueCredential(
        `did:infra:sample`,
        TestHelper.CONST.HOLDER_DID,
        `ical`,
        icalJsonld,
      );
      fs.writeFileSync(
        path.join(TestHelper.CONST.OUTPUT_PATH, `ical.signedVC.json`),
        JSON.stringify(icalSignedVC, null, 2),
        {
          encoding: `utf-8`,
        },
      );
      expect(icalSignedVC.proof).toBeDefined();

      ytWatchSignedVC = await PwnDataInput.IssueCredential(
        `did:infra:sample`,
        TestHelper.CONST.HOLDER_DID,
        `youtube-watch`,
        ytWatchJsonld,
      );
      fs.writeFileSync(
        path.join(TestHelper.CONST.OUTPUT_PATH, `ytWatch.signedVC.json`),
        JSON.stringify(ytWatchSignedVC, null, 2),
        {
          encoding: `utf-8`,
        },
      );
      expect(ytWatchSignedVC.proof).toBeDefined();

      uberTripSignedVC = await PwnDataInput.IssueCredential(
        `did:infra:sample`,
        TestHelper.CONST.HOLDER_DID,
        `uber-trip`,
        uberTripJsonld,
      );
      fs.writeFileSync(
        path.join(TestHelper.CONST.OUTPUT_PATH, `uberTrip.signedVC.json`),
        JSON.stringify(uberTripSignedVC, null, 2),
        {
          encoding: `utf-8`,
        },
      );
      expect(uberTripSignedVC.proof).toBeDefined();
    });

    test(`issue SDJWT`, async () => {
      icalSdjwt = await PwnDataInput.issueSdJwt(icalSignedVC.toJSON());
      fs.writeFileSync(path.join(TestHelper.CONST.OUTPUT_PATH, `ical.sdjwt.txt`), icalSdjwt, {
        encoding: `utf-8`,
      });
      expect(icalSdjwt).toBeDefined();
      const icalDecodedSDJWT = decodeSDJWT(icalSdjwt);
      fs.writeFileSync(
        path.join(TestHelper.CONST.OUTPUT_PATH, `ical.sdjwt.decoded.json`),
        JSON.stringify(icalDecodedSDJWT, null, 2),
        { encoding: `utf-8` },
      );
      expect(icalDecodedSDJWT).toBeDefined();

      ytWatchSdjwt = await PwnDataInput.issueSdJwt(ytWatchSignedVC.toJSON());
      fs.writeFileSync(path.join(TestHelper.CONST.OUTPUT_PATH, `ytWatch.sdjwt.txt`), ytWatchSdjwt, {
        encoding: `utf-8`,
      });
      expect(ytWatchSdjwt).toBeDefined();
      const ytWatchDecodedSDJWT = decodeSDJWT(ytWatchSdjwt);
      fs.writeFileSync(
        path.join(TestHelper.CONST.OUTPUT_PATH, `ytWatch.sdjwt.decoded.json`),
        JSON.stringify(ytWatchDecodedSDJWT, null, 2),
        { encoding: `utf-8` },
      );
      expect(ytWatchDecodedSDJWT).toBeDefined();

      uberTripSdjwt = await PwnDataInput.issueSdJwt(uberTripSignedVC.toJSON());
      fs.writeFileSync(path.join(TestHelper.CONST.OUTPUT_PATH, `uberTrip.sdjwt.txt`), uberTripSdjwt, {
        encoding: `utf-8`,
      });
      expect(uberTripSdjwt).toBeDefined();
      const uberTripDecodedSDJWT = decodeSDJWT(uberTripSdjwt);
      fs.writeFileSync(
        path.join(TestHelper.CONST.OUTPUT_PATH, `uberTrip.sdjwt.decoded.json`),
        JSON.stringify(uberTripDecodedSDJWT, null, 2),
        { encoding: `utf-8` },
      );
      expect(uberTripDecodedSDJWT).toBeDefined();
    });

    test(`error: issue SDJWT`, async () => {
      await expect(
        async () => await PwnDataInput.issueSdJwt(icalSignedVC.toJSON(), { headerAlg: `ES256` }),
      ).rejects.toThrow();
    });

    test(`verify SDJWT`, async () => {
      expect(await PwnDataInput.verifySdJwt(`asdf`)).toBeFalsy();
      expect(await PwnDataInput.verifySdJwt(icalSdjwt)).toBeTruthy();
    });

    test(`error: verify SDJWT(not supported hash alg)`, async () => {
      const issuerSignedSdjwt_512 = await PwnDataInput.issueSdJwt(icalSignedVC.toJSON(), { hashAlg: `sha-512` });
      expect(await PwnDataInput.verifySdJwt(issuerSignedSdjwt_512)).toBeFalsy();
    });

    test(`getHasher standalone`, async () => {
      const hasher = await TestHelper.testGetHasher(`sha-256`);
      expect(hasher(`asdf`)).toBeDefined();
    });
  });
});
