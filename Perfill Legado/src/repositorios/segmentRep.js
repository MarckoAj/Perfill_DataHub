import executeQuery from "../infrastructure/database/queries.js";

class SegmentsRepository{
 
  selectSegmentById(segmentId){
    const sql = "SELECT * FROM `segments_auvo` WHERE segmentId = ?"
    return executeQuery(sql,segmentId)

  }

    insertSegment(segments) {
        const sql = "INSERT INTO `segments_auvo` (registrationDate,segmentId, description) VALUES (?, ?, ?)"
        const values = Object.values(segments);
        return executeQuery(sql, values);
      }

}

export default new SegmentsRepository