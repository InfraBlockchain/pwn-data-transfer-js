import IcalConverter from './lib/ical2rdf';

class PwnDataInput {
  test(): string {
    console.log('test');

    return 'test';
  }

  static convertIcal(icalData: string): string {
    return IcalConverter.convert(icalData);
  }
}

export default PwnDataInput;
