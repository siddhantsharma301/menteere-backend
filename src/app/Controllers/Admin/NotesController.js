const { response, catchFailure } = require('../../Helpers/basics');
const Notes = require('../../Models/Notes');
const Subject = require('../../Models/Subject');
const tableNames = require('../../../database/tableNames');
const Theme = require('../../Models/Theme');
const Topic = require('../../Models/Topic');
const MediaManager = require('../../Helpers/MediaManager')
const Media = require('../../Models/Media')
const Curriculums = require('../../Models/Curriculums');
const PlaylistNote = require('../../Models/PlaylistNote')


exports.storeNote = async (req, res, next) => {
    try {
        const { title, desc, topic_id, status, curriculum_id, subject_id, theme_id, user_id } = req.body;
        const store = await Notes.query().insert({
            curriculum_id,
            subject_id,
            theme_id,
            topic_id,
            title,
            desc,
            status,
            user_id,
        });
        return response(200, res, { message: "Note successfully created", data: store });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.updateNote = async (req, res, next) => {
    try {
        const { title, desc, topic, status, user_id, curriculum_id, subject_id, topic_id, theme_id } = req.body;
        const { id } = req.params;
        let chk, chk1;
        if (theme_id) {
            chk = await Theme.query().where({ title: theme_id }).first();
        }

        if (topic_id) {
            chk1 = await Topic.query().where({ title: topic_id }).first();
        }

        let themeID, topicID;

        if (chk == undefined && theme_id != '') {
            themeID = await Theme.query().insert({ title: theme_id }).returning("id");
        }

        if (chk1 == undefined && topic_id != '') {
            topicID = await Topic.query().insert({ title: topic_id }).returning("id");
        }

        let theme_Id;
        let topic_Id;
        if (themeID == undefined && chk == undefined) {
            theme_Id = null;
        } else if (themeID == undefined) {
            theme_Id = chk.id;
        } else {
            theme_Id = themeID.id
        }

        if (topicID == undefined && chk1 == undefined) {
            topic_Id = null;
        } else if (topicID == undefined) {
            topic_Id = chk1.id;
        } else {
            topic_Id = topicID.id
        }

        await Notes.query().where({ id: id }).update({
            title,
            desc,
            topic,
            status,
            user_id,
            curriculum_id,
            subject_id,
            theme_id: theme_Id,
            topic_id: topic_Id,
        });

        return response(200, res, { message: "Note successfully updated", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.deleteNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const playlist = await PlaylistNote.query().where({ note_id: id }).first();
        if (playlist)
            await PlaylistNote.query().deleteById(playlist.id);
        await Notes.query().deleteById(id);
        return response(200, res, { message: "Note successfully deleted", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.editNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Notes.query().where({ id: id }).first();
        let theme, topic;
        if (data) {
            theme = await Theme.query().where({ id: data.theme_id }).first();
            topic = await Topic.query().where({ id: data.topic_id }).first();
        }

        if (theme) {
            data.theme_id = theme.title;
        }
        if (topic) {
            data.topic_id = topic.title;
        }

        return response(200, res, { message: "", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.fetchNotes = async (req, res, next) => {
    const columns = [
        'id',
        'title',
        'topic',
        'options'
    ];

    const limit = req.body.length;
    const start = req.body.start;
    const ordercolumn = req.body['order[0][column]'];
    let order = columns[ordercolumn];

    const dir = req.body['order[0][dir]'];
    let totalData = await Notes.query().count();
    totalData = totalData[0].count;


    let posts = [];
    let totalFiltered = 0;
    let search = '';
    if (req.body['search[value]'] == '' || req.body['search[value]'] == null) {
        try {
            posts = await Notes.query().select(
                `${tableNames.notes}.id as notesID`,
                `${tableNames.notes}.title`,
                `${tableNames.notes}.user_id`,
                `${tableNames.notes}.created_at as uploadedTime`,
                `${tableNames.notes}.status as notesVerified`,
                `${tableNames.user}.name`,
                `${tableNames.user}.is_mentor`,
                `${tableNames.user}.verification_status as UserStatus`
            )
                .leftJoin(`${tableNames.user}`, `${tableNames.user}.id`, `${tableNames.notes}.user_id`)
                .orderBy('uploadedTime', 'desc')



        } catch (error) {

        }

        totalFiltered = posts.length;
    }
    else {
        search = req.body['search[value]'];
        try {
            if (order == 'id')
                order = 'notes.' + order;
            posts = await Notes.query().select(
                `${tableNames.notes}.id as notesID`,
                `${tableNames.notes}.title`,
                `${tableNames.notes}.user_id`,
                `${tableNames.notes}.created_at as uploadedTime`,
                `${tableNames.notes}.status as notesVerified`,
                `${tableNames.user}.name`,
            )
                .leftJoin(`${tableNames.user}`, `${tableNames.user}.id`, `${tableNames.notes}.user_id`)
                .whereRaw(`LOWER(title) LIKE '%' || LOWER(?) || '%' `, search)
                .offset(start)
                .limit(limit)
                .orderBy(order, dir);

        } catch (error) {
            console.log(error);
        }
        console.log(posts.length);

        totalFiltered = posts.length;

    }
    let data = [];
    if (posts.length > 0) {
        posts.forEach(item => {
            let nestedData = {};
            const upload = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(item.uploadedTime);
            console.log(upload);
            nestedData.id = item.notesID;
            nestedData.title = item.title;
            nestedData.topic = item.user_id;
            nestedData.name = item.name;
            nestedData.options = item.notesID;
            // nestedData.uploadedTime = item.uploadedTime.toLocaleDateString('en-GB');
            nestedData.uploadedTime = upload;
            nestedData.notesVerified = item.notesVerified;
            if (item.notesVerified == 0) {
                nestedData.notesVerified = "Not Verified"
            }
            else if (item.notesVerified == 1) {
                nestedData.notesVerified = "Verified"
            }
            else {
                nestedData.notesVerified = "Rejected    "
            }
            if (item.is_mentor) {
                nestedData.is_mentor = 'Menter'
            } else {
                nestedData.is_mentor = "Mentee"
            }
            if (item.UserStatus == 0) {
                nestedData.verificationStatus = 'Not Verified'
            }

            else if (item.UserStatus == 1) {
                nestedData.verificationStatus = 'Verified'
            }

            else {
                nestedData.verificationStatus = 'Not Verified'
            }

            data.push(nestedData);
        });
    }

    return res.status(200).json({
        draw: parseInt(req.body['draw']),
        recordsTotal: parseInt(totalData),
        recordsFiltered: parseInt(totalFiltered),
        data: data,
        search: search
    });
}

exports.getCurriculumsDetails = async (req, res, next) => {
    try {

        const curriculum = await Curriculums.query().select(
            `${tableNames.curriculums}.id as curriculum_id`,
            `${tableNames.curriculums}.title as curriculum`,
        )
        // .where(`${tableNames.meta_info}.type`, '=', 'curriculum')
        // ;

        return response(200, res, { message: "success", data: curriculum })
    } catch (error) {
        return catchFailure(res, error)
    }
}


exports.getSubjectDetails = async (req, res, next) => {
    try {
        const subject = await Subject.query().select(
            `${tableNames.subject}.id as subject_id`,
            `${tableNames.subject}.title as subject`,
        )
        return response(200, res, { message: "success", data: subject })
    } catch (error) {
        return catchFailure(res, error)
    }
}

exports.getTheme = async (req, res, next) => {
    try {

        const { id } = req.params;
        const theme = await Theme.query().where(`${tableNames.theme}.subject_id`, '=', id)

        return response(200, res, { message: "success", data: theme })
    } catch (error) {
        return catchFailure(res, error)
    }
}

exports.getSubjectsByCurriculumID = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Subject.query().where({
            curriculum_id: id
        });
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getTopic = async (req, res, next) => {
    try {

        const { id } = req.params;
        const topic = await Topic.query().where(`${tableNames.topic}.theme_id`, '=', id)

        return response(200, res, { message: "success", data: topic })
    } catch (error) {
        return catchFailure(res, error)
    }
}


exports.uploadNotePDF = async (req, res, next) => {
    try {
        const { id } = req.body;
        const { file } = req.files;

        const path = `notes/${id}/pdf/`;
        const media = await MediaManager.uploadFileToS3(file, path);

        await Notes.query().where({ id: id }).update({
            doc_id: media.id
        });
        const note = await Notes.query().where({ id: id }).first();
        note.doc = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + media.path);
        return response(200, res, { message: "Success", data: note });

    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.NotesUploaded = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Notes.query().where({ user_id: id }).orderBy('id', 'desc');
        for (var i in data) {
            // data[i].cover = 'https://kubalubra.is/wp-content/uploads/2017/11/default-thumbnail.jpg';
            data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/defaultTemplate/default-thumbnail.jpg');
            if (data[i].feat_img_id != null) {
                let cover = await Media.query().where({ id: data[i].feat_img_id }).first();
                if (cover != '') {
                    data[i].cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
                }
            }

            data[i].preview = '';
            if (data[i].preview_id != null) {
                let cover = await Media.query().where({ id: data[i].preview_id }).first();
                if (cover != '') {
                    data[i].preview = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
                }
            }
        }
        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


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
        let theme, topic;
        if (data.theme_id) {
            theme = await Theme.query().where({ id: data.theme_id }).first();
            data.theme_id = theme.title;
        }

        if (data.topic_id) {
            topic = await Topic.query().where({ id: data.topic_id }).first();

            data.topic_id = topic.title;
        }


        return response(200, res, { message: "Success", data: data });
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
