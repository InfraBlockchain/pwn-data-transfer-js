import * as RDF from 'rdflib';
import * as uuid from 'uuid';


class Util {
  static getUrn = (service: string, event: string): RDF.NamedNode => RDF.sym(`urn:newnal.com:${service.toLowerCase()}:${event.toLowerCase()}:${uuid.v4()}`);

}
export default Util;