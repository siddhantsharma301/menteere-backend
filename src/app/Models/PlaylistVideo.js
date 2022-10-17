const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class PlaylistVideo extends Model {
    static get tableName() {
        return tableNames.playlistVideo;
    }
}

module.exports = PlaylistVideo;