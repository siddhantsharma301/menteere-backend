const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class Theme extends Model {
    static get tableName() {
      return tableNames.theme;
    }
}

module.exports = Theme;