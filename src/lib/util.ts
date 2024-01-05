import * as RDF from 'rdflib';
import * as uuid from 'uuid';
import { PeriodUnit, SerializedData } from './interface';
import { ContentType } from 'rdflib/lib/types';
import { NamedNode } from 'rdflib/lib/tf-types';

class Util {
  static getUrn = (service: string, event: string, seed: string): RDF.NamedNode => {
    const ids = uuid.v4({
      random: `${seed}.${service}.${event}#`.split(``).map((char) => char.charCodeAt(0)),
    });

    return RDF.sym(`urn:newnal.com:${service.toLowerCase()}:${event.toLowerCase()}:${ids}`);
  };

  static serializeGraphByPeriod(
    graph: RDF.IndexedFormula,
    periodUnit: PeriodUnit,
    criteria: NamedNode,
    format: ContentType,
  ): SerializedData {
    const criteriaSubjects = graph.match(null, criteria, null).map((triple) => triple.subject);
    const result: SerializedData = { periodUnit, serializes: {} };
    const groupedByPeriod: { [key: string]: RDF.Statement[] } = {};

    criteriaSubjects.forEach((subject) => {
      const criteriaTripleObject = graph.any(subject, criteria, null);
      if (criteriaTripleObject) {
        const criteriaDate = new Date(criteriaTripleObject.value);

        let key = ``;

        switch (periodUnit) {
          case PeriodUnit.day:
            key = criteriaDate.toISOString().split(`T`)[0];
            break;
          case PeriodUnit.month:
            key = `${criteriaDate.getFullYear()}-${(criteriaDate.getMonth() + 1).toString().padStart(2, `0`)}`;
            break;
          case PeriodUnit.quarter:
            key = `${criteriaDate.getFullYear()}-Q${Math.floor((criteriaDate.getMonth() + 3) / 3)}`;
            break;
          case PeriodUnit.semiAnnual:
            key = `${criteriaDate.getFullYear()}-H${Math.floor((criteriaDate.getMonth() + 6) / 6)}`;
            break;
          case PeriodUnit.yearly:
            key = `${criteriaDate.getFullYear()}`;
            break;
          default:
            key = PeriodUnit.all;
            break;
        }
        if (!groupedByPeriod[key]) {
          groupedByPeriod[key] = [];
        }
        groupedByPeriod[key] = groupedByPeriod[key].concat(
          graph.match(subject, undefined, undefined) as RDF.Statement[],
        );
      }
    });

    for (const periodKey in groupedByPeriod) {
      const monthGraph = new RDF.IndexedFormula();
      groupedByPeriod[periodKey].forEach((triple) => monthGraph.add(triple));

      const serializedData = RDF.serialize(null, monthGraph, null, format)?.replace(/\\u([\d\w]{4})/gi, (_, grp) =>
        String.fromCharCode(parseInt(grp, 16)),
      );
      if (serializedData) {
        result.serializes[periodKey] = serializedData;
      }
    }

    return result;
  }
}
export default Util;
