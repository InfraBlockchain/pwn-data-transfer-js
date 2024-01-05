/**
 * convert target type
 */
export const ConvertType = {
  ical: `ical`,
  youtubeWatch: `youtube-watch`,
  uberTrip: `uber-trip`,
} as const;
export type ConvertType = (typeof ConvertType)[keyof typeof ConvertType];

/**
 * period unit
 */
export const PeriodUnit = {
  all: `all`,
  day: `day`,
  month: `month`,
  quarter: `quarter`,
  semiAnnual: `semi-annual`,
  yearly: `yearly`,
} as const;
export type PeriodUnit = (typeof PeriodUnit)[keyof typeof PeriodUnit];
/**
 * convert return type. period and serialized data
 */
export interface SerializedData {
  periodUnit: PeriodUnit;
  /**
   * example "2022-01-01": "rdf data"
   */
  serializes: {
    [periodKey: string]: string;
  };
}
