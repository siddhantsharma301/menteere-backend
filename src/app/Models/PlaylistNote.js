const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class PlaylistNote extends Model {
    static get tableName() {
      return tableNames.playlistNote;
    }
}

module.exports = PlaylistNote;