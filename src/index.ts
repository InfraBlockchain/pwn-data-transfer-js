import { IcalConverter, UberTripConverter, YoutubeWatchConverter } from '@src/lib/rdf_converter';
import { InfraSS58, DIDSet, VerifiableCredential, CRYPTO_INFO, HexString } from 'infra-did-js';
import { ContentType } from 'rdflib/lib/types';

type convertType = 'ical' | 'youtube-watch' | 'uber-trip';
class PwnDataInput {
  static didSet: DIDSet;

  static async convertRDF(
    data: string,
    type: convertType,
    format: ContentType = 'application/ld+json',
  ): Promise<string> {
    switch (type) {
      case 'ical':
        return await IcalConverter.convert(data, format);
      case 'uber-trip':
        return await UberTripConverter.convert(data, format);
      case 'youtube-watch':
        return await YoutubeWatchConverter.convert(data, format);
    }
  }

  static async initDIDSet(seed?: HexString): Promise<any> {
    if (!this.didSet) {
      this.didSet = await InfraSS58.createNewSS58DIDSet('space', CRYPTO_INFO.ED25519_2018, seed);
    }

    return this.didSet;
  }

  static async IssueCredential(
    id: string,
    type: convertType,
    jsonld: Record<string, any>,
  ): Promise<Record<string, any>> {
    let vcType = '';
    switch (type) {
      case 'ical':
        vcType = 'icalEvent';
        break;
      case 'uber-trip':
        vcType = 'uberTripData';
        break;
      case 'youtube-watch':
        vcType = 'youtubeWatchHistory';
        break;
    }
    const vc = new VerifiableCredential(id);
    vc.addContext('https://www.w3.org/2018/credentials/v1');
    vc.addType('VerifiableCredential');
    vc.addContext(jsonld['@context']);
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
