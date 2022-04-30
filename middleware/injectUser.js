import { User } from '../src/api/users.controller.js';

export default async function injectUser(req, res, next) {
  if (Object.keys(req.cookies).length > 0 && req.cookies.Authorization) {
    const userJwt = req.cookies.Authorization.slice('Bearer%20'.length);
    const userJwtDecoded = await User.decoded(userJwt);
    var { error } = userJwtDecoded;
    if (error) {
      req.user = {};
      if (error.name === 'TokenExpiredError') {
        res.setMetric('status', 10.0, '418');
        return next();
      }
      console.log('there was an error in injectUser', error);
      return next();
    }
    req.user = userJwtDecoded;
  } else {
    req.user = {};
  }

  return next();
}
