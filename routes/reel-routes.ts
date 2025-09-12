import { Router } from 'express';
import { ReelController } from '../controller/reel-controller.js';
import authMiddleware from '../middleware/auth-middleware.js';

const router = Router();
const reelController = new ReelController();

// All routes require authentication
router.use(authMiddleware(['user']));

// Reel routes
router.post('/', reelController.createReel);
router.get('/', reelController.getReels);
router.get('/:id', reelController.getReelById);
router.put('/:id', reelController.updateReel);
router.delete('/:id', reelController.deleteReel);

// Reel interaction routes
router.post('/:id/like', reelController.toggleReelLike);

// Reel comment routes
router.get('/:id/comments', reelController.getReelComments);
router.post('/:id/comments', reelController.createReelComment);
router.put('/comments/:id', reelController.updateReelComment);
router.delete('/comments/:id', reelController.deleteReelComment);
router.post('/comments/:id/like', reelController.toggleReelCommentLike);

export default router;
