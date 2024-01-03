import { IcalConverter, UberTripConverter, YoutubeWatchConverter } from '@src/lib/rdf_converter';
import { InfraSS58, DIDSet, VerifiableCredential, CRYPTO_INFO, HexString } from 'infra-did-js';
import { ContentType } from 'rdflib/lib/types';
import { NoDIDSetError } from './lib/error';

/**
 * convert target type
 */
export type convertType = 'ical' | 'youtube-watch' | 'uber-trip';

/**
 * PWNDataInput lib
 */
class PwnDataInput {
  static didSet: DIDSet;

  /**
   * convert RDF format from target data
   * @param target - contert target data
   * @param type - convert type
   * @param format - RDF format(mime type)
   * @returns RDF format data
   */
  static async convertRDF(
    target: string,
    type: convertType,
    format: ContentType = 'application/ld+json',
  ): Promise<string> {
    switch (type) {
      case 'ical':
        return await IcalConverter.convert(target, format);
      case 'uber-trip':
        return await UberTripConverter.convert(target, format);
      case 'youtube-watch':
        return await YoutubeWatchConverter.convert(target, format);
    }
  }

  /**
   * initialize DID Set.
   */
  static async initDIDSet(seed?: HexString): Promise<DIDSet> {
    if (!this.didSet) {
      this.didSet = await InfraSS58.createNewSS58DIDSet('space', CRYPTO_INFO.ED25519_2018, seed);
    }

    return this.didSet;
  }

  /**
   * JSON-LD signature:: Issue verifiable credential
   * @param id - vc ID
   * @param type - RDF type
   * @param jsonld - RDF(JSON-LD) Data
   * @returns signed(issued) verifiable credential
   */
  static async IssueCredential(
    id: string,
    type: convertType,
    jsonld: Record<string, unknown>,
  ): Promise<VerifiableCredential> {
    if (!this.didSet) {
      throw new NoDIDSetError();
    }
    let vcType = '';
    switch (type) {
      case 'ical':
        vcType = 'newn:icalEvent';
        break;
      case 'uber-trip':
        vcType = 'newn:uberTripData';
        break;
      case 'youtube-watch':
        vcType = 'newn:youtubeWatchHistory';
        break;
    }
    const vc = new VerifiableCredential(id);
    vc.addContext('https://www.w3.org/2018/credentials/v1');
    vc.addType('VerifiableCredential');
    vc.addContext({
      ...(jsonld['@context'] as Record<string, unknown>),
      newn: 'https://newnal.com/ontology/',
    });
    vc.addType(vcType);
    vc.addSubject(jsonld['@graph']);

    const signed = await vc.sign({
      id: `${this.didSet.did}#keys-1`,
      controller: this.didSet.did,
      type: this.didSet.cryptoInfo.KEY_NAME,
      keypair: this.didSet.keyPair,
    });

    return signed;
  }
}

export default PwnDataInput;
