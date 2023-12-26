import IcalConverter from './lib/rdf_converter/ical2rdf';
import YoutubeWatchConverter from './lib/rdf_converter/ytwatch2rdf';

class PwnDataInput {
  test(): string {
    console.log('test');

    return 'test';
  }

  static async convertIcal(data: string): Promise<string> {
    return await IcalConverter.convert(data);
  }
  static async convertYtWatched(data: string): Promise<string> {
    return await YoutubeWatchConverter.convert(data);
  }
}

export default PwnDataInput;
