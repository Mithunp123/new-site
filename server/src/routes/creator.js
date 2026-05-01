import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  addSocialProfile, addNicheDetails, addPortfolio,
  getProfile, updateProfile, updateProfilePhoto,
  updatePassword, deleteAccount, getDashboard
} from '../controllers/creatorController.js';

const router = Router();
router.use(verifyToken);

router.post('/social-profiles', addSocialProfile);
router.post('/niche-details', upload.array('screenshots', 5), addNicheDetails);
router.post('/portfolio', addPortfolio);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/profile/photo', upload.single('profile_photo'), updateProfilePhoto);
router.patch('/password', updatePassword);
router.delete('/account', deleteAccount);
router.get('/dashboard', getDashboard);

export default router;
