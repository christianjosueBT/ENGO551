import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UsersDAO from '../dao/usersDAO.js';

const hashPassword = async password => await bcrypt.hash(password, 10);

export class User {
  constructor({ _id, username, email, password = {} } = {}) {
    this._id = _id;
    this.username = username;
    this.email = email;
    this.password = password;
  }
  toJson() {
    return {
      _id: this._id,
      username: this.username,
      email: this.email,
    };
  }
  async comparePassword(plainText) {
    return await bcrypt.compare(plainText, this.password);
  }
  encoded() {
    return jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60,
        ...this.toJson(),
      },
      process.env.SECRET_KEY
    );
  }
  encodedRefresh() {
    return jwt.sign(
      {
        ...this.toJson(),
      },
      process.env.SECRET_KEY
    );
  }
  static async decoded(userJwt) {
    return jwt.verify(userJwt, process.env.SECRET_KEY, (error, user) => {
      if (error) {
        return { error };
      }
      return new User(user);
    });
  }
}

export class UserController {
  static async register(req, res) {
    try {
      // getting user info from request body and validating the info
      const userFromBody = req.body;
      let errors = {};
      if (userFromBody && userFromBody.password.length < 8) {
        errors.password = 'Your password must be at least 8 characters.';
      }
      if (userFromBody && userFromBody.username.length < 3) {
        errors.username =
          'You must specify a username of at least 3 characters.';
      }
      if (Object.keys(errors).length > 0) {
        res.status(400).json(errors);
        return;
      }
      // generating a user object, inserting it to the database and retrieving the inserted user from the database
      const userInfo = {
        ...userFromBody,
        password: await hashPassword(userFromBody.password),
      };
      const insertResult = await UsersDAO.addUser(userInfo);
      if (!insertResult.success) {
        errors.email = insertResult.error;
      }
      const userFromDB = await UsersDAO.getUser(userFromBody.email);
      if (!userFromDB) {
        errors.general = 'Internal error, please try again later';
      }
      if (Object.keys(errors).length > 0) {
        res.status(400).json(errors);
        return;
      }
      // logging user in
      const user = new User(userFromDB);
      const refreshObj = { token: user.encodedRefresh() };
      await UsersDAO.loginUser(refreshObj);

      // sending user authorization cookie, refresh cookie, and successful status and response
      res
        .cookie('Authorization', `Bearer ${user.encoded()}`, {
          secure: true,
          sameSite: 'None',
          httpOnly: true,
        })
        .cookie('Refresh', refreshObj.token, {
          secure: true,
          sameSite: 'None',
          httpOnly: true,
          path: '/api/v1/users',
        })
        .status(200)
        .json({
          message: 'successfully signed up',
          ok: true,
        });
    } catch (e) {
      res.status(500).json({ error: e });
    }
  }

  static async login(req, res, next) {
    try {
      // getting info from req.body
      const { email, password } = req.body;

      // checking email and password are of valid type
      if (!email || typeof email !== 'string') {
        res.status(400).json({ error: 'Bad email format, expected string.' });
        return;
      }
      if (!password || typeof password !== 'string') {
        res
          .status(400)
          .json({ error: 'Bad password format, expected string.' });
        return;
      }

      // fetching user data and making a new user object
      let userData = await UsersDAO.getUser(email);
      if (!userData) {
        res.status(401).json({ error: 'Make sure your email is correct.' });
        return;
      }
      const user = new User(userData);

      // checking password
      if (!(await user.comparePassword(password))) {
        res.status(401).json({ error: 'Make sure your password is correct.' });
        return;
      }

      // making and validating refresh token
      const refreshObj = { token: user.encodedRefresh() };
      const loginResponse = await UsersDAO.loginUser(refreshObj);
      if (!loginResponse.success) {
        res.status(500).json({ error: loginResponse.error });
        return;
      }

      // sending user authorization cookie, refresh cookie, and successful status and response
      return res
        .cookie('Authorization', `Bearer ${user.encoded()}`, {
          secure: true,
          sameSite: 'None',
          httpOnly: true,
        })
        .cookie('Refresh', refreshObj.token, {
          secure: true,
          sameSite: 'None',
          httpOnly: true,
          path: '/api/v1/users',
        })
        .status(200)
        .json({
          message: 'successfully logged in',
          ok: true,
        });
    } catch (e) {
      res.status(400).json({ error: e });
      return;
    }
  }

  static async refresh(req, res, next) {
    try {
      if (Object.keys(req.cookies).length > 0 && req.cookies.Refresh) {
        let errors = {};
        const refreshToken = req.cookies.Refresh;
        const userJwtDecoded = await User.decoded(refreshToken);
        var { error } = userJwtDecoded;
        if (error) {
          req.user = {};
          console.log(
            'could not get a new auth token in user refresh function',
            error
          );
          return next();
        }
        const refreshObj = { token: refreshToken };
        if (!UsersDAO.getRefreshToken(refreshObj)) {
          req.user = {};
          console.log(
            'could not get a new auth token in user refresh function'
          );
          return next();
        }

        const userFromDB = await UsersDAO.getUser(userJwtDecoded.email);
        if (!userFromDB) {
          errors.fetchingUser =
            'Could not fetch user from the database inside user refresh function';
        }
        if (Object.keys(errors).length > 0) {
          req.user = {};
          console.log(
            'could not get a new auth token  inside user refresh function',
            errors
          );
          return next();
        }
        const user = new User(userFromDB);

        // sending auth cookie back
        res.cookie('Authorization', `Bearer ${user.encoded()}`, {
          secure: true,
          sameSite: 'None',
          httpOnly: true,
        });
        req.user = userJwtDecoded;
        return res.json({
          ok: true,
          message: 'successfully refreshed auth token',
        });
      } else {
        req.user = {};
        console.log('user does not have a refresh token');
        return next();
      }
    } catch (e) {
      console.error(
        'error while trying to refresh user (in refresh user function)',
        e
      );
    }
  }

  static async logout(req, res) {
    try {
      const userJwt = req.cookies.Authorization.slice('Bearer%20'.length);
      const token = req.cookies.Refresh;
      const refreshObj = { token };
      const userClaim = await User.decoded(userJwt);
      var { error } = userClaim;
      if (error) {
        res.status(401).json({ error });
        return;
      }
      // logging out
      const logoutResult = await UsersDAO.logoutUser(refreshObj);
      var { error } = logoutResult;
      if (error) {
        res.status(500).json({ error });
        return;
      }

      res
        .clearCookie('Authorization', {
          secure: true,
          sameSite: 'None',
          httpOnly: true,
        })
        .clearCookie('Refresh', {
          secure: true,
          sameSite: 'None',
          httpOnly: true,
          path: '/api/v1/users',
        })
        .status(200)
        .json({
          ...logoutResult,
          ok: true,
          message: 'successfully logged out',
        });
    } catch (e) {
      res.status(500).json(e);
    }
  }

  static async delete(req, res) {
    try {
      const userJwt = req.cookies.Authorization.slice('Bearer%20'.length);
      const token = req.cookies.Refresh;
      let { password } = req.body;
      let refreshObj = { token };
      if (!password || typeof password !== 'string') {
        res
          .status(400)
          .json({ error: 'Bad password format, expected string.' });
        return;
      }
      const userClaim = await User.decoded(userJwt);
      var { error } = userClaim;
      if (error) {
        res.status(401).json({ error });
        return;
      }
      const user = new User(await UsersDAO.getUser(userClaim.email));
      if (!(await user.comparePassword(password))) {
        res.status(401).json({ error: 'Make sure your password is correct.' });
        return;
      }
      const deleteResult = await UsersDAO.deleteUser(
        userClaim.email,
        refreshObj
      );
      var { error } = deleteResult;
      if (error) {
        res.status(500).json({ error });
        return;
      }

      res
        .clearCookie('Authorization', {
          secure: true,
          sameSite: 'None',
          httpOnly: true,
        })
        .clearCookie('Refresh', {
          secure: true,
          sameSite: 'None',
          httpOnly: true,
          path: '/api/v1/users',
        })
        .status(200)
        .json({ deleteResult, ok: true });
    } catch (e) {
      res.status(500).json(e);
    }
  }
}
