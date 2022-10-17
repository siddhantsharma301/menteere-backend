const {response} = require('../Helpers/basics');

function notFound(req, res, next) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
}

function errorHandler(err, req, res, next) {
    if (err.error && err.error.isJoi) {
      let errDetail = [];
      let primaryMessage = '';
      if (err.error.details) {
        err.error.details.map(function(item) {
          var temp = {};
          temp[item.context.key] = item.message;
          errDetail.push(temp);
          primaryMessage = item.message;
        });
      }
      response(400, res, {
          message: primaryMessage,
          data: errDetail
      });
    } else {
      response(500, res, {
          message: "Error Occured",
          data: err
      });
    }
};
  
module.exports = {
    notFound,
    errorHandler
};