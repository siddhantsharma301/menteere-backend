const express = require('express');
const router = express.Router();

const validator = require('express-joi-validation').createValidator({
    passError: true, // NOTE: this tells the module to pass the error along for you
});
const passport = require('passport');
require('../app/Helpers/passport');

const AdminRequestValidator = require('../app/Middleware/AdminRequestValidator');
const LoginController = require('../app/Controllers/Admin/LoginController');
const UsersController = require('../app/Controllers/Admin/UsersController');
const UserTransactionsController = require('../app/Controllers/Admin/UserTransactionsController');
const NotesController = require('../app/Controllers/Admin/NotesController');
const MetaInfo = require('../app/Controllers/Admin/MetaInfo');
const SubjectController = require('../app/Controllers/Admin/SubjectController');
const ThemeController = require('../app/Controllers/Admin/ThemeController');
const TopicController = require('../app/Controllers/Admin/TopicController');
const SubscriptionController = require('../app/Controllers/Admin/SubscriptionController');
const MentorshipController = require('../app/Controllers/Admin/MentorShipController');
const ReportingController = require('../app/Controllers/Admin/ReportingController');

// Admin API Routes
router.post('/signin',
    validator.body(AdminRequestValidator.Validators('signinRequest')),
    LoginController.signinRequest
);

router.post('/signout',
    passport.authenticate('jwt', { session: false }),
    LoginController.signOutRequest
);

router.post('/users',
    passport.authenticate('jwt', { session: false }),
    UsersController.fetchUsers
);

router.post('/users/store',
    passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('storeUser')),
    UsersController.storeUser
);

router.post('/users/:id/update',
    passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('updateUser')),
    UsersController.updateUser
);

router.post('/users/:id/delete',
    passport.authenticate('jwt', { session: false }),
    UsersController.deleteUser
);

router.get('/users/:id/edit',
    passport.authenticate('jwt', { session: false }),
    UsersController.editUser
);

router.get('/users/:id/view',
    passport.authenticate('jwt', { session: false }),
    UsersController.getUserDetails
);

router.post('/notes',
    passport.authenticate('jwt', { session: false }),
    NotesController.fetchNotes
);

router.post('/notes/store',
    passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('storeNote')),
    NotesController.storeNote
);

router.post('/notes/:id/update',
    passport.authenticate('jwt', { session: false }),
    NotesController.updateNote
);

router.post('/notes/:id/delete',
    passport.authenticate('jwt', { session: false }),
    NotesController.deleteNote
);

router.get('/notes/:id/edit',
    passport.authenticate('jwt', { session: false }),
    NotesController.editNote
);

router.post('/uploadNotePDF',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.uploadNotePDF
);

router.get('/noteinfo/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.noteInfo
);

router.post('/uploadNotePreview',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.uploadNotePreview
);

router.post('/setNoteCover',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.setNoteCoverPic
);

router.post('/fetch_metainfo',
    passport.authenticate('jwt', { session: false }),
    MetaInfo.fetch
);

router.post('/metainfo/store',
    passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('storeMetaInfo')),
    MetaInfo.store
);


router.post('/storeCurriculum',
    passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('storeCurriculum')),
    MetaInfo.storeCurriculum
);

router.post('/curriculum/:id/update',
    passport.authenticate('jwt', { session: false }),
    MetaInfo.updateCurriculum
);

router.get('/curriculum/:id/edit',
    passport.authenticate('jwt', { session: false }),
    MetaInfo.editCurriculum
);

router.post('/curriculum/:id/delete',
    passport.authenticate('jwt', { session: false }),
    MetaInfo.deleteCurriculum
);


router.post('/metainfo/:id/update',
    passport.authenticate('jwt', { session: false }),
    MetaInfo.update
);

router.post('/metainfo/:id/delete',
    passport.authenticate('jwt', { session: false }),
    MetaInfo.delete
);

router.get('/metainfo/:id/edit',
    passport.authenticate('jwt', { session: false }),
    MetaInfo.edit
);

router.get('/getDocuments',
    passport.authenticate('jwt', { session: false }),
    UsersController.getUsersDocument
)

router.get('/getUniversity',
    passport.authenticate('jwt', { session: false }),
    UsersController.getUsersUniversity
)

router.get('/getUserDetails',
    passport.authenticate('jwt', { session: false }),
    UsersController.getUserDetails
)

router.post('/getSubjects',
    passport.authenticate('jwt', { session: false }),
    SubjectController.getSubjects
);

router.post('/getThemes',
    passport.authenticate('jwt', { session: false }),
    SubjectController.getThemes
);

router.post('/subjects/fetch',
    passport.authenticate('jwt', { session: false }),
    SubjectController.fetch
);


router.post('/curriculums/fetch',
    passport.authenticate('jwt', { session: false }),
    MetaInfo.fetchCurriculums
);

router.post('/subjects/store',
    passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('storeSubject')),
    SubjectController.store
);

router.post('/subjects/:id/update',
    passport.authenticate('jwt', { session: false }),
    SubjectController.update
);

router.post('/subjects/:id/delete',
    passport.authenticate('jwt', { session: false }),
    SubjectController.delete
);

router.get('/subjects/:id/edit',
    passport.authenticate('jwt', { session: false }),
    SubjectController.edit
);

router.post('/themes/fetch',
    passport.authenticate('jwt', { session: false }),
    ThemeController.fetch
);

router.post('/themes/store',
    passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('storeTheme')),
    ThemeController.store
);

router.post('/themes/:id/update',
    passport.authenticate('jwt', { session: false }),
    ThemeController.update
);

router.post('/themes/:id/delete',
    passport.authenticate('jwt', { session: false }),
    ThemeController.delete
);

router.get('/themes/:id/edit',
    passport.authenticate('jwt', { session: false }),
    ThemeController.edit
);

router.post('/topics/fetch',
    passport.authenticate('jwt', { session: false }),
    TopicController.fetch
);

router.post('/topic/store',
    passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('storeTopic')),
    TopicController.store
);

router.post('/topic/:id/update',
    passport.authenticate('jwt', { session: false }),
    TopicController.update
);

router.post('/topic/:id/delete',
    passport.authenticate('jwt', { session: false }),
    TopicController.delete
);

router.get('/topic/:id/edit',
    passport.authenticate('jwt', { session: false }),
    TopicController.edit
);

router.post('/updateUniversityCover',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    MetaInfo.updateUniversityCover
);


router.get('/getAllCurriculums',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.getCurriculumsDetails
);

router.get('/getAllSubjects',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.getSubjectDetails)


router.get('/getSubjectsByCurriculumID/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.getSubjectsByCurriculumID
);

router.get('/getThemeBySubjectID/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.getTheme
);

router.get('/getTopicByThemeID/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.getTopic
);

router.get('/getAllUsers',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    UsersController.getUsersDetails)


router.post('/subscriptions',
    passport.authenticate('jwt', { session: false }),
    SubscriptionController.fetchSubscriptions
);

router.get('/subscriptions/:id/view',
    passport.authenticate('jwt', { session: false }),
    SubscriptionController.viewSubscription
);

router.get('/getAllSubscriptions',
    passport.authenticate('jwt', { session: false }),
    SubscriptionController.getAllSubscriptions
)

router.get('/getPriceByPlanId/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: 'api/vi/unauthenticated' }),
    SubscriptionController.getPrice
)

router.post('/subscriptions/store',
    passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('storeSubscription')),
    SubscriptionController.storeSubscription
);

router.get('/users/:id/NotesUploaded',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.NotesUploaded
);

router.get('/getMentorshipsList',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    MentorshipController.getAllMentorshipList
);

router.get('/getUserMentorshipDetail/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    MentorshipController.getUserMentorshipDetail
);

router.post('/mentorships',
    passport.authenticate('jwt', { session: false }),
    MentorshipController.fetchMentorships
);

router.post('/getNotesStats',
    //passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('getNotesStats')),
    ReportingController.getNotesStats
);

router.post('/getMentorshipStats',
    //passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('getMentorshipStats')),
    ReportingController.getMentorshipStats
);

router.post('/getMentorshipStatstics',
    //passport.authenticate('jwt', { session: false }),
    // validator.body(AdminRequestValidator.Validators('getMentorshipStatstics')),
    ReportingController.getMentorshipStatstics
);



router.post('/user_trasactions',
    passport.authenticate('jwt', { session: false }),
    UserTransactionsController.fetch
);

router.post('/user_trasactions/store',
    passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('storeUserTransaction')),
    UserTransactionsController.store
);

router.post('/user_trasactions/:id/update',
    passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('storeUserTransaction')),
    UserTransactionsController.update
);

router.post('/user_trasactions/:id/delete',
    passport.authenticate('jwt', { session: false }),
    UserTransactionsController.delete
);

router.get('/user_trasactions/:id/edit',
    passport.authenticate('jwt', { session: false }),
    UserTransactionsController.edit
);


router.post('/getEarningBreakup',
    validator.body(AdminRequestValidator.Validators('getEarningBreakup')),
    ReportingController.getEarningBreakup
);

router.post('/updateUserExcel', UsersController.updateUserExcel)


router.post('/updateUserQuickbloxID',
    validator.body(AdminRequestValidator.Validators('updateQuickBloxID')),
    UsersController.updateUserQuickbloxID
);

router.post('/universities/fetch',
    passport.authenticate('jwt', { session: false }),
    MetaInfo.fetchUniversities
);

router.post('/storeUniversity',
    passport.authenticate('jwt', { session: false }),
    validator.body(AdminRequestValidator.Validators('storeUniversity')),
    MetaInfo.storeUniversity
);

router.post('/university/:id/update',
    passport.authenticate('jwt', { session: false }),
    MetaInfo.updateUniversity
);

router.get('/university/:id/edit',
    passport.authenticate('jwt', { session: false }),
    MetaInfo.editUniversity
);

router.post('/university/:id/delete',
    passport.authenticate('jwt', { session: false }),
    MetaInfo.deleteUniversity
);


router.get('/editUserDetail/:id',
    passport.authenticate('jwt', { session: false }),
    UsersController.editUserDetail
);

router.post('/updateUserDetails/:id',
    passport.authenticate('jwt', { session: false }),
    UsersController.updateUserDetails
);

module.exports = router;