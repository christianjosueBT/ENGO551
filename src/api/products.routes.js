import { Router } from 'express';
import ProductsCtrl from './products.controller.js';
// import CommentsCtrl from './comments.controller';

const router = new Router();

// associate put, delete, and get(id)
router.route('/').get(ProductsCtrl.apiGetProducts);
// router.route('/search').get(MoviesCtrl.apiSearchMovies);
// router.route('/countries').get(MoviesCtrl.apiGetMoviesByCountry);
// router.route('/facet-search').get(MoviesCtrl.apiFacetedSearch);
router.route('/id/:id').get(ProductsCtrl.apiGetProductById);
// router.route('/config-options').get(MoviesCtrl.getConfig);

// router
//   .route('/comment')
//   .post(CommentsCtrl.apiPostComment)
//   .put(CommentsCtrl.apiUpdateComment)
//   .delete(CommentsCtrl.apiDeleteComment);

export default router;
