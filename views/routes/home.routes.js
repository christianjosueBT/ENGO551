import { Router } from 'express';
import fetch from 'node-fetch';
import https from 'https';
import injectUser from '../../middleware/injectUser.js';

const router = new Router();

// associate put, delete, and get(id)
router.route('/').get(injectUser, async (req, res) => {
  res.render('home/playground.ejs', { user: req.user });
});
router.route('/sensor/:id').get(injectUser, async (req, res) => {
  const sensor = req.params.id;
  res.render('home/home.ejs', { user: req.user, sensor });
});
router.route('/sensor/:id/weight').get(async (req, res) => {
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  const sensor = req.params.id;
  let result = await fetch(`https://${sensor}/weight`, { agent });
  result = await result.json();

  res.send(result);
});

// router
//   .route('/comment')
//   .post(CommentsCtrl.apiPostComment)
//   .put(CommentsCtrl.apiUpdateComment)
//   .delete(CommentsCtrl.apiDeleteComment);

export default router;
