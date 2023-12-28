import * as RDF from 'rdflib';
import csv from 'csv-parser';
import { ContentType } from 'rdflib/lib/types';
import { ConvertError } from './error';
import { schema, wd, xsd, newnal, rdf } from './namespace.const';

import { Readable } from 'stream';
import Util from './util';

class UberTripConverter {
  private static rdfGraph: RDF.Store | null = null;

  private static init(): void {
    this.rdfGraph = new RDF.IndexedFormula();
    wd.setPrefix(this.rdfGraph);
    schema.setPrefix(this.rdfGraph);
    xsd.setPrefix(this.rdfGraph);
    newnal.setPrefix(this.rdfGraph);
    rdf.setPrefix(this.rdfGraph);
  }

  private static convertToRDF(csvData: Record<string, unknown>[]): void {
    csvData.forEach((row) => {
      if (this.rdfGraph) {
        const tripleId = Util.getUrn('uber', 'trip');

        const ns = newnal.ns;
        this.rdfGraph.add(tripleId, rdf.ns('type'), ns('Trip'));

        const classes = {
          'Uber Green': ns('UberGreen'),
          UberX: ns('UberX'),
          'Standard Taxi': ns('StandardTaxi'),
        };
        const properties = {
          'Trip or Order Status': ns('tripOrderStatus'),
          'Request Time': ns('requestTime'),
          'Begin Trip Time': ns('beginTripTime'),
          'Begin Trip Lat': ns('beginTripLat'),
          'Begin Trip Lng': ns('beginTripLng'),
          'Begin Trip Address': ns('beginTripAddress'),
          'Dropoff Time': ns('dropoffTime'),
          'Dropoff Lat': ns('dropoffLat'),
          'Dropoff Lng': ns('dropoffLng'),
          'Dropoff Address': ns('dropoffAddress'),
          'Distance (miles)': ns('distanceMiles'),
          'Fare Amount': ns('fareAmount'),
          'Fare Currency': ns('fareCurrency'),
        };

        if ((row['Product Type'] as string) in classes) {
          const cls = row['Product Type'] as keyof typeof classes;
          this.rdfGraph.add(tripleId, rdf.ns('type'), classes[cls]);
        }

        Object.keys(properties).forEach((property) => {
          if (row[property] && this.rdfGraph) {
            this.rdfGraph.add(
              tripleId,
              properties[property as keyof typeof properties],
              RDF.literal(row[property] as string),
            );
          }
        });
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
