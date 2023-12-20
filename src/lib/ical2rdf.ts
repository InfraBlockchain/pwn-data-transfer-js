import * as RDF from 'rdflib';

const ical = RDF.Namespace('http://www.w3.org/2002/12/cal/ical#');
const XSD = RDF.Namespace('http://www.w3.org/2001/XMLSchema#');
const parseKeys = {
  location: { key: 'LOCATION', uri: ical('location') },
  summary: { key: 'SUMMARY', uri: ical('summary') },
  status: { key: 'STATUS', uri: ical('status') },
  description: { key: 'DESCRIPTION', uri: ical('description') },
  lastModified: { key: 'LAST-MODIFIED', uri: ical('lastModified') }
};
class IcalConverter {
  private static rdfGraph: RDF.Store | null = null;

  /**
   * static construct of Class
   */
  private static init(): void {
    this.rdfGraph = new RDF.IndexedFormula();
    this.rdfGraph.setPrefixForURI('ical', ical.toString());
  }

  private static parseICalDateTime(value: string): string {
    let res = '';
    if (value.includes('T')) {
      res = value.replace(
        /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2,3})Z/,
        '$1-$2-$3T$4:$5:$6Z'
      );
    } else {
      res = value.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    }

    const dateTest = new Date(res);
    if (dateTest instanceof Date && !isNaN(dateTest.valueOf())) {
      return res;
    }
    throw Error(`Failed to parse value '${value}'`);
  }

  private static isDatetimeKey(key: string): boolean {
    return key.toUpperCase().includes('DT');
  }

  private static addEventToGraph(event: Record<string, string>): void {
    if (this.rdfGraph) {
      for (const [key, value] of Object.entries(event)) {
        const upperKey = key.toUpperCase();
        const eventUri = RDF.namedNode(
          `urn:event:${event['UID']}#status=${event['STATUS']}&sequence=${event['SEQUENCE']}`
        );
        if (this.isDatetimeKey(upperKey)) {
          try {
            const dtParsed = IcalConverter.parseICalDateTime(value);

            this.rdfGraph.add(
              eventUri,
              RDF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              ical('Event')
            );

            if (upperKey.includes('DATE')) {
              this.rdfGraph.add(
                eventUri,
                ical(key.toLowerCase()),
                RDF.literal(dtParsed, XSD('date'))
              );
            } else {
              this.rdfGraph.add(
                eventUri,
                ical(key.toLowerCase()),
                RDF.literal(dtParsed, XSD('dateTime'))
              );
            }
          } catch (error) {
            console.error(`Failed to parse ${key} value '${value}': ${error}`);
            this.rdfGraph.add(
              eventUri,
              ical(key.toLowerCase()),
              RDF.literal('')
            );
          }
        } else if (upperKey === parseKeys.lastModified.key) {
          this.rdfGraph.add(
            eventUri,
            parseKeys.lastModified.uri,
            RDF.literal(IcalConverter.parseICalDateTime(value), XSD('dateTime'))
          );
        } else {
          Object.entries(parseKeys).forEach(([_, el]) => {
            if (upperKey === el.key) {
              this.rdfGraph?.add(eventUri, el.uri, RDF.literal(value));
            }
          });
        }
      }
    }
  }

  private static convertToRdf(icalData: string): void {
    const lines = icalData.split(/\n/);
    let currentEvent: Record<string, string> | null = null;
    let inValarm = false;
    let isMultiline = false;
    let prevKey = '';

    for (const line of lines) {
      if (line.startsWith(' ') && prevKey !== '') {
        isMultiline = true;
      } else {
        isMultiline = false;
        prevKey = '';
      }

      if (isMultiline && currentEvent !== null) {
        currentEvent[prevKey] += '\n' + (line?.trim() ?? '');
        continue;
      }

      if (line.startsWith('BEGIN:VALARM')) {
        inValarm = true;
        continue;
      } else if (line.startsWith('END:VALARM')) {
        inValarm = false;
        continue;
      }

      if (inValarm) {
        continue;
      }
      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {};
      } else if (line.startsWith('END:VEVENT')) {
        if (currentEvent) {
          this.addEventToGraph(currentEvent);
          currentEvent = null;
        }
      } else if (currentEvent && line.includes(':')) {
        const [key, value] = line.split(':', 2);
        currentEvent[key] = value?.trim() ?? '';
        prevKey = key;
      }
    }
  }

  /**
   *
   * convert ical data to RDF
   *
   * @param icalData - icalData string.
   * @param format - return format. default 'text/turtle'
   * @returns rdf string
   *
   */
  static convert(icalData: string, format = 'text/turtle'): string {
    if (this.rdfGraph === null) {
      IcalConverter.init();
    }
    let res = '?';
    if (this.rdfGraph) {
      IcalConverter.convertToRdf(icalData);
      res = RDF.serialize(null, this.rdfGraph, null, format) || '';
    }

    return res.replace(/\\u([\d\w]{4})/gi, (_, grp) =>
      String.fromCharCode(parseInt(grp, 16))
    );
  }
}

export default IcalConverter;
