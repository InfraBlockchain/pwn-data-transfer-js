import * as RDF from 'rdflib';
import * as uuid from 'uuid';

class Util {
  static getUrn = (service: string, event: string, seed: string): RDF.NamedNode => {
    const ids = uuid.v4({
      random: `${seed}.${service}.${event}#`.split('').map((char) => char.charCodeAt(0)),
    });

    return RDF.sym(`urn:newnal.com:${service.toLowerCase()}:${event.toLowerCase()}:${ids}`);
  };
}
export default Util;
