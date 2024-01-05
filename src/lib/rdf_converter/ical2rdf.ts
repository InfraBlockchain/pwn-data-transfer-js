import * as RDF from 'rdflib';
import { ContentType } from 'rdflib/lib/types';
import { ConvertError } from '../error';
import { cal, xsd, rdf } from './namespace.const';
import Util from '../util';
import { PeriodUnit, SerializedData } from '../interface';
import { Converter } from './converter.interface';

const parseKeys = {
  location: { key: `LOCATION`, uri: cal.ns(`location`) },
  summary: { key: `SUMMARY`, uri: cal.ns(`summary`) },
  status: { key: `STATUS`, uri: cal.ns(`status`) },
  description: { key: `DESCRIPTION`, uri: cal.ns(`description`) },
  lastModified: { key: `LAST-MODIFIED`, uri: cal.ns(`lastModified`) },
};
class IcalConverter extends Converter {
  /**
   * static construct of Class
   */
  private static init(): void {
    this.rdfGraph = RDF.graph();
    cal.setPrefix(this.rdfGraph);
    xsd.setPrefix(this.rdfGraph);
    rdf.setPrefix(this.rdfGraph);
  }

  private static parseICalDateTime(value: string): string {
    let res = ``;
    if (value.includes(`T`)) {
      res = value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2,3})Z/, `$1-$2-$3T$4:$5:$6Z`);
    } else {
      res = value.replace(/(\d{4})(\d{2})(\d{2})/, `$1-$2-$3`);
    }

    const dateTest = new Date(res);
    if (dateTest instanceof Date && !isNaN(dateTest.valueOf())) {
      return res;
    }
    throw Error(`Failed to parse value '${value}'`);
  }

  private static isDateTimeKey(key: string): boolean {
    return key.toUpperCase().includes(`DT`);
  }

  private static addEventToGraph(event: Record<string, string>, eventDate: string): void {
    if (this.rdfGraph) {
      for (const [key, value] of Object.entries(event)) {
        const upperKey = key.toUpperCase();
        const eventId = Util.getUrn(`google`, `calendar`, eventDate);
        if (this.isDateTimeKey(upperKey)) {
          try {
            const dtParsed = IcalConverter.parseICalDateTime(value);

            this.rdfGraph.add(eventId, rdf.ns(`type`), cal.ns(`Event`));

            if (upperKey.includes(`DATE`)) {
              this.rdfGraph.add(
                eventId,
                cal.ns(key.toLowerCase().split(`;`)[0]),
                RDF.literal(dtParsed, xsd.ns(`date`)),
              );
            } else {
              this.rdfGraph.add(eventId, cal.ns(key.toLowerCase()), RDF.literal(dtParsed, xsd.ns(`dateTime`)));
            }
          } catch (error) {
            console.error(`Failed to parse ${key} value '${value}': ${error}`);
            this.rdfGraph.add(eventId, cal.ns(key.toLowerCase()), RDF.literal(``));
          }
        } else if (upperKey === parseKeys.lastModified.key) {
          this.rdfGraph.add(
            eventId,
            parseKeys.lastModified.uri,
            RDF.literal(IcalConverter.parseICalDateTime(value), xsd.ns(`dateTime`)),
          );
        } else {
          Object.entries(parseKeys).forEach(([_, el]) => {
            if (upperKey === el.key) {
              this.rdfGraph?.add(eventId, el.uri, RDF.literal(value));
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
    let prevKey = ``;

    for (const line of lines) {
      if (line.startsWith(` `) && prevKey !== ``) {
        isMultiline = true;
      } else {
        isMultiline = false;
        prevKey = ``;
      }

      if (isMultiline && currentEvent !== null) {
        currentEvent[prevKey] += `\n` + line?.trim();
        continue;
      }

      if (line.startsWith(`BEGIN:VALARM`)) {
        inValarm = true;
        continue;
      } else if (line.startsWith(`END:VALARM`)) {
        inValarm = false;
        continue;
      }

      if (inValarm) {
        continue;
      }
      if (line.startsWith(`BEGIN:VEVENT`)) {
        currentEvent = {};
      } else if (line.startsWith(`END:VEVENT`)) {
        if (currentEvent) {
          const eventDate = IcalConverter.parseICalDateTime(currentEvent[`CREATED`]);
          this.addEventToGraph(currentEvent, eventDate);
          currentEvent = null;
        }
      } else if (currentEvent && line.includes(`:`)) {
        const [key, value] = line.split(`:`, 2);
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
   * @param periodUnit - split data by period. default PeriodUnit.all
   * @param format - return format. default 'application/ld+json'
   * @returns rdf string
   *
   */
  static override async convert(
    icalData: string,
    periodUnit: PeriodUnit = PeriodUnit.all,
    format: ContentType = `application/ld+json`,
  ): Promise<SerializedData> {
    if (icalData) {
      this.init();
      if (this.rdfGraph) {
        this.convertToRdf(icalData);
        const res = Util.serializeGraphByPeriod(this.rdfGraph, periodUnit, cal.ns(`dtstart`), format);
        this.rdfGraph = null;
        if (res) {
          return res;
        }
      }
    }
    throw new ConvertError();
  }
}

export default IcalConverter;
