import { Router } from 'express';
import { UserController } from './users.controller.js';
// import commentsCtrl from './comments.controller.js';

const router = new Router();

// associate put, delete, and get(id)
router.route('/register').post(UserController.register);
router.route('/refresh').post(UserController.refresh);
router.route('/login').post(UserController.login);
router.route('/logout').post(UserController.logout);
router.route('/delete').delete(UserController.delete);
// router.route('/update-preferences').put(usersCtrl.save);
// router.route('/comment-report').get(commentsCtrl.apiCommentReport);
// router.route('/make-admin').post(usersCtrl.createAdminUser);

export default router;
