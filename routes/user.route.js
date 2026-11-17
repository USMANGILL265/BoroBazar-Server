
import { Router } from "express";

import {
  changePasswordController,
  forgotPasswordController,
  loginUserController,
  logoutUserController,
  registerUserController,
  resendOtpController,
  verifyEmailController,
  verifyPasswordController,
  resendForgotPasswordOtpController,
  authWithGoogle,
} from "../controllers/user.controller.js";

import auth from "../middlewares/auth.js";

const userRouter = Router();

userRouter.post("/register", registerUserController);
userRouter.post("/verifyEmail", verifyEmailController);
userRouter.post("/resendOtp", resendOtpController);

userRouter.post("/login", loginUserController);
userRouter.get("/logout", logoutUserController);

userRouter.post("/forgot-password", forgotPasswordController);
userRouter.post("/verify-forgot-password-otp", verifyPasswordController);

userRouter.post(
  "/resend-forgot-password-otp",
  resendForgotPasswordOtpController
);

userRouter.post(
  "/forgot-password/change-password",
  changePasswordController
);

userRouter.post("/authWithGoogle", authWithGoogle)

export default userRouter;
