let products;
const DEFAULT_SORT = { name: 1 };

export default class ProductsDAO {
  static async injectDB(conn) {
    if (products) {
      return;
    }
    try {
      products = await conn.db(process.env.DB).collection('products');
      this.products = products; // this is only for testing
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in productsDAO: ${e}`
      );
    }
  }

  /**
   * Finds and returns products by country.
   * Returns a list of objects, each object contains a title and an _id.
   * @param {Object} filters - The search parameters to use in the query.
   * @param {number} page - The page of products to retrieve.
   * @param {number} productsPerPage - The number of products to display per page.
   * @returns {GetProductsResult} An object with movie results and total results
   * that would match this query
   */
  static async getProducts({
    // here's where the default parameters are set for the getProducts method
    filters = null,
    page = 0,
    productsPerPage = 20,
  } = {}) {
    let queryParams = {};

    let { query = {}, project = {}, sort = DEFAULT_SORT } = queryParams;
    let cursor;
    try {
      cursor = await products.find(query).project(project).sort(sort);
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { productsList: [], totalNumProducts: 0 };
    }

    // Use the cursor to only return the products that belong on the current page
    const displayCursor = cursor.limit(productsPerPage).skip(page * 20);

    try {
      const productsList = await displayCursor.toArray();
      const totalNumProducts =
        page === 0 ? await products.countDocuments(query) : 0;

      return { productsList, totalNumProducts };
    } catch (e) {
      console.error(
        `Unable to convert cursor to array or problem counting documents, ${e}`
      );
      return { productsList: [], totalNumProducts: 0 };
    }
  }

  /**
   * Gets a product by its id
   * @param {string} id - The desired product id, the _id in Mongo
   * @returns {product | null} Returns either a single product or nothing
   */
  static async getProductByID(id) {
    try {
      const query = { _id: id };
      return await products.findOne(query);
    } catch (e) {
      console.error(`Something went wrong in getMovieByID: ${e}`);
      if (String(e).startsWith('Error: Argument passed in must be a single')) {
        return null;
      } else throw e;
    }
  }
}
