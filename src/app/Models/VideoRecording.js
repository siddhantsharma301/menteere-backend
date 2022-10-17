const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class VideoRecording extends Model {
    static get tableName() {
        return tableNames.videoRecordings;
    }
}

module.exports = VideoRecording;