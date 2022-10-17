const {response, catchFailure} = require('../../Helpers/basics');
const User = require('../../Models/User');
const Topic = require('../../Models/Topic');
const Theme = require('../../Models/Theme');
const errorMessages = require('../../Helpers/adminErrorMessages');
const bcrypt = require('bcrypt');

exports.store = async (req, res, next) => {
    try {
        const { title, theme_id } = req.body;
        const auth = await User.getUserByToken(req.headers.authorization);
        const store = await Topic.query().insert({ 
            title,
            theme_id
        });
        return response(200, res, { message: "Topic successfully created", data: store });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.update = async (req, res, next) => {
    try {
        const { title, theme_id } = req.body;
        const { id } = req.params;
        
        await Topic.query().where({ id: id }).update({
            title,
            theme_id
        });

        return response(200, res, { message: "Topic successfully updated", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Topic.query().deleteById(id);
        return response(200, res, { message: "Topic successfully deleted", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.edit = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await Topic.query().where({ id: id }).first();

        return response(200, res, { message: "", data: data });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.fetch = async (req, res, next) => {
    const columns = [
        'id',
        'title',
        'theme_id',
        'options'
    ];

    const limit = req.body.length;
    const start = req.body.start;
    const ordercolumn = req.body['order[0][column]'];
    const order = columns[ordercolumn];

    const dir = req.body['order[0][dir]'];
    let totalData = await Topic.query().count();
    totalData = totalData[0].count;
     

    let posts = [];
    let totalFiltered = 0;
    let search = '';
    if (req.body['search[value]'] == '' || req.body['search[value]'] == null)
    {
        posts = await Topic.query()
        .offset(start)
        .limit(limit)
        .orderBy(order, dir);

        totalFiltered = posts.length;
    }
    else
    {
        search = req.body['search[value]'];
        posts = await Topic.query()
        .whereRaw("LOWER(title) LIKE '%' || LOWER(?) || '%' ", search) 
        .offset(start)
        .limit(limit)
        .orderBy(order, dir);

        console.log(posts.length);

        totalFiltered = posts.length;
    }

    let data = [];
    if (posts.length > 0)
    {
        for(var item in posts) {
            let nestedData = {};
            
            nestedData.id = posts[item].id;
            nestedData.title = posts[item].title;

            let theme = await Theme.query().where({ id: posts[item].theme_id }).first();
            if(theme) {
                nestedData.theme_id = theme.title;
            } else {
                nestedData.theme_id = 'NA';
            }

            nestedData.options = posts[item].id;
            
            data.push(nestedData);
        };
    }

    return res.status(200).json({
        draw: parseInt(req.body['draw']),
        recordsTotal: parseInt(totalData),
        recordsFiltered: parseInt(totalFiltered),
        data: data,
        search: search
    }); 
}