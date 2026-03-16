import segmentRep from "../repositorios/segmentRep.js";
import checkField from "./validations.js";
import logger from "../logger.js";

class SegmentsModel {
  async addSegment(segment) {
    try {
      if (await checkField.segmentNotExistsInDB(segment.id)) {
        await segmentRep.insertSegment(segment);
      }
    } catch (error) {
      logger.error('Error adding segment:', error);
      throw new Error('Error adding segment');
    }
  }

  async addSegmentsList(segmentList) {
    logger.info(`Adding Segments from list (${segmentList.length} Segments Found)`);

    try {
      for (const segment of segmentList) {
        await this.addSegment(segment);
      }
    } catch (error) {
      logger.error('Error adding segments from list:', error);
      throw new Error('Error adding segments from list');
    }
  }
}

export default new SegmentsModel();
