const { response, catchFailure } = require('../../Helpers/basics');
const Subject = require('../../Models/Subject');
const Theme = require('../../Models/Theme');
const tableNames = require('../../../database/tableNames');


exports.getSubjects = async (req, res, next) => {
    try {
        const store = await Subject.query();
        return response(200, res, { message: "", data: store });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getThemes = async (req, res, next) => {
    try {
        const store = await Theme.query();
        return response(200, res, { message: "", data: store });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.store = async (req, res, next) => {
    try {
        const { title, curriculum_id, type, is_active } = req.body;
        const store = await Subject.query().insert({
            title,
            curriculum_id,
        });
        return response(200, res, { message: "Successfully created", data: store });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.update = async (req, res, next) => {
    try {
        const { title, curriculum_id } = req.body;
        const { id } = req.params;

        await Subject.query().where({ id: id }).update({
            title,
            curriculum_id: curriculum_id
        });

        return response(200, res, { message: "Successfully updated", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Subject.query().deleteById(id);
        return response(200, res, { message: "Successfully deleted", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.edit = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Subject.query().where({ id: id }).first();

        return response(200, res, { message: "", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.fetch = async (req, res, next) => {
    const columns = [
        'id',
        'title',
        'curriculum_id',
        'curriculum',
        'options'
    ];

    const limit = req.body.length;
    const start = req.body.start;
    const ordercolumn = req.body['order[0][column]'];
    const order = columns[ordercolumn];

    const dir = req.body['order[0][dir]'];
    let totalData = await Subject.query().count();
    totalData = totalData[0].count;


    let posts = [];
    let totalFiltered = 0;
    let search = '';
    if (req.body['search[value]'] == '' || req.body['search[value]'] == null) {
        posts = await Subject.query().
            select(
                `${tableNames.subject}.id`,
                `${tableNames.subject}.title`,
                `${tableNames.subject}.curriculum_id`,
                `${tableNames.curriculums}.title as curriculum`
            )
            .leftJoin(`${tableNames.curriculums}`, `${tableNames.subject}.curriculum_id`, `${tableNames.curriculums}.id`)
            //.where({type: type})
            .offset(start)
            .limit(limit)
            .orderBy(order, dir);

        totalFiltered = posts.length;
    }
    else {
        search = req.body['search[value]'];
        posts = await Subject.query()
            .select(
                `${tableNames.subject}.id`,
                `${tableNames.subject}.title`,
                `${tableNames.subject}.curriculum_id`,
                `${tableNames.curriculums}.title as curriculum`
            )
            .leftJoin(`${tableNames.curriculums}`, `${tableNames.subject}.curriculum_id`, `${tableNames.curriculums}.id`)
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
            nestedData.curriculum_id = item.curriculum_id;
            nestedData.curriculum = item.curriculum;
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