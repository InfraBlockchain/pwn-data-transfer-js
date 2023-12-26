import * as RDF from 'rdflib';
import { NamedNode } from 'rdflib/lib/tf-types';
import * as uuid from 'uuid';

export interface NamespaceItem {

  ns: (ln: string) => NamedNode;
  setPrefix: (graph: RDF.Store) => void;
}

// rdf
const RDF_NAME = 'rdf';
const RDF_URL = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
export const rdf: NamespaceItem = {
  ns: RDF.Namespace(RDF_URL),
  setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(RDF_NAME, RDF_URL)
};

// rdfs
// const RDFS_NAME = 'rdfs';
// const RDFS_URL = 'http://www.w3.org/2000/01/rdf-schema#';
// export const rdfs: NamespaceItem = {
//   ns: RDF.Namespace(RDFS_URL),
//   setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(RDFS_NAME, RDFS_URL)
// };

// owl
// const OWL_NAME = 'rdfs';
// const OWL_URL = 'http://www.w3.org/2002/07/owl#';
// export const owl: NamespaceItem = {
//   ns: RDF.Namespace(OWL_URL),
//   setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(OWL_NAME, OWL_URL)
// };


// xsd
const XSD_NAME = 'xsd';
const XSD_URL = 'http://www.w3.org/2001/XMLSchema#';
export const xsd: NamespaceItem = {
  ns: RDF.Namespace(XSD_URL),
  setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(XSD_NAME, XSD_URL)
};


// ical
const ICAL_NAME = 'ical';
const ICAL_URL = 'http://www.w3.org/2002/12/cal/ical#';
export const ical: NamespaceItem = {
  ns: RDF.Namespace(ICAL_URL),
  setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(ICAL_NAME, ICAL_URL)
};


// schema
const SCHEMA_NAME = 'schema';
const SCHEMA_URL = 'http://schema.org/';
export const schema: NamespaceItem = {
  ns: RDF.Namespace(SCHEMA_URL),
  setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(SCHEMA_NAME, SCHEMA_URL)
};

// wd
const WD_NAME = 'wd';
const WD_URL = 'http://www.wikidata.org/entity/';
export const wd: NamespaceItem = {
  ns: RDF.Namespace(WD_URL),
  setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(WD_NAME, WD_URL)
};

// foaf
// const FOAF_NAME = 'foaf';
// const FOAF_URL = 'http://xmlns.com/foaf/0.1/';
// export const foaf: NamespaceItem = {
//   ns: RDF.Namespace(FOAF_URL),
//   setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(FOAF_NAME, FOAF_URL)
// };

// newnal 
const NEWNAL_NAME = 'newn';
const NEWNAL_URL = 'https://newnal.com/ontology/';
export const newnal: NamespaceItem = {
  ns: RDF.Namespace(NEWNAL_URL),
  setPrefix: (graph: RDF.Store) => graph.setPrefixForURI(NEWNAL_NAME, NEWNAL_URL)
};


export const getUrn = (service: string, event: string): RDF.NamedNode => RDF.sym(`urn:newnal.com:${service.toLowerCase()}:${event.toLowerCase()}:${uuid.v4()}`);