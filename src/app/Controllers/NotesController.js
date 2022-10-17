const { response, catchFailure, CONSTANTS } = require('../Helpers/basics');
const errorMessages = require('../Helpers/errorMessages');

const User = require('../Models/User');
const Notes = require('../Models/Notes');
const MediaManager = require('../Helpers/MediaManager');
const Media = require('../Models/Media');
const Playlist = require('../Models/Playlist');
const PlaylistNote = require('../Models/PlaylistNote');
const VideoPlaylist = require('../Models/VideoPlaylist');
const PlaylistVideo = require('../Models/PlaylistVideo')
var PDFImage = require("pdf-image").PDFImage;
const LastReadNotes = require('../Models/LastReadNotes');
const tableNames = require('../../database/tableNames');
const Subscriptions = require('../Models/Subscriptions')
const SubscriptionPlans = require('../Models/SubscriptionPlans');
const Theme = require('../Models/Theme');
const Topic = require('../Models/Topic');
const VideoRecording = require('../Models/VideoRecording');



exports.noteInfo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Notes.query().where({ id: id }).first();

        // data.cover = 'https://kubalubra.is/wp-content/uploads/2017/11/default-thumbnail.jpg';
        data.cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/defaultTemplate/default-thumbnail.jpg');
        if (data.feat_img_id != null) {
            let cover = await Media.query().where({ id: data.feat_img_id }).first();
            if (cover != '') {
                data.cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
            }
        }

        data.doc = '';
        if (data.doc_id != null) {
            let doc = await Media.query().where({ id: data.doc_id }).first();
            if (doc != '') {
                data.doc = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + doc.path);
            }
        }

        data.preview = '';
        if (data.preview_id != null) {
            let preview = await Media.query().where({ id: data.preview_id }).first();
            if (preview != '') {
                data.preview = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + preview.path);
            }
        }

        let themeTitle;
        let topicTitle;
        const themeID = await Theme.query().where({ id: data.theme_id }).first();
        const topicID = await Topic.query().where({ id: data.topic_id }).first();
        if (themeID == undefined) {
            themeTitle = null;
        } else {
            data.theme_id = themeID.title;
        }
        if (topicID == undefined) {
            topicTitle = null;

        } else {
            data.topic_id = topicID.title;
        }


        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.storeMyNotes = async (req, res, next) => {
    try {
        const { title, desc, curriculum_id, subject_id, theme, topic, note_type } = req.body;
        const auth = await User.getUserByToken(req.headers.authorization);
        let chk;
        let chk1;
        if (theme != null && theme != undefined && theme != '') {
            chk = await Theme.query().where({ title: theme }).first();
        }
        if (topic != null && topic != undefined && topic != '') {
            chk1 = await Topic.query().where({ title: topic }).first();
        }


        let themeID, topicID;

        if (chk == undefined && theme != '') {
            themeID = await Theme.query().insert({ title: theme }).returning("id");
        }

        if (chk1 == undefined && topic != '') {
            topicID = await Topic.query().insert({ title: topic }).returning("id");
        }

        let theme_id;
        let topic_id;
        if (themeID == undefined && chk == undefined) {
            theme_id = null;
        } else if (themeID == undefined) {
            theme_id = chk.id;
        } else {
            theme_id = themeID.id
        }

        if (topicID == undefined && chk1 == undefined) {
            topic_id = null;
        } else if (topicID == undefined) {
            topic_id = chk1.id;
        } else {
            topic_id = topicID.id
        }

        const data = await Notes.query().insert({
            title,
            desc,
            curriculum_id,
            subject_id,
            theme_id: theme_id,
            topic_id: topic_id,
            user_id: auth.id,
            note_type,
            status: 0
        });
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.updateMyNotes = async (req, res, next) => {
    try {
        const { title, desc, curriculum_id, subject_id, theme_id, topic_id, note_type } = req.body;
        const { id } = req.params;
        const auth = await User.getUserByToken(req.headers.authorization);
        let chk;
        let chk1;
        if (theme_id != undefined && theme_id != null && theme_id != '') {
            chk = await Theme.query().where({ title: theme_id }).first();
        }
        if (topic_id != undefined && topic_id != null && topic_id != '') {
            chk1 = await Topic.query().where({ title: topic_id }).first();
        }
        let themeID, topicID;

        if (chk == undefined && theme_id != '' && theme_id != null) {
            themeID = await Theme.query().insert({ title: theme_id }).returning("id");
        } else if (chk != undefined && theme_id != '' && theme_id != null) {
            themeID = await Theme.query().where({ id: chk.id }).update({
                title: theme_id,
            }).returning("id");
        }

        if (chk1 == undefined && topic_id != '' && topic_id != null) {
            topicID = await Topic.query().insert({ title: topic_id }).returning("id");
        } else if (chk1 != undefined && topic_id != '' && topic_id != null) {
            topicID = await Topic.query().where({ id: chk1.id }).update({
                title: topic_id,
            }).returning("id");
        }

        let theme;
        let topic;

        if (themeID == undefined && chk == undefined) {
            theme = null;
        } else if (themeID == undefined) {
            theme = chk.id;
        } else {
            theme = themeID.id
        }

        if (themeID == undefined && chk1 == undefined) {
            topic = null;
        } else if (themeID == undefined) {
            topic = chk1.id;
        } else {
            topic = themeID.id
        }


        const data = await Notes.query().where({ id: id }).update({
            title,
            desc,
            curriculum_id,
            subject_id,
            theme_id: theme,
            topic_id: topic,
            note_type
        }).returning("*");

        // const theme = await Theme.query().where({ id: data[0].theme_id }).update({
        //     title: theme_id,
        // }).returning("id");

        // const topic = await Topic.query().where({ id: data[0].topic_id }).update({
        //     title: topic_id,
        // }).returning("id");

        // const data1 = await Notes.query().where({ id: id }).update({
        //     theme_id: theme[0].id,
        //     topic_id: topic[0].id,
        // });
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.deleteMyNotes = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Notes.query().where({ id: id }).update({
            is_deleted: true
        });
        return response(200, res, { message: "Successfully Deleted", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.setNoteCoverPic = async (req, res, next) => {
    try {
        const { base64, id } = req.body;

        const path = `notes/${id}/cover/`;
        const media = await MediaManager.uploadBase64Img(base64, path, 'cover.jpg');
        console.log(media);
        console.log(media.id);
        await Notes.query().where({ id: id }).update({
            feat_img_id: media.id
        });
        const note = await Notes.query().where({ id: id })

        return response(200, res, { message: "Success", data: media });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.uploadNotePDF = async (req, res, next) => {
    try {
        const { id } = req.body;
        const { file } = req.files;

        // Convert the file size to megabytes (optional)
        var fileSize = file.size / (1024 * 1024);

        if (fileSize < 15) {

            const path = `notes/${id}/pdf/`;
            const media = await MediaManager.uploadFileToS3(file, path);

            await Notes.query().where({ id: id }).update({
                doc_id: media.id
            });
            const note = await Notes.query().where({ id: id }).first();
            note.doc = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + media.path);
            return response(200, res, { message: "Success", data: note });
        } else {
            return response(200, res, { message: "File size is too large", data: null });
        }

    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.uploadNotePreview = async (req, res, next) => {
    try {
        const { id, base64 } = req.body;

        const path = `notes/${id}/preview/`;
        const media = await MediaManager.uploadBase64File(base64, path, 'preview.pdf');

        await Notes.query().where({ id: id }).update({
            preview_id: media.id
        });
        const note = await Notes.query().where({ id: id }).first();
        note.preview = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + media.path);
        return response(200, res, { message: "Success", data: note });

    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.setNoteDoc = async (req, res, next) => {
    try {
        const { base64, id } = req.body;

        const path = `notes/${id}/cover/`;
        const media = await MediaManager.uploadBase64Img(base64, path, 'cover.jpg');

        return response(200, res, { message: "Success", data: media });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.myNotes = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        const data = await Notes.query().where({ user_id: auth.id, is_deleted: false }).orderBy('id', 'desc');
        for (var i in data) {
            // data[i].cover = 'https://kubalubra.is/wp-content/uploads/2017/11/default-thumbnail.jpg';
            data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/defaultTemplate/default-thumbnail.jpg');
            if (data[i].feat_img_id != null) {
                let cover = await Media.query().where({ id: data[i].feat_img_id }).first();
                if (cover != '') {
                    data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
                }
                else {
                    //data[i].cover = cover;
                }
            }

            data[i].preview = '';
            if (data[i].preview_id != null) {
                let cover = await Media.query().where({ id: data[i].preview_id }).first();
                if (cover != '') {
                    data[i].preview = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
                }
                else {
                    //data[i].cover = cover;
                }
            }
        }
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.recordLastReadNote = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        const { id } = req.body;
        const date = new Date();
        const checkLastRead = await LastReadNotes.query().where({
            user_id: auth.id,
            note_id: id,
        }).first();
        if (!checkLastRead) {
            await LastReadNotes.query().insert({
                user_id: auth.id,
                note_id: id,
                last_read_time: date,
            })
        } else (
            await LastReadNotes.query().where({
                user_id: auth.id,
                note_id: id,
            }).update({
                last_read_time: date,
            })
        )

        return response(200, res, { message: "Success", data: checkLastRead });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getMyPlaylists = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);

        const data = await Playlist.query().where({
            user_id: auth.id
        });

        return response(200, res, { message: "Success", data: data });

    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getMyPlaylistsFull = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);

        const data = await Playlist.query().where({
            user_id: auth.id
        });

        for (var i in data) {
            data[i].count = 0;
            let playlistNotes = await PlaylistNote.query().where({
                playlist_id: data[i].id
            });
            data[i].count = playlistNotes.length;
            // data[i].cover = 'https://kubalubra.is/wp-content/uploads/2017/11/default-thumbnail.jpg';
            data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/defaultTemplate/default-thumbnail.jpg');
            if (playlistNotes.length > 0) {
                let mainNote = await Notes.query().where({ id: playlistNotes[0].note_id, is_deleted: false }).first();
                if (mainNote) {
                    if (mainNote.feat_img_id != null) {
                        let cover = await Media.query().where({ id: mainNote.feat_img_id }).first();
                        if (cover != '') {
                            data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
                        }
                    }
                }
            }
        }

        return response(200, res, { message: "Success", data: data });

    } catch (error) {
        return catchFailure(res, error);
    }
}




exports.MenteeMyPlaylistDetail = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        const { id } = req.params;
        console.log(id);
        let data = await PlaylistNote.query()
            .select(
                `${tableNames.playlistNote}.id`,
                `${tableNames.playlistNote}.note_id`,
                `${tableNames.notes}.title`,
                `${tableNames.notes}.feat_img_id`,
                `${tableNames.notes}.user_id`,
                `${tableNames.notes}.desc`,
                `${tableNames.user}.name as authorName`,
                `${tableNames.user}.pro_pic_id as authorImageID`,
                `${tableNames.user_verification_meta}.highschool_grade_type as curriculum`,
                `${tableNames.user_verification_meta}.highschool_score as curriculum_score`,
                `${tableNames.universities}.feat_img_id as universityImageID`,
            )
            .leftJoin(`${tableNames.notes}`, `${tableNames.playlistNote}.note_id`, `${tableNames.notes}.id`)
            .leftJoin(`${tableNames.user}`, `${tableNames.notes}.user_id`, `${tableNames.user}.id`)
            .leftJoin(`${tableNames.user_verification_meta}`, `${tableNames.user}.id`, `${tableNames.user_verification_meta}.user_id`)
            .leftJoin(`${tableNames.universities}`, `${tableNames.user_verification_meta}.university`, `${tableNames.universities}.id`)
            .where(`${tableNames.playlistNote}.playlist_id`, `=`, id);

        let playlistInfo = await Playlist.query().where({
            id: id
        }).first();

        playlistInfo.count = data.length;
        // playlistInfo.cover = 'https://kubalubra.is/wp-content/uploads/2017/11/default-thumbnail.jpg';
        playlistInfo.cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/defaultTemplate/default-thumbnail.jpg');
        if (data.length > 0) {
            for (var i in data) {
                let mainNote = await Notes.query().where({ id: data[0].note_id, is_deleted: false }).first();
                if (mainNote) {
                    if (mainNote.feat_img_id != null) {
                        let cover = await Media.query().where({ id: mainNote.feat_img_id }).first();
                        if (cover != '') {
                            data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
                            playlistInfo.cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
                        }
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





exports.addNoteToPlaylist = async (req, res, next) => {
    try {
        let { note_id, playlist_id, title } = req.body;
        const auth = await User.getUserByToken(req.headers.authorization);

        if (playlist_id == null) {
            const data = await Playlist.query().insert({
                user_id: auth.id,
                title: title
            });
            playlist_id = data.id;
        }

        const checkifexist = await PlaylistNote.query().where({
            playlist_id: playlist_id,
            note_id: note_id
        }).first();

        if (!checkifexist) {
            await PlaylistNote.query().insert({
                playlist_id: playlist_id,
                note_id: note_id,
                user_id: auth.id,
            })
        }

        return response(200, res, { message: "Success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getLastRecordNote = async (req, res) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        const data = await LastReadNotes.query().select(
            `${tableNames.lastReadNotes}.user_id`,
            `${tableNames.lastReadNotes}.last_read_time`,
            `${tableNames.notes}.id`,
            `${tableNames.notes}.title`,
            `${tableNames.notes}.feat_img_id`,
            `${tableNames.notes}.desc`,
            `${tableNames.notes}.doc_id`,
            `${tableNames.notes}.preview_id`,
            `${tableNames.user}.name as authorName`,
            `${tableNames.user}.pro_pic_id as authorImageID`,
            `${tableNames.user_verification_meta}.highschool_grade_type as curriculum`,
            `${tableNames.user_verification_meta}.highschool_score as curriculum_score`,
            `${tableNames.universities}.feat_img_id as universityImageID`,
            `${tableNames.universities}.title as universityName`,
        )
            .leftJoin(`${tableNames.notes}`, `${tableNames.lastReadNotes}.note_id`, `${tableNames.notes}.id`)
            .leftJoin(`${tableNames.user}`, `${tableNames.notes}.user_id`, `${tableNames.user}.id`)
            .leftJoin(`${tableNames.user_verification_meta}`, `${tableNames.user}.id`, `${tableNames.user_verification_meta}.user_id`)
            .leftJoin(`${tableNames.universities}`, `${tableNames.user_verification_meta}.university`, `${tableNames.universities}.id`)
            .where(`${tableNames.lastReadNotes}.user_id`, '=', auth.id);

        for (var i in data) {
            data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/defaultTemplate/default-thumbnail.jpg');
            // data[i].cover = 'https://kubalubra.is/wp-content/uploads/2017/11/default-thumbnail.jpg';
            //data[i].authorImageURL = 'http://nashvilleprevention.org/wp-content/uploads/2017/05/headshot.jpeg';
            data[i].authorImageURL = CONSTANTS.BUCKET_URL + 'useraplha/' + (data[i].authorName[0]).toLowerCase() + '.jpeg';
            data[i].universityImageURL = CONSTANTS.UNIVERSITY_PLACEHOLDER_URL;

            if (data[i].feat_img_id != null) {
                let cover = await Media.query().where({ id: data[i].feat_img_id }).first();
                if (cover != '') {
                    data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
                }
            }

            if (data[i].authorImageID != null) {
                let img = await Media.query().where({ id: data[i].authorImageID }).first();
                if (img != '') {
                    data[i].authorImageURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + img.path);
                }
            }

            if (data[i].universityImageID != null) {
                let img = await Media.query().where({ id: data[i].universityImageID }).first();
                if (img != '') {
                    data[i].universityImageURL = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + img.path);
                }
            }
        }

        return response(200, res, { message: "Success", data: data })
    } catch (error) {
        return catchFailure(res, error)
    }
}

exports.getSubscriptionRecord = async (req, res) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        const data = await Subscriptions.query().where({
            user_id: auth.id,
            is_paid: true,
        });

        for (var i = 0; i < data.length; i++) {
            const planInfo = await SubscriptionPlans.query().where({
                id: data[i].plan_id,
            })
            data[i].planDesc = planInfo[0].desc;

        }
        return response(200, res, { message: "success", data: data });
    } catch (error) {
        return catchFailure(res, error)
    }
}

exports.setProfilePicture = async (req, res, next) => {
    try {
        const { base64 } = req.body;
        const auth = await User.getUserByToken(req.headers.authorization);

        const path = `user/${auth.id}/profile/`;
        const rand = Math.floor(Math.random() * Math.floor(2000));
        const name = rand + '-profile.jpg';
        const media = await MediaManager.uploadBase64Img(base64, path, name);
        console.log(media);
        console.log(media.id);
        await User.query().where({ id: auth.id }).update({
            pro_pic_id: media.id
        });
        const note = await User.query().where({ id: auth.id })

        let url = 'https://menteerebucket.s3.us-east-2.amazonaws.com/' + path + name;

        return response(200, res, { message: "Success", data: url });
    } catch (error) {
        return catchFailure(res, error);
    }
}
