let users;
let refreshTokens;

export default class UsersDAO {
  static async injectDB(conn) {
    if (users && refreshTokens) return;
    try {
      users = await conn.db(process.env.DB).collection('users');
      refreshTokens = await conn.db(process.env.DB).collection('refreshTokens');
    } catch (e) {
      console.error(`Unable to establish collection handles in userDAO: ${e}`);
    }
  }

  /**
   * Finds a user in the `users` collection
   * @param {string} email - The email of the desired user
   * @returns {Object | null} Returns either a single user or nothing
   */
  static async getUser(email) {
    return await users.findOne({ email: email });
  }

  /**
   * Finds a refresh token in the `refreshTokens` collection
   * @param {object} refreshObject - The refresh token
   * @returns {Object | null} Returns either a refresh token or nothing
   */
  static async getRefreshToken(refreshObject) {
    return await refreshTokens.findOne({ token: refreshObject.token });
  }

  /**
   * Adds a user to the `users` collection
   * @param {UserInfo} userInfo - The information of the user to add
   * @returns {DAOResponse} Returns either a "success" or an "error" Object
   */
  static async addUser(userInfo) {
    try {
      await users.insertOne(userInfo);
      return { success: true };
    } catch (e) {
      if (String(e).startsWith('MongoError: E11000 duplicate key error')) {
        return { error: 'A user with the given email already exists.' };
      }
      console.error(`Error occurred while adding new user, ${e}.`);
      return { error: e };
    }
  }

  /**
   * Generates an acess and refresh token
   * @param {token} refreshToken - A JSON web token, used to refresh access token
   * @returns {DAOResponse} Returns either a "success" or an "error" Object
   */
  static async loginUser(refreshObj) {
    try {
      await refreshTokens.insertOne(refreshObj);
      return { success: true };
    } catch (e) {
      console.error(`Error occurred while logging in user, ${e}`);
      return { error: e };
    }
  }

  /**
   * Invalidates a refresh token by removing it from the refreshTokens collection
   * @param {string} refreshToken - The refresh JSON web token to invalidate
   * @returns {DAOResponse} Returns either a "success" or an "error" Object
   */
  static async logoutUser(refreshObj) {
    try {
      await refreshTokens.deleteOne({ token: refreshObj.token });
      return { success: true };
    } catch (e) {
      console.error(`Error occurred while logging out user, ${e}`);
      return { error: e };
    }
  }

  /**
   * Removes a user from the `sessions` and `users` collections
   * @param {string} email - The email of the user to delete
   * @returns {DAOResponse} Returns either a "success" or an "error" Object
   */
  static async deleteUser(email, refreshObj) {
    try {
      await users.deleteOne({ email });
      await refreshTokens.deleteOne({ token: refreshObj.token });
      if (
        !(await this.getUser(email)) &&
        !(await this.getRefreshToken(refreshObj))
      ) {
        return { success: true };
      } else {
        console.error(`Deletion unsuccessful`);
        return { error: `Deletion unsuccessful` };
      }
    } catch (e) {
      console.error(`Error occurred while deleting user, ${e}`);
      return { error: e };
    }
  }
}
