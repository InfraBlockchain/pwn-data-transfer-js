import * as RDF from 'rdflib';
// import * as uuid from 'uuid';

class Util {
  static getUrn = (service: string, event: string, date: string): RDF.NamedNode =>
    RDF.sym(
      `urn:newnal.com:${service.toLowerCase()}:${event.toLowerCase()}:${(date
        ? new Date(date)
        : new Date()
      ).valueOf()}`,
    );
}
export default Util;
