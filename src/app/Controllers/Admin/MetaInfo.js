const { response, catchFailure } = require('../../Helpers/basics');
const MetaInfo = require('../../Models/MetaInfo');
const MediaManager = require('../../Helpers/MediaManager');
const Media = require('../../Models/Media');
const Curriculums = require('../../Models/Curriculums');
const Universities = require('../../Models/Universities');

exports.store = async (req, res, next) => {
    try {
        let { title, type, is_active, imageFile, filename, level } = req.body;
        if (level == 'null') {
            level = "null"
        }
        const store = await MetaInfo.query().insert({
            title,
            type,
            is_active,
            level,
        });

        let media;
        if (filename != null && imageFile != null) {
            const universityId = store.id;
            const path = `university/${universityId}/cover/`;
            if (filename != null) {
                media = await MediaManager.uploadBase64Img(imageFile, path, filename);

                await Universities.query().where({ id: universityId }).update({
                    feat_img_id: media.id
                })
            }
        }
        return response(200, res, { message: "Successfully created", data: { store, media } });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.updateUniversityCover = async (req, res, next) => {
    try {
        const { base64, id } = req.body;

        const path = `university/${id}/cover/`;
        const media = await MediaManager.uploadBase64Img(base64, path, 'cover.jpg');
        await Universities.query().where({ id: id }).update({
            feat_img_id: media.id
        });


        return response(200, res, { message: "Success", data: media });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.update = async (req, res, next) => {
    try {
        const { title, type, is_active, imageFile, filename, level } = req.body;
        const { id } = req.params;

        await MetaInfo.query().where({ id: id }).update({
            title,
            type,
            is_active,
            level
        });

        if (filename != null) {
            const path = `university/${id}/cover/`;
            const media = await MediaManager.uploadBase64Img(imageFile, path, filename);
            await Universities.query().where({ id: id }).update({
                feat_img_id: media.id
            })
        }

        return response(200, res, { message: "Successfully updated", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        await MetaInfo.query().deleteById(id);
        return response(200, res, { message: "Successfully deleted", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.edit = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await MetaInfo.query().where({ id: id }).first();
        data.cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/defaultTemplate/default-thumbnail.jpg');
        if (data.feat_img_id != null) {
            let cover = await Media.query().where({ id: data.feat_img_id }).first();
            if (cover != '') {
                data.cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
            }
        }


        return response(200, res, { message: "", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.fetch = async (req, res, next) => {
    const columns = [
        'id',
        'title',
        'type',
        'options'
    ];

    const limit = req.body.length;
    const start = req.body.start;
    const ordercolumn = req.body['order[0][column]'];
    const order = columns[ordercolumn];

    const dir = req.body['order[0][dir]'];
    let totalData = await MetaInfo.query().count();
    totalData = totalData[0].count;


    let posts = [];
    let totalFiltered = 0;
    let search = '';
    let type = '';
    if (req.body['search[value]'] == '' || req.body['search[value]'] == null) {
        type = req.body['type'];
        posts = await MetaInfo.query()
            .where({ type: type })
            .offset(start)
            .limit(limit)
            .orderBy(order, dir);

        totalFiltered = posts.length;
    }
    else {
        search = req.body['search[value]'];
        posts = await MetaInfo.query()
            .whereRaw("LOWER(title) LIKE '%' || LOWER(?) || '%' ", search)
            .offset(start)
            .limit(limit)
            .orderBy(order, dir);

        console.log(posts.length);

        totalFiltered = posts.length;
    }

    let data = [];
    if (posts.length > 0) {
        posts.forEach(item => {
            let nestedData = {};

            nestedData.id = item.id;
            nestedData.title = item.title;
            nestedData.type = item.type;
            nestedData.options = item.id;

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

exports.universityInfo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Notes.query().where({ id: id }).first();

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

        return response(200, res, { message: "Success", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.fetchCurriculums = async (req, res, next) => {
    try {
        const columns = [
            'id',
            'title',
            'options'
        ];

        const limit = req.body.length;
        const start = req.body.start;
        const ordercolumn = req.body['order[0][column]'];
        const order = columns[ordercolumn];

        const dir = req.body['order[0][dir]'];
        let totalData = await Curriculums.query().count();
        totalData = totalData[0].count;


        let posts = [];
        let totalFiltered = 0;
        let search = '';
        if (req.body['search[value]'] == '' || req.body['search[value]'] == null) {
            posts = await Curriculums.query()
                .where({ is_active: true })
                .offset(start)
                .limit(limit)
                .orderBy(order, dir);

            totalFiltered = posts.length;
        }
        else {
            search = req.body['search[value]'];
            posts = await Curriculums.query()
                .whereRaw("LOWER(title) LIKE '%' || LOWER(?) || '%' ", search)
                .offset(start)
                .limit(limit)
                .orderBy(order, dir);

            totalFiltered = posts.length;
        }

        let data = [];
        if (posts.length > 0) {
            posts.forEach(item => {
                let nestedData = {};

                nestedData.id = item.id;
                nestedData.title = item.title;
                nestedData.options = item.id;

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
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.storeCurriculum = async (req, res, next) => {
    try {
        let { title, type, is_active } = req.body;

        const store = await Curriculums.query().insert({
            title,
            type,
            is_active,
        });

        return response(200, res, { message: "Successfully created", data: { store } });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.updateCurriculum = async (req, res, next) => {
    try {
        const { title, is_active } = req.body;
        const { id } = req.params;

        await Curriculums.query().where({ id: id }).update({
            title,
            is_active,
        });
        return response(200, res, { message: "Successfully updated", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.editCurriculum = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Curriculums.query().where({ id: id }).first();

        return response(200, res, { message: "", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.deleteCurriculum = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Curriculums.query().deleteById(id);
        return response(200, res, { message: "Successfully deleted", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}



exports.fetchUniversities = async (req, res, next) => {
    try {
        const columns = [
            'id',
            'title',
            'level',
            'options'
        ];

        const limit = req.body.length;
        const start = req.body.start;
        const ordercolumn = req.body['order[0][column]'];
        const order = columns[ordercolumn];

        const dir = req.body['order[0][dir]'];
        let totalData = await Universities.query().count();
        totalData = totalData[0].count;


        let posts = [];
        let totalFiltered = 0;
        let search = '';
        if (req.body['search[value]'] == '' || req.body['search[value]'] == null) {
            posts = await Universities.query()
                .where({ is_active: true })
                .offset(start)
                .limit(limit)
                .orderBy(order, dir);

            totalFiltered = posts.length;
        }
        else {
            search = req.body['search[value]'];
            posts = await Universities.query()
                .whereRaw("LOWER(title) LIKE '%' || LOWER(?) || '%' ", search)
                .offset(start)
                .limit(limit)
                .orderBy(order, dir);

            totalFiltered = posts.length;
        }

        let data = [];
        if (posts.length > 0) {
            posts.forEach(item => {
                if (item.level == 1) {
                    item.level = 'Top 5';
                } else if (item.level == 2) {
                    item.level = 'Top 20';
                } else if (item.level == 3) {
                    item.level = 'Top 40';
                }
                let nestedData = {};

                nestedData.id = item.id;
                nestedData.title = item.title;
                nestedData.level = item.level;
                nestedData.options = item.id;

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
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.storeUniversity = async (req, res, next) => {
    try {
        let { title, level, is_active, imageFile, filename } = req.body;

        if (level == '') {
            level = null;
        }

        const store = await Universities.query().insert({
            title,
            level,
            is_active,
        });

        let media;
        if (filename != null && imageFile != null) {
            const universityId = store.id;
            const path = `university/${universityId}/cover/`;
            if (filename != null) {
                media = await MediaManager.uploadBase64Img(imageFile, path, filename);
                await Universities.query().where({ id: universityId }).update({
                    feat_img_id: media.id
                })
            }
        }

        return response(200, res, { message: "Successfully created", data: { store } });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.updateUniversity = async (req, res, next) => {
    try {
        let { title, is_active, level, imageFile, filename } = req.body;
        const { id } = req.params;


        if (level == '') {
            level = null;
        }
        await Universities.query().where({ id: id }).update({
            title,
            is_active,
            level,
        });

        if (filename != null) {
            const path = `university/${id}/cover/`;
            const media = await MediaManager.uploadBase64Img(imageFile, path, filename);
            await Universities.query().where({ id: id }).update({
                feat_img_id: media.id
            })
        }

        return response(200, res, { message: "Successfully updated", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.editUniversity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Universities.query().where({ id: id }).first();

        data.cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/defaultTemplate/default-thumbnail.jpg');
        if (data.feat_img_id != null) {
            let cover = await Media.query().where({ id: data.feat_img_id }).first();
            if (cover != '') {
                data.cover = encodeURI('https://menteerebucket.s3.us-east-2.amazonaws.com/' + cover.path);
            }
        }


        return response(200, res, { message: "", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.deleteUniversity = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Universities.query().deleteById(id);
        return response(200, res, { message: "Successfully deleted", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}