import * as RDF from 'rdflib';

const ical = RDF.Namespace('http://www.w3.org/2002/12/cal/ical#');
const XSD = RDF.Namespace('http://www.w3.org/2001/XMLSchema#');

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
    if (value.includes('T'))
      return value.replace(
        /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
        '$1-$2-$3T$4:$5:$6Z'
      );

    return value.replace(
      /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/,
      '$1-$2-$3T$4:$5:$6Z'
    );
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
          }
        } else if (upperKey === 'LAST-MODIFIED') {
          this.rdfGraph.add(
            eventUri,
            ical('lastModified'),
            RDF.literal(IcalConverter.parseICalDateTime(value), XSD('dateTime'))
          );
        } else if (upperKey === 'DESCRIPTION') {
          const encodedDescription = escape(value);
          this.rdfGraph.add(
            eventUri,
            ical('description'),
            RDF.literal(encodedDescription)
          );
        } else if (upperKey === 'LOCATION') {
          this.rdfGraph.add(eventUri, ical('location'), RDF.literal(value));
        } else if (upperKey === 'SUMMARY') {
          this.rdfGraph.add(eventUri, ical('summary'), RDF.literal(value));
        } else if (upperKey === 'STATUS') {
          this.rdfGraph.add(eventUri, ical('status'), RDF.literal(value));
        }
      }
    }
  }

  private static convertToRdf(icalData: string): void {
    const lines = icalData.split('\n');
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
      } else if (currentEvent !== null && line.includes(':')) {
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

      res = RDF.serialize(null, this.rdfGraph, undefined, format) || '';
    }

    return res;
  }
}

export default IcalConverter;
