const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class MentorshipRatings extends Model {
    static get tableName() {
      return tableNames.mentorshipRatings;
    }
}

module.exports = MentorshipRatings;