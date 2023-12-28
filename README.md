# PWN Data Input Library


## Feature
- Convert data to RDF 
  - Google takeout(calendar(ical), youtube watch histroy)
  - Uber trip data
- create infra ss58 DID Set
- RDF(JSON-LD) to signed VC 


## Working in progress
- Convert VC to SD-JWT (not fixed)
- Input VC data into PWN

## Usage

```ts 
// infra did init. Set to module but can be returned as variable if you want
// seed: infra did seed (required)
const seed = '0x8c9971953c5c82a51e3ab0ec9a16ced7054585081483e2489241b5b059f5f3cf';
const didSet = await PwnDataInput.initDIDSet(seed);
// convert ical data to jsonld
// data:string data from calendar(.ics), youtube watch history(.html), uber trip data(.csv)
const data = fs.readFileSync(path.join('path/to/target', 'calendar.ics'), { encoding: 'utf-8'});
const icalJsonld = await PwnDataInput.convertRDF(data, 'ical', 'application/ld+json');
// jsonld signature(VC)
// vcId: vc identifier
const vcId = 'did:infra:space:15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5';
const signedVC = await PwnDataInput.IssueCredential(vcId, 'ical', JSON.parse(icalJsonld));
```
> See `/example`, `src/__tests__`  folders for more information



## Environment variable 

- INFRADID_SEED : infra did seed (required)
- PWN_INPUT_URL: PWN API URL