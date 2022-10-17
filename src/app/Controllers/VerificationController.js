const { response, catchFailure, CONSTANTS } = require('../Helpers/basics');
const errorMessages = require('../Helpers/errorMessages');

const User = require('../Models/User');
const UserVerification = require('../Models/UserVerification');
const MetaInfo = require('../Models/MetaInfo');
const Curriculums = require('../Models/Curriculums');
const Universities = require('../Models/Universities');
const MediaManager = require('../Helpers/MediaManager');
const Media = require('../Models/Media');
const { x } = require('joi');

exports.editVerifyUserStep1 = async (req, res, next) => {
    try {
        const auth = await User.getUserByToken(req.headers.authorization);
        let CurUser = await User.query().where({ id: auth.id }).first();
        let userVerification = await UserVerification.query().where({ user_id: auth.id }).first();
        if (!userVerification) {
            await UserVerification.query().insert({ user_id: auth.id });
        }
        userVerification = await UserVerification.query().where({ user_id: auth.id }).first();
        let metainfo = await MetaInfo.query();
        let curr = await Curriculums.query();
        let uni = await Universities.query();
        let universityList = [];
        for (let i = 0; i < uni.length; i++) {
            if (uni[i].title !== 'Others') {
                universityList.push(uni[i])
            }
        }

        for (let i = 0; i < uni.length; i++) {
            if (uni[i].title === 'Others') {
                universityList.push(uni[i])
            }
        }

        let curriculumList = [];
        for (let i = 0; i < curr.length; i++) {
            if (curr[i].title !== 'Others')
                curriculumList.push(curr[i])
        }


        for (let j = 0; j < curr.length; j++) {
            if (curr[j].title === 'Others')
                curriculumList.push(curr[j]);
        }

        let metaInfoList = [];
        for (let i = 0; i < metainfo.length; i++) {
            if (metainfo[i].type !== 'qualification_type')
                metaInfoList.push(metainfo[i])
        }

        for (let p = 0; p < metaInfoList.length; p++) {
            if (metainfo[p].title !== 'Others' && metainfo[p].type === 'qualification_type')
                metaInfoList.push(metainfo[p])
        }

        for (let j = 0; j < metainfo.length; j++) {
            if (metainfo[j].title === 'Others' && metainfo[j].type === 'qualification_type')
                metaInfoList.push(metainfo[j])
        }


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
                metainfo: metaInfoList,
                curriculum: curriculumList,
                university: universityList,
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.VerifyUserStep1 = async (req, res, next) => {
    try {
        let { personal_doc_type, linkedin_url, highschool_grade_type, highschool_score, major, other_ql_json, university, university_accepted_json, upi_id, name, about_me, tagline, isSubmitting, otherCurriculum, otherQualification, otherUniversity, otherUniversityAcceptedTo } = req.body;
        const auth = await User.getUserByToken(req.headers.authorization);

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

exports.uploadVerificationDocs = async (req, res, next) => {
    try {
        const { field } = req.body;
        const { file } = req.files;
        const auth = await User.getUserByToken(req.headers.authorization);

        const path = `user/${auth.id}/verificationDocs/`;
        const media = await MediaManager.uploadFileToS3(file, path);

        const userVInfo = await UserVerification.query().where({ user_id: auth.id }).first();
        if (userVInfo) {
            var fieldIDS = userVInfo[`${field}`];
            if (fieldIDS == null || fieldIDS == '') {
                fieldIDS = media.id;
            } else {
                fieldIDS = fieldIDS.split(',');
                fieldIDS.push(media.id);
                fieldIDS = fieldIDS.join(',');
            }
            let obj = {};
            obj[`${field}`] = fieldIDS;
            console.log(obj);
            await UserVerification.query().where({ user_id: auth.id }).update(obj);
        }

        var url = encodeURI(CONSTANTS.BUCKET_URL + media.path);

        return response(200, res, {
            message: "Here upload", data: {
                doc_id: media.id,
                path: media.file,
                url: url
            }
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.uploadVerificationJSONDocs = async (req, res, next) => {
    try {
        const { field, index } = req.body;
        const { file } = req.files;
        const auth = await User.getUserByToken(req.headers.authorization);

        const path = `user/${auth.id}/verificationDocs/`;
        const media = await MediaManager.uploadFileToS3(file, path);

        var url = encodeURI(CONSTANTS.BUCKET_URL + media.path);

        return response(200, res, {
            message: "Here upload", data: {
                doc_id: media.id,
                path: media.file,
                url: url,
            },
        });
    } catch (error) {
        return catchFailure(res, error);
    }
}


exports.removeVerificationDocs = async (req, res, next) => {
    try {
        const { field, doc_id } = req.body;
        const auth = await User.getUserByToken(req.headers.authorization);

        const userVInfo = await UserVerification.query().where({ user_id: auth.id }).first();
        if (userVInfo) {
            let existingIds = userVInfo[field];
            existingIds = existingIds.split(',');
            if (existingIds.indexOf(doc_id.toString()) > -1) {
                existingIds.splice(existingIds.indexOf(doc_id.toString()), 1);
                await Media.query().where({ id: doc_id }).delete();
            }
            existingIds = existingIds.join(',');

            let obj = {};
            obj[field] = existingIds;
            await UserVerification.query().where({ user_id: auth.id }).update(obj);
        }

        return response(200, res, { message: "Success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}

exports.removeJSONVerificationDocs = async (req, res, next) => {
    try {
        const { doc_id } = req.params;
        const auth = await User.getUserByToken(req.headers.authorization);
        await Media.query().where({ id: doc_id }).delete();
        return response(200, res, { message: "Success", data: null });
    } catch (error) {
        return catchFailure(res, error);
    }
}