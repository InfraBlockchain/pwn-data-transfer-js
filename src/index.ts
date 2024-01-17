import { IcalConverter, UberTripConverter, YoutubeWatchConverter } from '@src/lib/rdf_converter';
import {
  InfraSS58,
  DIDSet,
  VerifiableCredential,
  CRYPTO_INFO,
  HexString,
  hasher,
  issueSDJWT,
  KeyringPair,
  CryptoHelper,
  base64encode,
  verifySDJWT,
  Hasher,
  decodeSDJWT,
} from 'infra-did-js';
import { ContentType } from 'rdflib/lib/types';
import { NoDIDSetError } from './lib/error';
import { JWTHeaderParameters, JWTPayload, SignJWT, importJWK, jwtVerify } from 'jose';
import crypto, { BinaryLike } from 'crypto';
import { ConvertType, PeriodUnit, SerializedData } from './lib/interface';

export { PeriodUnit, ConvertType };

export type { SerializedData, ContentType };
/**
 * PWNDataInput lib
 */
class PwnDataInput {
  /**
   * infra ss58 did set. for issuer did, set by initDIDSet
   */
  static didSet: DIDSet;

  /**
   * convert RDF format from target data
   * @param target - target data
   * @param type - convert type
   * @param periodUnit - split data by period. default PeriodUnit.all
   * @param format - RDF format(mime type). default 'application/ld+json'
   * @returns - RDF format data
   */
  static async convertRDF(
    target: string,
    type: ConvertType,
    periodUnit: PeriodUnit = PeriodUnit.all,
    format: ContentType = `application/ld+json`,
  ): Promise<SerializedData> {
    switch (type) {
      case ConvertType.ical:
        return await IcalConverter.convert(target, periodUnit, format);
      case ConvertType.uberTrip:
        return await UberTripConverter.convert(target, periodUnit, format);
      case ConvertType.youtubeWatch:
        return await YoutubeWatchConverter.convert(target, periodUnit, format);
    }
  }

  /**
   * initialize DID Set.
   */
  static async initDIDSet(seed?: HexString): Promise<DIDSet> {
    if (!this.didSet) {
      this.didSet = await InfraSS58.createNewSS58DIDSet(`space`, CRYPTO_INFO.ED25519_2018, seed);
    }

    return this.didSet;
  }

  /**
   * JSON-LD signature:: Issue verifiable credential
   * @param vcId - vc ID
   * @param holderDID - issued target(holder) did
   * @param type - RDF type
   * @param jsonld - RDF(JSON-LD) Data
   * @returns - signed(issued) verifiable credential
   */
  static async IssueCredential(
    vcId: string,
    holderDID: string,
    type: ConvertType,
    jsonld: Record<string, unknown>,
  ): Promise<VerifiableCredential> {
    if (!this.didSet) {
      throw new NoDIDSetError();
    }
    let vcType = ``;
    switch (type) {
      case ConvertType.ical:
        vcType = `newn:icalEvent`;
        break;
      case ConvertType.uberTrip:
        vcType = `newn:uberTripData`;
        break;
      case ConvertType.youtubeWatch:
        vcType = `newn:youtubeWatchHistory`;
        break;
    }
    const vc = new VerifiableCredential(vcId);
    vc.addContext(`https://www.w3.org/2018/credentials/v1`);
    vc.addType(`VerifiableCredential`);
    vc.addContext({
      ...(jsonld[`@context`] as Record<string, unknown>),
      newn: `https://newnal.com/ontology/`,
      cred: `https://www.w3.org/2018/credentials#`,
    });
    vc.addType(vcType);
    vc.addSubject({ 'cred:holder': holderDID, 'newn:data': jsonld[`@graph`] });

    const signed = await vc.sign(this.getKeyDoc());

    return signed;
  }

  protected static getKeyDoc(): { id: string; controller: string; type: string; keypair: KeyringPair } {
    return {
      id: `${this.didSet.did}#keys-1`,
      controller: this.didSet.did,
      type: this.didSet.cryptoInfo.KEY_NAME,
      keypair: this.didSet.keyPair,
    };
  }

  protected static signer = async (header: JWTHeaderParameters, payload: JWTPayload): Promise<string> => {
    const issuerPrivateKey = CryptoHelper.jwk2KeyObject(this.didSet.keyPairJWK.privateJwk, `private`);
    const signature = await new SignJWT(payload).setProtectedHeader(header).sign(issuerPrivateKey);

    return signature.split(`.`).pop() as string;
  };

  protected static getVerifier(alg: string) {
    return async (jwt: string | Uint8Array) => {
      const issuerPublickey = await importJWK(this.didSet.keyPairJWK.publicJwk, alg);

      return !!jwtVerify(jwt, issuerPublickey);
    };
  }

  protected static getHasher = (hashAlg: string): Promise<Hasher> => {
    let hasher: Hasher | null = null;
    // Default Hasher = Hasher for SHA-256
    if (!hashAlg || hashAlg.toLowerCase() === `sha-256`) {
      hasher = (data: BinaryLike) => {
        const digest = crypto.createHash(`sha256`).update(data).digest();

        return base64encode(digest);
      };
    }
    if (hasher) {
      return Promise.resolve(hasher);
    }
    throw new Error(`hash alg must be sha-256`);
  };

  /**
   * verify SD-JWT
   * @param issuerSignedSdjwt - SD-JWT string
   * @returns - true/false
   */
  static async verifySdJwt(issuerSignedSdjwt: string): Promise<boolean> {
    try {
      const decodedSDJWT = decodeSDJWT(issuerSignedSdjwt);
      const header = decodedSDJWT.header as JWTHeaderParameters;
      const verifier = this.getVerifier(header.alg);

      const opts = {};
      await verifySDJWT(issuerSignedSdjwt, verifier, this.getHasher, opts);

      return true;
    } catch (e) {
      console.error(`verifySdJwt:: ${e}`);

      return false;
    }
  }

  /**
   * issue json to SD-JWT
   * @param payload - target json payload
   * @param opt - set header alg(EdDSA, ES256...) and hash alg(sha-256). but hash alg currently supports only sha-256
   * @returns - SD-JWT string
   */
  static async issueSdJwt(
    payload: Record<string, unknown>,
    opt: { headerAlg?: string; hashAlg?: string } = { headerAlg: `EdDSA`, hashAlg: `sha-256` },
  ): Promise<string> {
    return await issueSDJWT(
      {
        alg: opt.headerAlg || `EdDSA`,
        kid: this.getKeyDoc().id,
      },
      payload,
      { _sd: [] },
      {
        hash: {
          alg: opt.hashAlg || `sha-256`,
          callback: hasher,
        },
        signer: this.signer,
      },
    );
  }
}

export default PwnDataInput;
