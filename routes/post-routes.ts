import { Router } from 'express';
import { PostController } from '../controller/post-controller.js';
import authMiddleware from '../middleware/auth-middleware.js';

const router = Router();
const postController = new PostController();

// All routes require authentication
router.use(authMiddleware(['user', 'admin']));

// Post routes
router.post('/', postController.createPost);
router.post('/retweet', postController.createRetweet);
router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);
router.put('/:id', postController.updatePost);
router.delete('/:id', postController.deletePost);

// Post interaction routes
router.post('/:id/like', postController.togglePostLike);
router.post('/:id/bookmark', postController.toggleBookmark);

// Comment routes
router.get('/:id/comments', postController.getPostComments);
router.post('/:id/comments', postController.createComment);
router.put('/comments/:id', postController.updateComment);
router.delete('/comments/:id', postController.deleteComment);
router.post('/comments/:id/like', postController.toggleCommentLike);

export default router;
