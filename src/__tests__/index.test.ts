import IcalConverter from '../lib/ical2rdf';
import PwnDataInput from '../index';
import fs from 'fs';

jest.setTimeout(1000 * 60 * 10);

const ics_sample = fs.readFileSync('src/__tests__/input.ics', {
  encoding: 'utf-8'
});

describe('Module Test', () => {
  test('convertIcal', () => {
    const res = PwnDataInput.convertIcal(ics_sample);
    expect(res).toBeDefined();
    expect(
      res.includes('@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.')
    ).toBeTruthy();
  });
});

describe('Lib Test', () => {
  test('ical to rdf', () => {
    const res = IcalConverter.convert(ics_sample);
    expect(res).toBeDefined();
    expect(
      res.includes('@prefix cal: <http://www.w3.org/2002/12/cal/ical#>.')
    ).toBeTruthy();
    fs.writeFileSync('src/__tests__/output.ttl', res, { encoding: 'utf-8' });
  });
});
