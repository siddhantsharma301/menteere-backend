const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class MetaInfo extends Model {
    static get tableName() {
      return tableNames.meta_info;
    }
}

module.exports = MetaInfo;