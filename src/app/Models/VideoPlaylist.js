const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class VideoPlaylist extends Model {
    static get tableName() {
        return tableNames.videoPlaylist;
    }
}

module.exports = VideoPlaylist;