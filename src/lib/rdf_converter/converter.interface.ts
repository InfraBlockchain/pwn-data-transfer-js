import { ContentType } from 'rdflib/lib/types';
import { PeriodUnit, SerializedData } from '../interface';
import * as RDF from 'rdflib';

export class Converter {
  protected static rdfGraph: RDF.Store | null = null;

  static async convert(_Data: string, _periodUnit?: PeriodUnit, _format?: ContentType): Promise<SerializedData> {
    throw new Error(`Function must be override.`);
  }
}
