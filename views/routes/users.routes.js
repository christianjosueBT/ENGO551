import { Router } from 'express';

const router = new Router();

// associate put, delete, and get(id)
router.route('/register').get(async (req, res) => {
  res.render('users/register.ejs');
});
router.route('/login').get(async (req, res) => {
  res.render('users/login.ejs');
});

export default router;
