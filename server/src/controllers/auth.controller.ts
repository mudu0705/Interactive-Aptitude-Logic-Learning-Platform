import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../services/db.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendOtpEmail } from '../services/email.service';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, otpVerificationSchema, profileSetupSchema } from 'shared';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-change-in-production';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Create user and profile
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        otpCode: otp,
        otpExpiry,
        otpLastSent: new Date(),
        profile: {
          create: {
            xp: 0,
            coins: 0,
            level: 1,
            streak: 0,
            dailyGoalXP: 100,
            targetCompanies: JSON.stringify([]),
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Send the email OTP using Nodemailer service
    await sendOtpEmail(user.email, user.name, otp);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Verification OTP sent to your email.',
      userId: user.id,
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { profile: true },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please verify your email first.',
        isVerified: false,
        otp: process.env.NODE_ENV !== 'production' ? user.otpCode : undefined,
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const targetCompanies = user.profile ? JSON.parse(user.profile.targetCompanies) : [];

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile ? {
          ...user.profile,
          targetCompanies,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = otpVerificationSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified. Please login.' });
    }

    if (!user.otpCode || user.otpCode !== data.otp) {
      return res.status(400).json({ success: false, message: 'Invalid verification OTP code' });
    }

    if (user.otpExpiry && new Date(user.otpExpiry) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification OTP has expired. Please request a new code.' });
    }

    await prisma.user.update({
      where: { email: data.email },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
    });

    return res.json({
      success: true,
      message: 'Account verified successfully. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified' });
    }

    // 60-Second Cooldown Rate Limiting check
    const cooldownLimit = 60 * 1000;
    if (user.otpLastSent) {
      const timePassed = Date.now() - new Date(user.otpLastSent).getTime();
      if (timePassed < cooldownLimit) {
        const secondsLeft = Math.ceil((cooldownLimit - timePassed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft} seconds before requesting another verification code.`,
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { email },
      data: {
        otpCode: otp,
        otpExpiry,
        otpLastSent: new Date(),
      },
    });

    await sendOtpEmail(user.email, user.name, otp);

    return res.json({
      success: true,
      message: 'A new verification OTP code has been sent to your email.',
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { email: data.email },
      data: { resetToken },
    });

    console.log(`[Reset PASSWORD Email Mock] To: ${user.email} | Reset OTP Token: ${resetToken}`);

    return res.json({
      success: true,
      message: 'Password reset code sent to console.',
      token: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { resetToken: data.token },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
      },
    });

    return res.json({
      success: true,
      message: 'Password reset successful. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const targetCompanies = JSON.parse(profile.targetCompanies);

    return res.json({
      success: true,
      profile: {
        ...profile,
        targetCompanies,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const data = profileSetupSchema.parse(req.body);

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        college: data.college,
        targetCompanies: JSON.stringify(data.targetCompanies),
        dailyGoalXP: data.dailyGoalXP,
      },
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        ...updatedProfile,
        targetCompanies: JSON.parse(updatedProfile.targetCompanies),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      success: true,
      accessToken,
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};
