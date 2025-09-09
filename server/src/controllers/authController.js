const dayjs = require('dayjs');
const { randomUUID } = require('crypto');
const User = require('../models/User');
const { sendOtpEmail, sendResetPasswordEmail } = require('../utils/email');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokens');
const { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validation/userValidation');
const crypto = require('crypto');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function register(req, res) {
  try {
    const { value, error } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });

    const existing = await User.findOne({ email: value.email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({
      email: value.email,
      password: value.password,
      role: value.role,
      name: value.name,
      isVerified: true,
    });

    return res.status(201).json({ message: 'Registration successful. Please log in.' });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed' });
  }
}

async function verifyOtp(req, res) {
  try {
    const { value, error } = verifyOtpSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });

    const user = await User.findOne({ email: value.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });
    if (!user.otp || !user.otpExpires) return res.status(400).json({ message: 'No OTP pending' });
    if (user.otp !== value.otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (dayjs().isAfter(dayjs(user.otpExpires))) return res.status(400).json({ message: 'OTP expired' });

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    user.refreshToken = randomUUID();
    await user.save();

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({ sub: user._id.toString(), tokenId: user.refreshToken });
    return res.json({ accessToken, refreshToken });
  } catch (err) {
    return res.status(500).json({ message: 'OTP verification failed' });
  }
}

async function login(req, res) {
  try {
    const { value, error } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });

    const user = await User.findOne({ email: value.email }).select('+password +refreshToken');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(value.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.refreshToken) {
      user.refreshToken = randomUUID();
      await user.save();
    }

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({ sub: user._id.toString(), tokenId: user.refreshToken });
    return res.json({ accessToken, refreshToken });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed' });
  }
}

async function refreshToken(req, res) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub).select('+refreshToken');
    if (!user || !user.refreshToken || payload.tokenId !== user.refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}

async function logout(req, res) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(400).json({ message: 'Missing token' });
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid token' });
    }
    const user = await User.findById(payload.sub).select('+refreshToken');
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    return res.json({ message: 'Logged out' });
  } catch (err) {
    return res.status(500).json({ message: 'Logout failed' });
  }
}

async function resendOtp(req, res) {
  try {
    const { value, error } = resendOtpSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });

    const user = await User.findOne({ email: value.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = dayjs().add(10, 'minute').toDate();
    await user.save();

    try {
      await sendOtpEmail({ to: user.email, otp });
    } catch (e) {
      return res.status(502).json({ message: 'Failed to send verification email' });
    }

    return res.json({ message: 'OTP resent' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to resend OTP' });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.sub).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
}

module.exports = { register, verifyOtp, login, refreshToken, logout, resendOtp, me };

async function forgotPassword(req, res) {
  try {
    const { value, error } = forgotPasswordSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
    const user = await User.findOne({ email: value.email });
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = dayjs().add(30, 'minute').toDate();
    await user.save();

    const clientBase = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientBase}/reset-password/${token}`;
    try {
      await sendResetPasswordEmail({ to: user.email, resetUrl });
    } catch (e) {
      return res.status(502).json({ message: 'Failed to send reset email' });
    }
    return res.json({ message: 'If that email exists, a reset link was sent' });
  } catch (err) {
    return res.status(500).json({ message: 'Forgot password failed' });
  }
}

async function resetPassword(req, res) {
  try {
    const { value, error } = resetPasswordSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: 'Validation failed', details: error.details });
    const user = await User.findOne({ resetPasswordToken: value.token }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user || !user.resetPasswordExpires || dayjs().isAfter(dayjs(user.resetPasswordExpires))) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    user.password = value.password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    return res.json({ message: 'Password has been reset' });
  } catch (err) {
    return res.status(500).json({ message: 'Reset password failed' });
  }
}

module.exports.forgotPassword = forgotPassword;
module.exports.resetPassword = resetPassword;


