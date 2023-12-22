import * as RDF from 'rdflib';
import { NamedNode } from 'rdflib/lib/tf-types';


export interface NamespaceItem {

  ns: (ln: string) => NamedNode;
  setPrefix: (graph: RDF.Store) => void;
}

const XSD_NAME = 'xsd';
const XSD_URL = 'http://www.w3.org/2001/XMLSchema#';
export const XSD: NamespaceItem = {
  ns: RDF.Namespace(XSD_URL),
  setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(XSD_NAME, XSD_URL)
};



const ICAL_NAME = 'ical';
const ICAL_URL = 'http://www.w3.org/2002/12/cal/ical#';
export const ical: NamespaceItem = {
  ns: RDF.Namespace(ICAL_URL),
  setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(ICAL_NAME, ICAL_URL)
};



const SCHEMA_NAME = 'schema';
const SCHEMA_URL = 'http://schema.org/';

export const schema: NamespaceItem = {
  ns: RDF.Namespace(SCHEMA_URL),
  setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(SCHEMA_NAME, SCHEMA_URL)
};

const WD_NAME = 'wd';
const WD_URL = 'http://www.wikidata.org/entity/';
export const wd: NamespaceItem = {
  ns: RDF.Namespace(WD_URL),
  setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(WD_NAME, WD_URL)
};

