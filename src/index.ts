import IcalConverter from './lib/ical2rdf';
import YoutubeWatchHistoryConverter from './lib/ytwatch2rdf';

class PwnDataInput {
  test(): string {
    console.log('test');

    return 'test';
  }

  static async convertIcal(data: string): Promise<string> {
    return await IcalConverter.convert(data);
  }
  static async convertYtWatched(data: string): Promise<string> {
    return await YoutubeWatchHistoryConverter.convert(data);
  }
}

export default PwnDataInput;
