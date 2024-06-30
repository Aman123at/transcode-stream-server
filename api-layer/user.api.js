import {Router} from 'express';
import { registerUser, loginUser, logoutUser, getCurrentUser } from '../service-layer/user.service.js';
import { validate } from '../validators/validate.js';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import { userLoginValidator, userRegisterValidator } from '../validators/user.validators.js';
const router = Router();
// Unsecured route
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/logout").get(verifyJWT, logoutUser);
router.route("/loggedIn").get(verifyJWT, getCurrentUser);
router.route("/loggedInUser").get(verifyJWT, getCurrentUser);
export default router;