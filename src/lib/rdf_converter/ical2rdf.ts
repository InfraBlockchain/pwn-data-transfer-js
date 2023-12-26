import * as RDF from 'rdflib';
import { ContentType } from 'rdflib/lib/types';
import { ConvertError } from '../error';
import { ical, xsd, rdf, getUrn } from '../namespace.const';


const parseKeys = {
  location: { key: 'LOCATION', uri: ical.ns('location') },
  summary: { key: 'SUMMARY', uri: ical.ns('summary') },
  status: { key: 'STATUS', uri: ical.ns('status') },
  description: { key: 'DESCRIPTION', uri: ical.ns('description') },
  lastModified: { key: 'LAST-MODIFIED', uri: ical.ns('lastModified') }
};
class IcalConverter {
  private static rdfGraph: RDF.Store | null = null;

  /**
   * static construct of Class
   */
  private static init(): void {
    this.rdfGraph = new RDF.IndexedFormula();
    ical.setPrefix(this.rdfGraph);
    xsd.setPrefix(this.rdfGraph);
    rdf.setPrefix(this.rdfGraph);

  }

  private static parseICalDateTime(value: string): string {
    let res = '';
    if (value.includes('T')) {
      res = value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2,3})Z/, '$1-$2-$3T$4:$5:$6Z');
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
        const eventUri = getUrn('google', 'calendar');
        if (this.isDatetimeKey(upperKey)) {
          try {
            const dtParsed = IcalConverter.parseICalDateTime(value);

            this.rdfGraph.add(
              eventUri,
              rdf.ns('type'),
              ical.ns('Event')
            );

            if (upperKey.includes('DATE')) {
              this.rdfGraph.add(eventUri, ical.ns(key.toLowerCase()), RDF.literal(dtParsed, xsd.ns('date')));
            } else {
              this.rdfGraph.add(eventUri, ical.ns(key.toLowerCase()), RDF.literal(dtParsed, xsd.ns('dateTime')));
            }
          } catch (error) {
            console.error(`Failed to parse ${key} value '${value}': ${error}`);
            this.rdfGraph.add(eventUri, ical.ns(key.toLowerCase()), RDF.literal(''));
          }
        } else if (upperKey === parseKeys.lastModified.key) {
          this.rdfGraph.add(
            eventUri,
            parseKeys.lastModified.uri,
            RDF.literal(IcalConverter.parseICalDateTime(value), xsd.ns('dateTime'))
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
        currentEvent[prevKey] += '\n' + line?.trim();
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
        currentEvent[key] = value.trim();
        prevKey = key;
      }
    }
  }

  /**
   *
   * convert ical data to RDF
   *
   * @param icalData - icalData string.
   * @param format - return format. default 'application/ld+json'
   * @returns rdf string
   *
   */
  static async convert(icalData: string, format: ContentType = 'application/ld+json'): Promise<string> {
    if (icalData) {
      this.init();
      let res: string | undefined = '?';
      if (this.rdfGraph) {
        this.convertToRdf(icalData);
        res = RDF.serialize(null, this.rdfGraph, null, format);
      }

      if (res) {
        return res?.replace(/\\u([\d\w]{4})/gi, (_, grp) => String.fromCharCode(parseInt(grp, 16)));
      }
    }
    throw new ConvertError();
  }
}

export default IcalConverter;
