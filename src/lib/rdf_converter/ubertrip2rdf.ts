import * as RDF from 'rdflib';
import csv from 'csv-parser';
import { ContentType } from 'rdflib/lib/types';
import { ConvertError } from './error';
import { schema, xsd, rdf } from './namespace.const';

import { Readable } from 'stream';
import Util from './util';

const direction = {
  from: 'Begin Trip',
  to: 'Dropoff',
};

class UberTripConverter {
  private static rdfGraph: RDF.Store | null = null;

  private static init(): void {
    this.rdfGraph = new RDF.IndexedFormula();
    schema.setPrefix(this.rdfGraph);
    xsd.setPrefix(this.rdfGraph);
    rdf.setPrefix(this.rdfGraph);
  }

  private static setLocation(
    row: Record<string, unknown>,
    travelNode: RDF.BlankNode,
    directionKey: keyof typeof direction,
  ): void {
    const prefix = direction[directionKey];
    if (this.rdfGraph && row[`${prefix} Address`]) {
      const locationNode = RDF.blankNode(`${travelNode.value}_${directionKey}_location`);
      this.rdfGraph.add(travelNode, schema.ns(`${directionKey}Location`), locationNode);
      this.rdfGraph.add(locationNode, rdf.ns('type'), schema.ns('Place'));
      this.rdfGraph.add(locationNode, schema.ns('address'), RDF.literal(row[`${prefix} Address`] as string));
      if ((row[`${prefix} Lat`] as string) && (row[`${prefix} Lng`] as string)) {
        const geoNode = RDF.blankNode(`${travelNode.value}_${directionKey}_location_geo`);
        this.rdfGraph.add(locationNode, schema.ns('geo'), geoNode);
        this.rdfGraph.add(geoNode, rdf.ns('type'), schema.ns('GeoCoordinates'));
        this.rdfGraph.add(geoNode, schema.ns('latitude'), RDF.literal(row[`${prefix} Lat`] as string));
        this.rdfGraph.add(geoNode, schema.ns('longitude'), RDF.literal(row[`${prefix} Lng`] as string));
      }
    }
  }

  private static formatDateTime(str: string): string {
    return new Date(str).toISOString();
  }

  private static convertToRDF(csvData: Record<string, unknown>[]): void {
    csvData.forEach((row) => {
      if (this.rdfGraph) {
        const tripleId = Util.getUrn('uber', 'trip', row['Request Time'] as string);

        this.rdfGraph.add(tripleId, rdf.ns('type'), schema.ns('Reservation'));
        this.rdfGraph.add(tripleId, schema.ns('broker'), 'Uber');

        const ReservationProps = {
          'Fare Amount': schema.ns('totalPrice'),
          'Fare Currency': schema.ns('priceCurrency'),
          'Request Time': schema.ns('bookingTime'),
        };
        Object.keys(ReservationProps).forEach((property) => {
          if (this.rdfGraph) {
            if (row[property] && property === 'Request Time') {
              this.rdfGraph.add(
                tripleId,
                ReservationProps[property as keyof typeof ReservationProps],
                RDF.literal(this.formatDateTime(row[property] as string), xsd.ns('dateTime')),
              );
            } else if (row[property]) {
              this.rdfGraph.add(
                tripleId,
                ReservationProps[property as keyof typeof ReservationProps],
                RDF.literal(row[property] as string),
              );
            }
          }
        });

        const travelNode = RDF.blankNode(`${tripleId}_travel`);

        this.rdfGraph.add(tripleId, schema.ns('reservationFor'), travelNode);
        this.rdfGraph.add(travelNode, rdf.ns('type'), schema.ns('TravelAction'));
        const TravelProps = {
          'Trip or Order Status': schema.ns('additionalType'),
          'Product Type': schema.ns('object'),
        };
        Object.keys(TravelProps).forEach((property) => {
          if (row[property] && this.rdfGraph) {
            this.rdfGraph.add(
              travelNode,
              TravelProps[property as keyof typeof TravelProps],
              RDF.literal(row[property] as string),
            );
          }
        });
        this.rdfGraph.add(
          travelNode,
          schema.ns('startTime'),
          RDF.literal(this.formatDateTime(row['Begin Trip Time'] as string), xsd.ns('dateTime')),
        );
        this.rdfGraph.add(
          travelNode,
          schema.ns('endTime'),
          RDF.literal(this.formatDateTime(row['Dropoff Time'] as string), xsd.ns('dateTime')),
        );
        if (row['Distance (miles)']) {
          this.rdfGraph.add(travelNode, schema.ns('distance'), RDF.literal(`${row['Distance (miles)']} miles`));
        }
        this.setLocation(row, travelNode, 'from');
        this.setLocation(row, travelNode, 'to');
      }
    });
  }

  /**
   *
   * convert Uber trips data CSV stream to RDF
   *
   * @param csvData - Uber trips data csv data.
   * @param format - return format. default 'application/ld+json'
   * @returns rdf string
   *
   */
  static async convert(csvData: string, format: ContentType = 'application/ld+json'): Promise<string> {
    return new Promise((resolve, rejects) => {
      if (csvData) {
        this.init();

        const stream = new Readable();
        stream.push(csvData, 'utf-8');
        stream.push(null);
        stream
          .pipe(csv())
          .on('data', (row) => {
            this.convertToRDF([row]);
          })
          .on('end', () => {
            if (this.rdfGraph) {
              const res = RDF.serialize(null, this.rdfGraph, null, format);
              if (res) {
                resolve(res.replace(/\\u([\d\w]{4})/gi, (_, grp) => String.fromCharCode(parseInt(grp, 16))));
              }
              rejects(new ConvertError());
            }
          });
      } else {
        rejects(new ConvertError());
      }
    });
  }
}

export default UberTripConverter;
