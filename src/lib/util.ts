import * as RDF from 'rdflib';
import * as uuid from 'uuid';
import { PeriodUnit, SerializedData } from './interface';
import { ContentType } from 'rdflib/lib/types';
import { NamedNode, Quad_Subject } from 'rdflib/lib/tf-types';

class Util {
  static getUrnNamedNode = (service: string, event: string, seed: string): RDF.NamedNode => {
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
        const relatedTriples = graph.match(subject, null, null) as RDF.Statement[];
        const setBlankNodes = (triples: RDF.Statement[]): void => {
          const blankNodeTriples = triples.filter((triple) => triple.object.termType === `BlankNode`);
          if (blankNodeTriples) {
            blankNodeTriples.forEach((blankNodeTriple) => {
              const additionalBlankNodeTriples = graph.match(
                blankNodeTriple.object as Quad_Subject,
                null,
                null,
              ) as RDF.Statement[];
              groupedByPeriod[key] = groupedByPeriod[key].concat(additionalBlankNodeTriples);
              if (additionalBlankNodeTriples.filter((triple) => triple.object.termType === `BlankNode`).length > 0) {
                setBlankNodes(additionalBlankNodeTriples);
              }
            });
          }
        };
        setBlankNodes(relatedTriples);
        groupedByPeriod[key] = groupedByPeriod[key].concat(relatedTriples as RDF.Statement[]);
      }
    });

    for (const periodKey in groupedByPeriod) {
      const periodGraph = new RDF.IndexedFormula();
      groupedByPeriod[periodKey].forEach((triple) => periodGraph.add(triple));

      const serializedData = RDF.serialize(null, periodGraph, null, format)?.replace(/\\u([\d\w]{4})/gi, (_, grp) =>
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
