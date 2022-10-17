const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const middlewares = require('./app/Middleware/ErrorHandlers');
const bodyParser = require('body-parser');
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var path = require('path');
global.appRoot = path.resolve(__dirname);


app.use(express.urlencoded({ extended: false, limit: '400MB' }));
app.use(bodyParser.json({ limit: '400MB' }));
app.use(bodyParser.urlencoded({ limit: "400MB", extended: true, parameterLimit: 400000 }));

const AdminRoutes = require('./routes/admin');
const SiteRoutes = require('./routes/api');
app.use(morgan('tiny')); // Console Logging
app.use(compression()); // Compress Responses
app.use(helmet()); // Secure Headers
app.use(express.json()); // Allowing only JSON data to hit
app.use(fileUpload());

// Add headers
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
});

// Routes
app.use('/api/v1/', SiteRoutes);
app.use('/admin/api/v1/', AdminRoutes);

// Error Handlers
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;