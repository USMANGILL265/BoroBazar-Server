import UserModel from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmailFun from "../config/sendEmail.js";
import VerificationEmail from "../utils/verifyEmailTemplate.js";
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";
import ForgotPasswordEmail from "../utils/forgotPasswordEmailTemplate.js";
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function registerUserController(request, response) {
  try {
    let user;

    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({
        message: "Plz fill all fields",
        error: true,
        success: false,
      });
    }

    user = await UserModel.findOne({ email });

    if (user) {
      return response.status(400).json({
        message: "User already registered with email",
        error: true,
        success: false,
      });
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    const salt = await bcryptjs.genSalt(10);

    const hashPassword = await bcryptjs.hash(password, salt);

    user = new UserModel({
      email: email,
      password: hashPassword,
      name: name,
      otp: verifyCode,
      otpExpires: Date.now() + 600000,
    });

    await user.save();

    await sendEmailFun({
      sendTo: email,
      subject: "Verify Email from BroBazar",
      text: "",
      html: VerificationEmail(name, verifyCode),
    });

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY,
    );

    return response.status(200).json({
      success: true,
      error: false,
      message: "User registered successfully! Plz verify your email",
      token: token,
    });
  } catch (error) {
    console.log("Registration Error:", error);

    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || error,
    });
  }
}

export async function verifyEmailController(request, response) {
  try {
    const { email, otp } = request.body;
    const user = await UserModel.findOne({ email: email });

    if (!user) {
      return response.status(400).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const isCodeValid = user.otp === otp;
    const isNotExpired = user.otpExpires > Date.now();
    if (isCodeValid && isNotExpired) {
      user.verify_Email = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();

      return response.status(200).json({
        message: "Email verified",
        error: false,
        success: true,
      });
    } else if (!isCodeValid) {
      return response.status(400).json({
        message: "Invalid OTP",
        error: true,
        success: false,
      });
    } else {
      return response.status(400).json({
        message: "OTP Expired",
        error: true,
        success: false,
      });
    }
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || error,
    });
  }
}

export async function resendOtpController(request, response) {
  try {
    const { email } = request.body;

    if (!email) {
      return response.status(400).json({
        message: "Email is required",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email: email });

    if (!user) {
      return response.status(404).json({
        message: "User not found. Please register again.",
        error: true,
        success: false,
      });
    }

    if (user.verify_Email === true) {
      return response.status(400).json({
        message: "Your email is already verified. Please login.",
        error: true,
        success: false,
      });
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = verifyCode;
    user.otpExpires = Date.now() + 120000;

    await user.save();

    await sendEmailFun({
      sendTo: email,
      subject: "Verify Email from BoroBazar",
      text: "",
      html: VerificationEmail(user.name, verifyCode),
    });

    return response.status(200).json({
      message: "New OTP sent successfully. Please check your email.",
      error: false,
      success: true,
    });
  } catch (error) {
    console.log("Resend OTP Error:", error);

    return response.status(500).json({
      message: error.message || "Unable to resend OTP",
      error: true,
      success: false,
    });
  }
}

export async function loginUserController(request, response) {
  try {
    const { email, password } = request.body;

    const user = await UserModel.findOne({ email: email });

    if (!user) {
      return response.status(400).json({
        message: "User not register",
        error: true,
        success: false,
      });
    }

    if (user.status !== "Active") {
      return response.status(400).json({
        message: "Conatct to Admin",
        error: true,
        success: false,
      });
    }

    if (user?.verify_Email !== true) {
      return response.status(400).json({
        message: "Email not verified. Plz verify you Email",
        error: true,
        success: false,
      });
    }
    if (!user.password) {
      return response.status(400).json({
        message: "Plz set your password through forgot passowrd",
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcryptjs.compare(password, user.password);

    if (!checkPassword) {
      return response.status(400).json({
        message: "Plz check your password",
        error: true,
        success: false,
      });
    }

    const accessToken = await generateAccessToken(user?._id);
    const refreshToken = await generateRefreshToken(user?._id);

    const updateUser = await UserModel.findByIdAndUpdate(user?._id, {
      last_login_date: new Date(),
    });

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    response.cookie("accessToken", accessToken, cookiesOption);
    response.cookie("refreshToken", refreshToken, cookiesOption);

    return response.json({
      message: "Login Successfully",
      error: false,
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          email: user?.email,
          name: user?.name,
        },
      },
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || error,
    });
  }
}

export async function logoutUserController(request, response) {
  try {
    const userId = request?.userId;

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    response.clearCookie("accessToken", cookiesOption);
    response.clearCookie("refreshToken", cookiesOption);

    const removeRefreshToken = await UserModel.findByIdAndUpdate(userId, {
      refreshToken: "",
    });

    return response.json({
      success: true,
      error: false,
      message: "Logout Successfully",
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: true,
      message: error.message || error,
    });
  }
}
export async function forgotPasswordController(request, response) {
  try {
    const email = request.body.email?.trim().toLowerCase();

    if (!email) {
      return response.status(400).json({
        message: "Email is required",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return response.status(404).json({
        message: "No account found with this email",
        error: true,
        success: false,
      });
    }

    if (user.verify_Email !== true) {
      return response.status(400).json({
        message: "Please verify your email first",
        error: true,
        success: false,
      });
    }

    if (user.status !== "Active") {
      return response.status(400).json({
        message: "Your account is not active",
        error: true,
        success: false,
      });
    }

    const verifyCode = generateOTP();

    user.otp = verifyCode;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendEmailFun({
      sendTo: email,
      subject: "Forgot Password OTP - BoroBazar",
      text: `Your password reset OTP is ${verifyCode}.`,
      html: ForgotPasswordEmail(user.name, verifyCode),
    });

    return response.status(200).json({
      message: "OTP sent successfully. Please check your email.",
      error: false,
      success: true,
    });
  } catch (error) {
    console.log("Forgot Password Error:", error);

    return response.status(500).json({
      message: error.message || "Unable to send OTP",
      error: true,
      success: false,
    });
  }
}

export async function verifyPasswordController(request, response) {
  try {
    const email = request.body.email?.trim().toLowerCase();
    const { otp } = request.body;

    if (!email || !otp) {
      return response.status(400).json({
        message: "Email and OTP are required",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return response.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    if (!user.otp || user.otp !== String(otp)) {
      return response.status(400).json({
        message: "Invalid OTP",
        error: true,
        success: false,
      });
    }

    if (!user.otpExpires || user.otpExpires.getTime() < Date.now()) {
      return response.status(400).json({
        message: "OTP expired. Please request a new OTP.",
        error: true,
        success: false,
      });
    }

    // Generate short-lived password reset token
    const resetToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        purpose: "password-reset",
      },
      process.env.JSON_WEB_TOKEN_SECRET_KEY,
      {
        expiresIn: "10m",
      },
    );

    // Clear OTP after successful verification
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    return response.status(200).json({
      message: "OTP verified successfully",
      error: false,
      success: true,
      resetToken: resetToken,
    });
  } catch (error) {
    console.log("Verify Forgot Password Error:", error);

    return response.status(500).json({
      message: error.message || "OTP verification failed",
      error: true,
      success: false,
    });
  }
}

export async function resendForgotPasswordOtpController(request, response) {
  try {
    const email = request.body.email?.trim().toLowerCase();

    if (!email) {
      return response.status(400).json({
        message: "Email is required",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return response.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    if (user.verify_Email !== true || user.status !== "Active") {
      return response.status(400).json({
        message: "Your account cannot reset its password",
        error: true,
        success: false,
      });
    }

    const verifyCode = generateOTP();

    user.otp = verifyCode;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendEmailFun({
      sendTo: email,
      subject: "Forgot Password OTP - BroBazar",
      text: `Your password reset OTP is ${verifyCode}`,
      html: VerificationEmail(user.name, verifyCode),
    });

    return response.status(200).json({
      message: "New OTP sent successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    console.log("Resend Forgot Password OTP Error:", error);

    return response.status(500).json({
      message: error.message || "Unable to resend OTP",
      error: true,
      success: false,
    });
  }
}

export async function changePasswordController(request, response) {
  try {
    const { newPassword, confirmPassword, resetToken } = request.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return response.status(400).json({
        message: "Please fill all fields",
        error: true,
        success: false,
      });
    }

    if (newPassword.length < 8) {
      return response.status(400).json({
        message: "Password must contain at least 8 characters",
        error: true,
        success: false,
      });
    }

    if (newPassword !== confirmPassword) {
      return response.status(400).json({
        message: "New password and confirm password do not match",
        error: true,
        success: false,
      });
    }

    // Verify reset token
    let decoded;

    try {
      decoded = jwt.verify(resetToken, process.env.JSON_WEB_TOKEN_SECRET_KEY);
    } catch (error) {
      return response.status(401).json({
        message: "Password reset session expired. Please verify OTP again.",
        error: true,
        success: false,
      });
    }

    if (decoded.purpose !== "password-reset" || !decoded.userId) {
      return response.status(401).json({
        message: "Invalid password reset authorization",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findById(decoded.userId);

    if (!user || user.email !== decoded.email) {
      return response.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(newPassword, salt);

    user.password = hashPassword;
    user.signUpWithGoogle = false;

    await user.save();

    return response.status(200).json({
      message: "Password updated successfully. Please login.",
      error: false,
      success: true,
    });
  } catch (error) {
    console.log("Change Password Error:", error);

    return response.status(500).json({
      message: error.message || "Unable to update password",
      error: true,
      success: false,
    });
  }
}

export async function authWithGoogle(request, response) {
  try {
    const { name, email, avatar } = request.body;

    if (!email) {
      return response.status(400).json({
        message: "Email missing",
        error: true,
        success: false,
      });
    }

    let user = await UserModel.findOne({ email });

    if (!user) {
      user = await UserModel.create({
        name: name || "Google User",
        email,
        password: null,
        mobile: null,
        role: "USER",
        avatar: avatar || "",
        verify_Email: true,
        signUpWithGoogle: true,
      });
    }

    const accessToken = await generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    await UserModel.findByIdAndUpdate(user._id, {
      last_login_date: new Date(),
    });

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    response.cookie("accessToken", accessToken, cookiesOption);
    response.cookie("refreshToken", refreshToken, cookiesOption);

    return response.json({
      message: "Login Successfully",
      error: false,
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}
