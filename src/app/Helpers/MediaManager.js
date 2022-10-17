const { response, catchFailure } = require('../Helpers/basics');
const errorMessages = require('../Helpers/errorMessages');
const fs = require('fs');

const AWS = require('aws-sdk');
const Media = require('../Models/Media')

exports.uploadBase64Img = async (base64, path, filename = '') => {
    if (filename == '') {
        const ext = '.jpg';
        const rand = Math.floor(Math.random() * Math.floor(80));
        filename = rand + ext;
    }
    const fullPath = path + filename;
    const type = 'image/jpeg';
    const media = await Media.query().insert({
        name: filename,
        file: filename,
        path: fullPath,
        type: type
    });

    let s3bucket = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: 'us-east-2'
    });
    let data = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fullPath,
        Body: Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64'),
        ContentEncoding: 'base64',
        ContentType: type,
        ACL: 'public-read'
    };
    await s3bucket.putObject(data, function (err, _resp) {
        if (err) {
            console.log(err);
            console.log('Error uploading data: ', _resp);
            return false;
        }
    }).promise();
    return media;
}

exports.uploadBase64File = async (base64, path, filename = '') => {
    if (filename == '') {
        const ext = '.pdf';
        const rand = Math.floor(Math.random() * Math.floor(80));
        filename = rand + ext;
    }
    const fullPath = path + filename;
    const type = 'application/pdf';
    const media = await Media.query().insert({
        name: filename,
        file: filename,
        path: fullPath,
        type: type
    });

    let s3bucket = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: 'us-east-2'
    });
    let data = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fullPath,
        Body: Buffer.from(base64.replace("data:application/pdf;filename=generated.pdf;base64,", ""), 'base64'),
        ContentEncoding: 'base64',
        ContentType: type,
        ACL: 'public-read'
    };
    await s3bucket.putObject(data, function (err, _resp) {
        if (err) {
            console.log(err);
            console.log('Error uploading data: ', _resp);
            return false;
        }
    }).promise();
    return media;
}

exports.uploadFileToS3 = async (file, path) => {
    const rand = Math.floor(Math.random() * Math.floor(999999999));
    const filename = rand + file.name;
    const fullPath = path + filename;

    const media = await Media.query().insert({
        name: file.name,
        file: filename,
        path: fullPath,
        type: file.mimetype
    });
    const s3bucket = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: 'us-east-2',
        Bucket: process.env.AWS_BUCKET_NAME,
    });

    // Setting up S3 upload parameters
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fullPath,
        Body: file.data,
        ContentType: file.mimetype,
        ACL: 'public-read'
    };

    const upload = await s3bucket.upload(params, function (err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    }).promise();
    return media;
}
