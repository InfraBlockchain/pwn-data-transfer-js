![Generic badge](https://img.shields.io/badge/version-{{version}}-blue)
![Generic badge](https://img.shields.io/badge/coverage-{{cover}}-{{ccolor}})


# PWN Data Input Library


## Feature
- Convert data to RDF 
  - Google takeout
    - calendar(.ics) -- * .ics is a standard format, so it seems to be irrelevant to the provider
    - youtube watch history(.html)
  - Uber trip data(.csv)
- Create infra ss58 DID Set: for issue(sign) VC / SD-JWT
- Issue VC: issue the JSON-LD to signed VC 
  - separation by period(day, month, quarter, semi-annual, yearly) (v0.2.0)
- Issue SD-JWT: issue the signed VC (or JSON of any kind) as SD-JWT. (v0.1.2)


## Support Formats(updated at 23.12.28)

|Provider|Data|File extension|
|-|-|-|
|google|calendar|.ics|
|google|youtube watch history|.html|
|uber|trip data|.csv|


## Working in progress
- Input VC data into PWN (API)



## Usage

### Init DID 
infra did init. Set to module but can be returned as variable if you want
```ts 
// seed: infra did seed (required)
const seed = '0x8c9971953c5c82a51e3ab0ec9a16ced7054585081483e2489241b5b059f5f3cf';
const didSet = await PwnDataInput.initDIDSet(seed);
```

### Convert data to RDF(JSON-LD)
```ts
import { PeriodUnit } from './lib/interface';
// convert ical data to jsonld
// data:string data from calendar(.ics), youtube watch history(.html), uber trip data(.csv)
const data = fs.readFileSync(path.join('path/to/target', 'calendar.ics'), { encoding: 'utf-8'});
const icalJsonld = await PwnDataInput.convertRDF(data, 'ical', PeriodUnit.all, 'application/ld+json');
```

### jsonld-signature (issue VC)
```ts 
// vcId: vc identifier
const vcId = 'did:infra:space:15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5';
const signedVC = await PwnDataInput.IssueCredential(vcId, 'ical', JSON.parse(icalJsonld));
```

### Issue SD-JWT
```ts
const issuedSdjwt = await PwnDataInput.issueSdJwt(signedVC);
const decodedSdJwt = decodeSDJWT(issuedSdjwt);
```


## More Information
> See `/example`, `src/__tests__`  folders

> [Docs](https://infrablockchain.github.io/pwn-data-input-js/)



