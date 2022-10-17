const express = require('express');
const router = express.Router();
const validator = require('express-joi-validation').createValidator({
    passError: true, // NOTE: this tells the module to pass the error along
});
const passport = require('passport');
require('../app/Helpers/passport'); 
const { unauthenticateResponse } = require('../app/Helpers/basics');


const RequestValidator = require('../app/Middleware/RequestValidator');
const LoginController = require('../app/Controllers/LoginController');
const HomeController = require('../app/Controllers/HomeController');
const VerificationController = require('../app/Controllers/VerificationController');
const NotesController = require('../app/Controllers/NotesController');
const expertController = require('../app/Controllers/expertController');
const MentorshipController = require('../app/Controllers/MentorshipController');
const NotificationController = require('../app/Controllers/NotificationController');
const ReportingController = require('../app/Controllers/ReportingController');
const earningsController = require('../app/Controllers/earningsController')
const VideoController = require('../app/Controllers/videoController');



// Site API Routes
router.post('/signup',
    validator.body(RequestValidator.Validators('signupRequest')),
    LoginController.signupRequest
);

router.post('/signin',
    validator.body(RequestValidator.Validators('signinRequest')),
    LoginController.signinRequest
);

router.post('/forgotpasswordrequest',
    validator.body(RequestValidator.Validators('forgotPasswordRequest')),
    LoginController.forgotPasswordRequest
);

router.post('/updatePasswordRequest',
    validator.body(RequestValidator.Validators('updatePasswordRequest')),
    LoginController.updatePasswordRequest
);

router.get('/verifyemailrequest',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    LoginController.verifyemailrequest
);


router.get('/verifyEmailRequestReminder',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    LoginController.verifyEmailRequestReminder
);

router.post('/verifyemail',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('verifyemail')),
    LoginController.verifyemail
);

router.post('/changePassword',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('changePassword')),
    LoginController.changePassword
);

router.post('/signout',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    LoginController.signOutRequest
);

router.get('/home',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    HomeController.home
);

router.get('/dashboard',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    HomeController.dashboard
);

router.get('/edit_verify_user_step_1',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    VerificationController.editVerifyUserStep1
);

router.post('/verify_user_step_1',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    VerificationController.VerifyUserStep1
);
router.post('/upload_vdocs',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('uploadVerificationDocs')),
    VerificationController.uploadVerificationDocs
);
router.post('/upload_json_vdocs',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('uploadVerificationJSONDocs')),
    VerificationController.uploadVerificationJSONDocs
);
router.post('/remove_vdocs',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('removeVerificationDocs')),
    VerificationController.removeVerificationDocs
);
router.post('/remove_json_vdocs/:docid',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    VerificationController.removeJSONVerificationDocs
);



router.get('/myProfile',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    HomeController.myProfile
);


router.post('/BookNewSlot',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    //validator.body(RequestValidator.Validators('BookNewSlot')),
    HomeController.BookNewSlot
);

router.post('/getSlots',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('getSlots')),
    HomeController.getSlots
);

router.post('/getExpertFreeSlots/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('getSlots')),
    HomeController.getExpertFreeSlots
);

router.post('/getSlotsDate/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('getSlotsDate')),
    HomeController.getSlotsDate
);

router.get('/deleteSlot/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    HomeController.deleteSlot
);

router.get('/getCurriculums',
    HomeController.getCurriculums
);

router.get('/getUniversities',
    HomeController.getUniversities
);

router.get('/getQualifications',
    HomeController.getQualifications
);

router.get('/getSubjects',
    HomeController.getSubjects
);

router.get('/getThemeBySubjectID/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    HomeController.getThemeBySubjectID
);

router.get('/getSubjectsByCurriculumID/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    HomeController.getSubjectsByCurriculumID
);

router.get('/getTopicByThemeID/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    HomeController.getTopicByThemeID
);

router.post('/storeMyNotes',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('storeMyNotes')),
    NotesController.storeMyNotes
);

router.post('/updateMyNotes/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('updateMyNotes')),
    NotesController.updateMyNotes
);

router.post('/deleteMyNotes/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.deleteMyNotes
);

router.get('/myNotes',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.myNotes
);

router.get('/noteinfo/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.noteInfo
);

router.post('/setNoteCover',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.setNoteCoverPic
);

router.post('/uploadNotePDF',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.uploadNotePDF
);

router.post('/uploadNotePreview',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.uploadNotePreview
);

router.get('/unauthenticated', function (req, res) {
    return unauthenticateResponse(res);
});



router.get('/notes',
    HomeController.getNotes
);

router.get('/experts',
    HomeController.getExperts
);

router.get('/getNoteDetail/:id',
    HomeController.getNoteDetail
);

router.get('/getExpertDetail/:id',
    HomeController.getExpertDetail
);

router.get('/getSimilarNotes/:id',
    HomeController.getSimilarNotes
);

router.get('/getNotesByExpertID/:id',
    HomeController.getNotesByExpertID
);

router.get('/getPlans',
    HomeController.getPlans
);

router.post('/subscribeMe',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    HomeController.subscribeMe
);

router.post('/completeSubscription',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    HomeController.completeSubscription
);


router.post('/recordLastReadNote',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('recordLastReadNote')),
    NotesController.recordLastReadNote
);


router.get('/getLastReadNote',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.getLastRecordNote
);

router.get('/getMySubscription',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.getSubscriptionRecord
);

router.post('/updateProfilePicture',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.setProfilePicture
);



router.get('/getMyPlaylists',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.getMyPlaylists
);



router.get('/getMyPlaylistsFull',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.getMyPlaylistsFull
);

router.get('/MenteeMyPlaylistDetail/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotesController.MenteeMyPlaylistDetail
);

router.post('/addNoteToPlaylist',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('addNoteToPlaylist')),
    NotesController.addNoteToPlaylist
);

router.post('/submitBookingRequest/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    expertController.submitBookingRequest
);

router.post('/completeBookingPayment/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('completeBookingPayment')),
    expertController.completeBookingPayment
);

router.get('/myMeetings',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    expertController.myMeetings
);

router.post('/submitRating/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    expertController.submitRating
);

router.get('/getMyRatings',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    expertController.getMyRatings
);


router.get('/getMyMentorshipList',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    MentorshipController.getMyMentorshipList
);

router.get('/getMyMentorshipDetail/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    MentorshipController.getMyMentorshipDetail
);

router.get('/approveSlot/:id/:dialogueID?',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    MentorshipController.approveSlot
);

router.get('/rejectSlot/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    MentorshipController.rejectSlot
);

router.get('/notifications',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    NotificationController.getMyNotifications
);


router.post('/updateQuickBloxID',
    validator.body(RequestValidator.Validators('updateQuickBloxID')),
    LoginController.updateQuickBloxID
);

router.post('/updateClickCount',
    validator.body(RequestValidator.Validators('updateClickCount')),
    HomeController.updateClickCount
);


router.post('/getMyEarnings',
    validator.body(RequestValidator.Validators('getMyEarnings')),
    ReportingController.getMyEarnings
);

router.post('/getMyMentorshipEarnings',
    validator.body(RequestValidator.Validators('getMyMentorshipEarnings')),
    ReportingController.getMyMentorshipEarnings
);


router.post('/getMentorshipStats',
    validator.body(RequestValidator.Validators('getMentorshipStats')),
    earningsController.getMentorshipStats
);
router.post('/getEarningBreakup',
    validator.body(RequestValidator.Validators('getEarningBreakup')),
    earningsController.getEarningBreakup
);


router.get('/getQuickbloxVideos/:chat_dialog_id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    VideoController.getQuickbloxVideos
);

router.post('/addVideoToPlaylist',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    validator.body(RequestValidator.Validators('addVideoToPlaylist')),
    VideoController.addVideoToPlaylist
);

router.get('/getMyVideoPlaylists',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    VideoController.getMyVideoPlaylists
);

router.get('/getMyVideoPlaylistsFull',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    VideoController.getMyVideoPlaylistsFull
);

router.get('/MenteeMyVideoPlaylistDetail/:id',
    passport.authenticate('jwt', { session: false, failureRedirect: '/api/v1/unauthenticated' }),
    VideoController.MenteeMyVideoPlaylistDetail
);



module.exports = router;