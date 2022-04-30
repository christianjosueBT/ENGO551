import ProductsDAO from '../dao/productsDAO.js';

export default class ProductsController {
  static async apiGetProducts(req, res, next) {
    const PRODUCTS_PER_PAGE = 20;
    const { productsList, totalNumProducts } = await ProductsDAO.getProducts();
    let response = {
      products: productsList,
      page: 0,
      filters: {},
      entries_per_page: PRODUCTS_PER_PAGE,
      total_results: totalNumProducts,
    };
    res.json(response);
  }

  static async apiGetProductById(req, res, next) {
    try {
      let id = req.params.id || {};
      let product = await ProductsDAO.getProductByID(id);
      if (!product) {
        res.status(404).json({ error: 'Could not find that product' });
        return;
      }
      res.json({ product });
    } catch (e) {
      console.log(`api, ${e}`);
      res.status(500).json({ error: e });
    }
  }
}
