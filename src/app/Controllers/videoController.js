const { response, catchFailure, CONSTANTS } = require('../Helpers/basics');
const errorMessages = require('../Helpers/errorMessages');
const User = require('../Models/User');
const VideoRecording = require('../Models/VideoRecording');
const VideoPlaylist = require('../Models/VideoPlaylist');
const PlaylistVideo = require('../Models/PlaylistVideos')
const tableNames = require('../../database/tableNames');

exports.getQuickbloxVideos = async (req, res, next) => {
    try {
        const { id, chat_dialog_id } = req.params;
        const data = await VideoRecording.query().where({ chat_dialog_id: chat_dialog_id });

        for (let i = 0; i < data.length; i++) {

            if (data[i].path != null) {
                var AWS = require('aws-sdk');
                var credentials = {
                    accessKeyId: process.env.AWS_ACCESS_KEY,
                    secretAccessKey: process.env.AWS_SECRET_KEY,
                };
                AWS.config.update({ credentials: credentials, region: 'us-east-2' });
                var s3 = new AWS.S3();

                var presignedGETURL = s3.getSignedUrl('getObject', {
                    Bucket: 'menteerebucket',
                    Key: data[i].path, //filename
                    Expires: 30, //time to expire in seconds
                });
                data[i].videoUrl = presignedGETURL;
                data[i].url = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + data[i].path);
            }
        }
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.addVideoToPlaylist = async (req, res, next) => {
    try {
        let { video_id, playlist_id, title } = req.body;
        const auth = await User.getUserByToken(req.headers.authorization);

        if (playlist_id == null || playlist_id == undefined) {
            const data = await VideoPlaylist.query().insert({
                user_id: auth.id,
                title: title
            });
            playlist_id = data.id;
        }
        for (let i = 0; i < video_id.length; i++) {
            const checkifexist = await PlaylistVideo.query().where({
                playlist_id: playlist_id,
                video_id: video_id[i],
            }).first();

            if (!checkifexist) {
                await PlaylistVideo.query().insert({
                    playlist_id: playlist_id,
                    video_id: video_id[i],
                    user_id: auth.id,
                })
            }
        }
        return response(200, res, { message: "Success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getMyVideoPlaylists = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);

        const data = await VideoPlaylist.query().where({
            user_id: auth.id
        });
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getMyVideoPlaylistsFull = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);

        const data = await VideoPlaylist.query().where({
            user_id: auth.id
        });
        console.log("check");
        for (var i in data) {
            data[i].count = 0;
            let playlistVideos = await PlaylistVideo.query().where({
                playlist_id: data[i].id
            });
            data[i].count = playlistVideos.length;
            if (playlistVideos.length > 0) {
                let mainVideo = await VideoRecording.query().where({ id: playlistVideos[0].video_id }).first();
                if (mainVideo) {
                    if (mainVideo.path != null) {
                        data[i].url = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + mainVideo.path)
                    }
                }
            }
        }
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.MenteeMyVideoPlaylistDetail = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        const { id } = req.params;
        let data = await PlaylistVideo.query()
            .select(
                `${tableNames.playlistVideos}.id`,
                `${tableNames.playlistVideos}.video_id`,
                `${tableNames.videoRecordings}.chat_dialog_id`,
                `${tableNames.videoRecordings}.path`,
            )
            .leftJoin(`${tableNames.videoRecordings}`, `${tableNames.playlistVideos}.video_id`, `${tableNames.videoRecordings}.id`)
            .where(`${tableNames.playlistVideos}.playlist_id`, `=`, id);

        let playlistInfo = await VideoPlaylist.query().where({
            id: id
        }).first();

        for (var i in data) {
            data[i].count = 0;
            let playlistVideos = await PlaylistVideo.query().where({
                playlist_id: data[i].id
            });
            data[i].count = playlistVideos.length;
            if (data[i].path != null) {
                var AWS = require('aws-sdk');
                var credentials = {
                    accessKeyId: process.env.AWS_ACCESS_KEY,
                    secretAccessKey: process.env.AWS_SECRET_KEY,
                };
                AWS.config.update({ credentials: credentials, region: 'us-east-2' });
                var s3 = new AWS.S3();

                var presignedGETURL = s3.getSignedUrl('getObject', {
                    Bucket: 'menteerebucket',
                    Key: data[i].path, //filename
                    Expires: 30, //time to expire in seconds
                });
                data[i].pathURL = presignedGETURL;
                data[i].url = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + data[i].path);
            }
            if (playlistVideos.length > 0) {
                let mainVideo = await VideoRecording.query().where({ id: playlistVideos[0].video_id }).first();
                if (mainVideo) {
                    if (mainVideo.path != null) {
                        data[i].url = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + mainVideo.path)
                    }
                }
            }
        }
        return response(200, res, {
            message: "Success", data: {
                data,
                playlistInfo
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}

