const { createLogger, format, transports, config } = require('winston');

exports.CONSTANTS = {
  BUCKET_URL: 'https://menteerebucket.s3.us-east-2.amazonaws.com/',
  AVATAR_URL: '',
  UNIVERSITY_PLACEHOLDER_URL: ''
}

/* error, warn, info, verbose, debug, silly */
const log = createLogger({
  transports: [
      new transports.Console(),
      new transports.File({ filename: 'src/logs/system.log' })
  ],
});
exports.log = log;

exports.response = (code, res, {message, data={}}) => {
    const resModel = {
      meta: {
        message: message ? message : "",
        code: code ? code : 200
      },
      data: data ? data : {}
    };
   return res.status(code ? code : 200).json(resModel);
};

exports.unauthenticateResponse = (res) => {
  const resModel = {
    meta: {
      message: 'You are unauthenticated',
      code: 401
    },
    data: null
  };
 return res.status(401).json(resModel);
};

exports.catchFailure = (res, error) => {
  const resModel = {
    meta: {
      message: error.message,
      code: 400
    },
    data: error
  };
  log.error(error.message, 'error');
  return res.status(400).json(resModel);
};

exports.getUserPicture = (res, error) => {
  const resModel = {
    meta: {
      message: error.message,
      code: 400
    },
    data: error
  };
  log.error(error.message, 'error');
  return res.status(400).json(resModel);
};

