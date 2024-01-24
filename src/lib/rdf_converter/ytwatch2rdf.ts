import * as RDF from 'rdflib';
import { JSDOM } from 'jsdom';
import { ContentType } from 'rdflib/lib/types';
import { ConvertError } from '../error';
import { schema, xsd, rdf } from './namespace.const';
import Util from '../util';
import { PeriodUnit, SerializedData } from '../interface';
import { Converter } from './converter.interface';

class YoutubeWatchConverter extends Converter {
  private static init(): void {
    this.rdfGraph = RDF.graph();

    schema.setPrefix(this.rdfGraph);
    xsd.setPrefix(this.rdfGraph);
    rdf.setPrefix(this.rdfGraph);
  }

  private static cleanUpText(text?: string | null): string {
    if (!text) {
      return ``;
    }

    return text.replace(/[\n\r\s]+/g, ` `).trim();
  }

  private static formatDateToRDF(dateString: string): string {
    const formattedDate = dateString.replace(
      /(\d{4})\. (\d{1,2})\. (\d{1,2})\. (오전|오후|am|pm|AM|PM) (\d{1,2}:\d{1,2}:\d{1,2}) .{3}/,
      (_match, year, month, day, ampm, time) => {
        const hours =
          [`오후`, `PM`, `pm`].includes(ampm) && parseInt(time.split(`:`)[0], 10) !== 12
            ? parseInt(time.split(`:`)[0], 10) + 12
            : parseInt(time.split(`:`)[0], 10);

        return `${year}-${month}-${day} ${hours}:${time.split(`:`)[1]}:${time.split(`:`)[2]}`;
      },
    );

    const date = new Date(formattedDate);

    return date.toISOString();
  }

  private static findDateElement(outerCell: Element): string | null {
    const dateElements = outerCell.querySelectorAll(`.content-cell.mdl-cell--6-col.mdl-typography--body-1`);

    if (dateElements.length > 0) {
      const dateText = dateElements[0].textContent;
      const match = dateText?.match(/(\d{4}\. \d{1,2}\. \d{1,2}\. .*)/);

      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private static addElementToGraph(outerCell: Element, index: number): void {
    if (this.rdfGraph) {
      const videoLink = outerCell.querySelector(`a[href^="https://www.youtube.com/watch"]`);
      const channelLink = outerCell.querySelector(`a[href^="https://www.youtube.com/channel"]`);
      const dateElement = this.findDateElement(outerCell);

      const eventDate = dateElement ? this.formatDateToRDF(dateElement.trim()) : ``;
      const eventId = Util.getUrnNamedNode(`google`, `youtube:watch`, eventDate);
      this.rdfGraph.add(eventId, rdf.ns(`type`), schema.ns(`WatchAction`));

      const videoObjectNode = RDF.blankNode(`${eventId}_VideoObject`);
      // const videoObjectNode = RDF.namedNode(`${eventId}_VideoObject`);
      this.rdfGraph.add(videoObjectNode, rdf.ns(`type`), schema.ns(`VideoObject`));
      this.rdfGraph.add(eventId, schema.ns(`object`), videoObjectNode);
      if (videoLink) {
        const videoTitle = videoLink.textContent?.trim();
        const videoURL = videoLink.getAttribute(`href`);
        this.rdfGraph.add(videoObjectNode, schema.ns(`name`), RDF.literal(this.cleanUpText(videoTitle)));
        this.rdfGraph.add(videoObjectNode, schema.ns(`embedUrl`), RDF.literal(this.cleanUpText(videoURL)));
      }

      if (channelLink) {
        const channelName = channelLink.textContent?.trim();
        const channelURL = channelLink.getAttribute(`href`);
        const channelNode = RDF.blankNode(`youtube_channel_${index}`);
        this.rdfGraph.add(videoObjectNode, schema.ns(`creator`), channelNode);
        this.rdfGraph.add(channelNode, schema.ns(`name`), RDF.literal(this.cleanUpText(channelName)));
        this.rdfGraph.add(channelNode, schema.ns(`url`), RDF.literal(this.cleanUpText(channelURL)));
      }

      if (dateElement) {
        const date = this.formatDateToRDF(dateElement.trim());
        this.rdfGraph.add(eventId, schema.ns(`startTime`), RDF.literal(date, xsd.ns(`dateTime`)));
      }
    }
  }

  private static convertToRdf(htmlData: string): void {
    new JSDOM(htmlData).window.document.querySelectorAll(`.outer-cell`).forEach((outerCell, index) => {
      this.addElementToGraph(outerCell, index);
    });
  }

  /**
   *
   * convert Youtube Watch history html Data to RDF
   *
   * @param htmlData - Youtube Watch history html Data string.
   * @param periodUnit - split data by period. default PeriodUnit.all
   * @param format - return format. default 'application/ld+json'
   * @returns rdf string
   *
   */
  static override async convert(
    htmlData: string,
    periodUnit: PeriodUnit = PeriodUnit.all,
    format: ContentType = `application/ld+json`,
  ): Promise<SerializedData> {
    if (htmlData) {
      this.init();
      if (this.rdfGraph) {
        this.convertToRdf(htmlData);
        const res = Util.serializeGraphByPeriod(this.rdfGraph, periodUnit, schema.ns(`startTime`), format);
        this.rdfGraph = null;
        if (res) {
          return res;
        }
      }
    }
    throw new ConvertError();
  }
}

export default YoutubeWatchConverter;
