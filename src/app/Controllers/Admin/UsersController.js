const multer = require('multer')
const readXlsxFile = require('read-excel-file/node')
const { response, catchFailure, CONSTANTS } = require('../../Helpers/basics');
const User = require('../../Models/User');
const errorMessages = require('../../Helpers/adminErrorMessages');
const bcrypt = require('bcrypt');
const UserVerification = require('../../Models/UserVerification');
const tableNames = require('../../../database/tableNames');
const MetaInfo = require('../../Models/MetaInfo');
const Media = require('../../Models/Media');
const Curriculums = require('../../Models/Curriculums');
const Universities = require('../../Models/Universities');
const QuickBlox = require('quickblox/quickblox').QuickBlox;
const QB = new QuickBlox();

const dirName = global.appRoot.trim();


exports.storeUser = async (req, res, next) => {
    try {
        const { name, email, password, is_mentor, verification_status, rejection_reason, fee_per_hour } = req.body;
        let chkEmail = email.toLowerCase();
        const existingUser = await User.query().where({ email: chkEmail }).first();
        if (existingUser) throw new Error(errorMessages.emailInUse);

        const hashedPassword = await bcrypt.hash(password, 12);
        let newuser;
        if (fee_per_hour != "") {
            newuser = await User.query().insert({
                name,
                email: chkEmail,
                is_mentor,
                verification_status,
                rejection_reason,
                password: hashedPassword,
                fee_per_hour,
            }).returning('id');
        } else {
            newuser = await User.query().insert({
                name,
                email: chkEmail,
                is_mentor,
                verification_status,
                rejection_reason,
                password: hashedPassword,
                fee_per_hour: "0",
            });
        }
        newuser.password = '';

        return response(200, res, { message: "User successfully created", data: newuser });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.updateUser = async (req, res, next) => {
    try {
        const { name, email, password, is_mentor, verification_status, rejection_reason } = req.body;
        let { fee_per_hour } = req.body;
        const { id } = req.params;
        const existingUser = await User.query().where({ id: id }).first();
        if (!existingUser) throw new Error(errorMessages.userDoNotExist);
        let chkEmail = email.toLowerCase();
        if (existingUser.email != chkEmail) {
            const existingEmail = await User.query().where({ email: chkEmail }).first();
            if (existingEmail) throw new Error(errorMessages.emailInUse);
        }


        if (fee_per_hour == '') {
            fee_per_hour = 0
        }
        let updatedata = {
            name,
            email: chkEmail,
            is_mentor,
            verification_status,
            rejection_reason,
            fee_per_hour,
        };

        if (password != '') {
            updatedata.password = await bcrypt.hash(password, 12);
        }

        const userUpdate = await User.query().where({ id: id }).update(updatedata);
        return response(200, res, { message: "User successfully updated", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const getUser = await User.query().select("is_deleted").where({ id: id }).first();
        if (getUser.is_deleted) {
            const setDelete = await User.query().where({ id: id }).update({
                is_deleted: false,
                verification_status: 1,
            })
        }
        else {
            const setDelete = await User.query().where({ id: id }).update({
                is_deleted: true,
                verification_status: 3,
            })
        }
        return response(200, res, { message: "User successfully deleted", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.editUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.query().where({ id: id }).first();
        user.password = '';
        let userMeta = null;
        if (user.is_mentor) {
            userMeta = await UserVerification.query().where({ user_id: id }).first();
            if (!userMeta) {
                await UserVerification.query().insert({ user_id: id });
                userMeta = await UserVerification.query().where({ user_id: id }).first();
            }
        }

        return response(200, res, {
            message: "", data: {
                user: user,
                userMeta: userMeta
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.getUsersDetails = async (req, res, next) => {
    try {
        const users = await User.query().select(
            `${tableNames.user}.id as user_id`,
            `${tableNames.user}.name`

        )
        return response(200, res, { message: "success", data: users })
    } catch (error) {
        return catchFailure(res, error)
    }
}

exports.getUsersDocument = async (req, res, next) => {
    try {
        const documents = await MetaInfo.query().select(
            `${tableNames.meta_info}.id as document_id`,
            `${tableNames.meta_info}.title as document`
        )
            .where(`${tableNames.meta_info}.type`, '=', 'document_type')
        return response(200, res, { message: "success", data: documents })
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.getUserDetails = async (req, res, next) => {
    try {
        let user = await User.query().select(
            `${tableNames.user}.id as user_id`,
            `${tableNames.user}.email`,
            `${tableNames.user}.is_mentor`,
            `${tableNames.user}.name`,
            `${tableNames.user}.verification_status`,
            `${tableNames.user}.pro_pic_id`,
            `${tableNames.user}.fee_per_hour`,
            `${tableNames.user_verification_meta}.personal_doc_type`,
            `${tableNames.user_verification_meta}.personal_doc_ids`,
            `${tableNames.user_verification_meta}.linkedin_url`,
            `${tableNames.user_verification_meta}.major`,
            `${tableNames.user_verification_meta}.highschool_score`,
            `${tableNames.user_verification_meta}.other_ql_json`,
            `${tableNames.user_verification_meta}.university_accepted_json`,
            `${tableNames.user_verification_meta}.upi_id`,
            `${tableNames.user_verification_meta}.highschool_doc_ids`,
            `${tableNames.user_verification_meta}.other_ql_json`,
            `${tableNames.user_verification_meta}.university_accepted_json`,
            `${tableNames.universities}.title as university`,
            `${tableNames.user_verification_meta}.highschool_grade_type`,
            `${tableNames.user_verification_meta}.otherUniversity`,
            `${tableNames.user_verification_meta}.otherCurriculum`,
            `${tableNames.user_verification_meta}.otherQualification`,
            `${tableNames.user_verification_meta}.otherUniversityAcceptedTo`,
            `MetaCurriculum.title as highschool_grade_type`,
            `${tableNames.media}.path as pro_pic_url`,
        )
            .leftJoin(`${tableNames.user_verification_meta}`, `${tableNames.user_verification_meta}.user_id`, `${tableNames.user}.id`)
            .leftJoin(`${tableNames.universities}`, `${tableNames.user_verification_meta}.university`, `${tableNames.universities}.id`)
            .leftJoin(`${tableNames.curriculums} as MetaCurriculum`, `${tableNames.user_verification_meta}.highschool_grade_type`, `MetaCurriculum.id`)
            .leftJoin(`${tableNames.media}`, `${tableNames.user}.pro_pic_id`, `${tableNames.media}.id`)
            .leftJoin(`${tableNames.media} as MetaHighSchool`, `${tableNames.user_verification_meta}.highschool_grade_type`, `MetaHighSchool.id`)
            .where(`${tableNames.user}.id`, '=', req.params.id).first()

        user.highSchoolDocs = [];
        user.otherQualificationDocs = [];
        user.UniversityDocs = [];
        user.personalDocs = [];

        user = await user;
        if (user.personal_doc_ids != '' && user.personal_doc_ids != null) {
            var ids = user.personal_doc_ids.split(',');
            for (var i in ids) {
                let cover = await Media.query().where({ id: ids[i] }).first();
                let url = '';
                if (cover != '') {
                    url = encodeURI(CONSTANTS.BUCKET_URL + cover.path);
                }
                user.personalDocs.push({ doc_id: ids[i], url, path: cover.file });
            }
        }
        if (user.pro_pic_id != null) {
            let img = await Media.query().where({ id: user.pro_pic_id }).first();
            user.pro_pic_url = encodeURI(CONSTANTS.BUCKET_URL + img.path)
        }
        if (user.highschool_doc_ids != '' && user.highschool_doc_ids != null) {
            var ids = user.highschool_doc_ids.split(',');
            for (var i in ids) {
                let cover = await Media.query().where({ id: ids[i] }).first();
                let url = '';
                url = encodeURI(CONSTANTS.BUCKET_URL + cover.path);
                user.highSchoolDocs.push({ doc_id: ids[i], url, path: cover.file });
            }
        }
        if (user.other_ql_json != '' && user.other_ql_json != null) {
            let other = JSON.parse(user.other_ql_json);
            for (var j in other) {
                var object = other[j];
                object.docs = [];
                if (object.docids != null && object.docids != '') {
                    object.docids = object.docids.toString();
                    var ids = object.docids.split(',');
                    for (var k in ids) {
                        let cover = await Media.query().where({ id: ids[k] }).first();
                        let url = '';
                        url = encodeURI(CONSTANTS.BUCKET_URL + cover.path);
                        object.docs.push({ doc_id: ids[i], url, path: cover.file });
                    }
                }
                user.otherQualificationDocs[j] = object;
            }
        }

        if (user.university_accepted_json != '' && user.university_accepted_json != null) {
            let university = JSON.parse(user.university_accepted_json)
            for (var j in university) {
                var object = university[j];
                object.docs = [];
                if (object.docids != null && object.docids != '') {
                    object.docids = object.docids.toString();
                    var ids = object.docids.split(',');
                    for (var l in ids) {
                        ids[l] = parseInt(ids[l]);
                        var cove = await Media.query().where({ id: ids[l] }).first();
                        let url = '';
                        if (cove) {
                            url = encodeURI(CONSTANTS.BUCKET_URL + cove.path);
                            object.docs.push({ doc_id: ids[l], url, path: cove.file || '' });
                        } else {
                            object.docs.push({ doc_id: ids[l], url, path: '' });
                        }
                    }
                }
                user.UniversityDocs[j] = object;
            }
        }

        return response(200, res, {
            message: "", data: {
                user: user,
            }
        });
    } catch (error) {
        console.log(error);
        return catchFailure(res, error);
    }
}

exports.getUsersUniversity = async (req, res, next) => {
    try {
        const documents = await MetaInfo.query().select(
            `${tableNames.universities}.id as university_id`,
            `${tableNames.universities}.title as university`
        )
            .where(`${tableNames.universities}.is_active`, '=', 'true')
        return response(200, res, { message: "success", data: documents })
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.fetchUsers = async (req, res, next) => {
    const columns = [
        'id',
        'name',
        'email',
        'role',
        'verification_status',
        'is_deleted',
        'options',

    ];
    const limit = req.body.length;
    const start = req.body.start;
    const ordercolumn = req.body['order[0][column]'];
    const order = columns[ordercolumn];
    let ufilter = req.body.UserVerificationFilter;
    let rolefilter = req.body.UserRoleFilter;
    const dir = req.body['order[0][dir]'];
    let totalData = await User.query().where('is_deleted', true).where('is_superadmin', false).count();
    totalData = totalData[0].count; let posts = [];
    let totalFiltered = 0;
    let search = '';
    if (ufilter != '' && rolefilter != '') {
        if (req.body['search[value]'] == '' || req.body['search[value]'] == null) {
            posts = await User.query()
                .offset(start)
                .limit(limit)
                .orderBy(order, dir)
                // .where('is_deleted', false)
                .where('is_superadmin', false)
                .where('verification_status', ufilter)
                .where('is_mentor', rolefilter)
            totalFiltered = posts.length;
        }
        else {
            search = req.body['search[value]'];
            posts = await User.query()
                .whereRaw("LOWER(name) LIKE '%' || LOWER(?) || '%' ", search)
                .offset(start)
                .limit(limit)
                .orderBy(order, dir)
                // .where('is_deleted', false)
                .where('is_superadmin', false);
            totalFiltered = posts.length;
        }
    }

    else if (ufilter != '') {
        if (req.body['search[value]'] == '' || req.body['search[value]'] == null) {
            posts = await User.query()
                .offset(start)
                .limit(limit)
                .orderBy(order, dir)
                // .where('is_deleted', false)
                .where('is_superadmin', false)
                .where('verification_status', ufilter)
            totalFiltered = posts.length;
        }
        else {
            search = req.body['search[value]'];
            posts = await User.query()
                .whereRaw("LOWER(name) LIKE '%' || LOWER(?) || '%' ", search)
                .offset(start)
                .limit(limit)
                .orderBy(order, dir)
                // .where('is_deleted', false)
                .where('is_superadmin', false);
            totalFiltered = posts.length;
        }
    }
    else if (rolefilter != '') {
        if (req.body['search[value]'] == '' || req.body['search[value]'] == null) {
            posts = await User.query()
                .offset(start)
                .limit(limit)
                .orderBy(order, dir)
                // .where('is_deleted', false)
                .where('is_superadmin', false)
                .where('is_mentor', rolefilter)
            totalFiltered = posts.length;
        }
        else {
            search = req.body['search[value]'];
            posts = await User.query()
                .whereRaw("LOWER(name) LIKE '%' || LOWER(?) || '%' ", search)
                .offset(start)
                .limit(limit)
                .orderBy(order, dir)
                // .where('is_deleted', false)
                .where('is_superadmin', false);
            totalFiltered = posts.length;
        }
    }

    else {
        if (req.body['search[value]'] == '' || req.body['search[value]'] == null) {
            posts = await User.query()
                .offset(start)
                .limit(limit)
                .orderBy(order, dir)
                // .where('is_deleted', false)
                .where('is_superadmin', false)
            totalFiltered = posts.length;
        }
        else {
            search = req.body['search[value]'];
            posts = await User.query()
                .whereRaw("LOWER(name) LIKE '%' || LOWER(?) || '%' ", search)
                .offset(start)
                .limit(limit)
                .orderBy(order, dir)
                // .where('is_deleted', false)
                .where('is_superadmin', false);
            totalFiltered = posts.length;
        }
    }

    let data = []
    if (posts.length > 0) {
        for (var i = 0; i < posts.length; i++) {
            let item = posts[i];
            let nestedData = {};

            nestedData.id = item.id;
            nestedData.name = item.name;
            nestedData.email = item.email;
            nestedData.options = item.id;
            nestedData.isDeleted = item.is_deleted;

            if (item.is_mentor == true) {
                nestedData.role = 'Mentor'
            }
            else {
                nestedData.role = "Mentee"
            }

            if (!item.is_mentor && item.verification_status == 0) {
                const checking = await UserVerification.query().where('user_id', item.id);
                if (checking == '' || checking != undefined) {
                    nestedData.verification_status = '-';
                    item.verification_status = '-';
                }
                else {
                    item.verification_status = 2;
                }
            }
            switch (item.verification_status) {
                case 0:
                    nestedData.verification_status = 'Not Verified';
                    break;
                case 1:
                    nestedData.verification_status = 'Verified';
                    break;
                case 2:
                    nestedData.verification_status = 'Submitted for Review';
                    break;
                case -1:
                    nestedData.verification_status = 'Rejected';
                    break;
                case 3:
                    nestedData.verification_status = 'Blocked';
            }

            data.push(nestedData);
        }
    }

    return res.status(200).json({
        draw: parseInt(req.body['draw']),
        recordsTotal: parseInt(totalData),
        recordsFiltered: parseInt(totalFiltered),
        data: data,
        search: search
    });
}



exports.updateUserExcel = async (req, res, next) => {
    try {
        if (req.files != null) {
            const file = req.files.file;
            file.mv(`${dirName}/public/tmp.xlsx`, async function (err) {
                if (err) {
                    console.error('uploading failed', err)
                }
                else {
                    console.log('File uploaded to ' + 'public');
                    const filePath = dirName + '/public/tmp.xlsx'

                    // const results = await importUserExcelData(filePath)
                    const rows = await readXlsxFile(filePath);
                    rows.shift();

                    let allUsers = [];

                    for (let i = 0; i < rows.length; i++) {
                        try {
                            let isMentor;
                            if (rows[i][3] === 'yes') {
                                isMentor = true;
                            } else {
                                isMentor = false;
                            }
                            let chkEmail = rows[i][1].toLowerCase();
                            const existingUser = await User.query().where({ email: chkEmail }).first();
                            if (existingUser) {
                                console.log("User already exists")
                            }
                            else {
                                let chkEmail = rows[i][1].toLowerCase();
                                const hashedPassword = await bcrypt.hash(rows[i][2], 12);
                                let newuser = await User.query().insert({ name: rows[i][0], email: chkEmail, password: hashedPassword, is_mentor: isMentor, fee_per_hour: '19' }).returning('id');
                                newuser.password = '';
                                allUsers.push(newuser);
                            }
                        }
                        catch (error) {
                            return catchFailure(res, error);
                        }
                    }


                    return response(200, res,
                        {
                            message: "success",
                            data: allUsers,

                        })
                }

            });

        } else {
            return response(200, res,
                {
                    status: false,
                    message: "No Data Found.",
                    code: 404,
                    data: "",
                }
            );
        }
    } catch (error) {
        return catchFailure(res, error);
    }
};

exports.updateUserQuickbloxID = async (req, res, next) => {
    try {
        const { currentUserId, quickbloxId } = req.body;
        await User.query().where({ id: currentUserId }).update({
            quickblox_id: quickbloxId
        });
        return response(200, res, { message: "success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
};


exports.editUserDetail = async (req, res, next) => {
    try {
        const auth = req.params;
        let CurUser = await User.query().where({ id: auth.id }).first();
        let userVerification = await UserVerification.query().where({ user_id: auth.id }).first();
        if (!userVerification) {
            await UserVerification.query().insert({ user_id: auth.id });
        }
        userVerification = await UserVerification.query().where({ user_id: auth.id }).first();
        let metainfo = await MetaInfo.query();
        let curr = await Curriculums.query();
        let uni = await Universities.query();

        if (userVerification.other_ql_json == null) {
            userVerification.other_ql_json = [{
                type: null,
                score: null,
                docids: '',
            }];
        } else {
            userVerification.other_ql_json = JSON.parse(userVerification.other_ql_json);
        }

        if (userVerification.university_accepted_json == null) {
            userVerification.university_accepted_json = [{
                university: null,
                docids: '',
            }];
        } else {
            userVerification.university_accepted_json = JSON.parse(userVerification.university_accepted_json);
        }

        userVerification.name = CurUser.name;
        userVerification.about_me = CurUser.about_me;
        userVerification.tagline = CurUser.tagline;
        userVerification.email = CurUser.email;

        userVerification.personalDocs = [];
        userVerification.highSchoolDocs = [];

        if (userVerification.personal_doc_ids != '' && userVerification.personal_doc_ids != null) {
            var ids = userVerification.personal_doc_ids.split(',');
            for (var i in ids) {
                let cover = await Media.query().where({ id: ids[i] }).first();
                let url = '';
                if (cover != '') {
                    url = encodeURI(CONSTANTS.BUCKET_URL + cover.path);
                }
                userVerification.personalDocs.push({ doc_id: ids[i], url, path: cover.file });
            }
        }

        if (userVerification.highschool_doc_ids != '' && userVerification.highschool_doc_ids != null) {
            var ids = userVerification.highschool_doc_ids.split(',');
            for (var i in ids) {
                let cover = await Media.query().where({ id: ids[i] }).first();
                let url = '';
                if (cover != '') {
                    url = encodeURI(CONSTANTS.BUCKET_URL + cover.path);
                }
                userVerification.highSchoolDocs.push({ doc_id: ids[i], url, path: cover.file });
            }
        }

        if (userVerification.other_ql_json != '' && userVerification.other_ql_json != null) {
            for (var j in userVerification.other_ql_json) {
                var object = userVerification.other_ql_json[j];
                object.docs = [];
                if (object.docids != null && object.docids != '') {
                    object.docids = object.docids.toString();
                    var ids = object.docids.split(',');
                    for (var k in ids) {
                        let cover = await Media.query().where({ id: ids[k] }).first();
                        let url = '';
                        if (cover) {
                            url = encodeURI(CONSTANTS.BUCKET_URL + cover.path);
                        }
                        object.docs.push({ doc_id: ids[i], url, path: cover.file });
                    }
                }
                userVerification.other_ql_json[j] = object;
            }
        }

        if (userVerification.university_accepted_json != '' && userVerification.university_accepted_json != null) {
            for (var j in userVerification.university_accepted_json) {
                var object = userVerification.university_accepted_json[j];
                object.docs = [];
                if (object.docids != null && object.docids != '') {
                    object.docids = object.docids.toString();
                    var ids = object.docids.split(',');
                    for (var l in ids) {
                        ids[l] = parseInt(ids[l]);
                        var cove = await Media.query().where({ id: ids[l] }).first();
                        let url = '';
                        if (cove) {
                            url = encodeURI(CONSTANTS.BUCKET_URL + cove.path);
                            object.docs.push({ doc_id: ids[l], url, path: cove.file || '' });
                        } else {
                            object.docs.push({ doc_id: ids[l], url, path: '' });
                        }
                    }
                }
                userVerification.university_accepted_json[j] = object;
            }
        }

        return response(200, res, {
            message: "test", data: {
                prefilledInfo: userVerification,
                metainfo: metainfo,
                curriculum: curr,
                university: uni,
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.updateUserDetails = async (req, res, next) => {
    try {
        let { personal_doc_type, linkedin_url, highschool_grade_type, highschool_score, major, other_ql_json, university, university_accepted_json, upi_id, name, about_me, tagline, isSubmitting, otherCurriculum, otherQualification, otherUniversity, otherUniversityAcceptedTo } = req.body;
        const auth = req.params;

        for (var i in other_ql_json) {
            other_ql_json[i].docs = [];
        }
        for (var i in university_accepted_json) {
            university_accepted_json[i].docs = [];
        }

        let others = other_ql_json;

        other_ql_json = JSON.stringify(other_ql_json);
        let qual_type;
        for (let n of others) {
            qual_type = n.type
        }
        let qualification_type;
        if (qual_type != null) {
            const qualData = await MetaInfo.query().select('id').where({ title: qual_type }).first();
            qualification_type = qualData.id;
        }
        university_accepted_json = JSON.stringify(university_accepted_json);
        let userVerification = await UserVerification.query().where({ user_id: auth.id }).update({
            personal_doc_type, linkedin_url, highschool_grade_type, highschool_score, major, other_ql_json, university, university_accepted_json, upi_id, otherCurriculum, otherQualification, otherUniversity, qualification_type, otherUniversityAcceptedTo
        });

        let updateObject = {
            name,
            about_me,
            tagline
        }

        if (isSubmitting) {
            updateObject.verification_status = 2;
        }

        await User.query().where({ id: auth.id }).update(updateObject);

        return response(200, res, { message: "Successfully Updated", data: userVerification });
    } catch (error) {
        return catchFailure(res, error);
    }
}