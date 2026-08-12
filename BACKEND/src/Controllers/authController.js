const AppError = require('../utils/AppError');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const prisma = require('../dbConfig/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const logActivity = require('../utils/logActivity');

const buildFileUrl = (req, relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath;
  return `${req.protocol}://${req.get('host')}${relativePath}`;
};

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user.id, user.role);

  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
  };

  res.cookie('jwt', token, cookieOptions);

  delete user.password;

  if (user.avatar) {
    user.avatar = buildFileUrl(req, user.avatar);
  }
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  if (!name || !email || !password || !passwordConfirm) {
    return next(new AppError('Please provide all required fields!', 400));
  }

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match!', 400));
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return next(new AppError('Email already in use!', 400));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const data = {
    name,
    email,
    password: hashedPassword,
    role: 'Admin',
  };

  if (req.file) {
    data.avatar = path.join('/uploads/avatars', req.file.filename);
  }

  const newUser = await prisma.user.create({ data });

  createSendToken(newUser, 201, req, res);
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return next(new AppError('Please provide your email and password!', 400));
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return next(new AppError('Incorrect email or password!', 401));
  }

  const correctPassword = await bcrypt.compare(password, user.password);
  
  if (!correctPassword) {
    return next(new AppError('Incorrect email or password!', 401));
  }

  logActivity({
    action: 'LOGIN',
    entity: 'Auth',
    entityId: user.id,
    description: `کاربر وارد سیستم شد: ${user.name} — ${user.role}`,
    userId: user.id,
    userName: user.name,
    userRole: user.role,
  });

  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
  });
  
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
    },
  });

  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  req.user = user;
  next();
});

// Populates req.user from the JWT cookie if present, but never blocks the request.
// Use on routes that should remain accessible but need to know who is making the request.
exports.softAuth = async (req, res, next) => {
  try {
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, role: true },
      });
      if (user) req.user = user;
    }
  } catch {
    // Invalid or expired token — silently ignore, req.user stays undefined
  }
  next();
};

exports.getMe = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next(new AppError('No authenticated user found.', 401));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide your email address!', 400));
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken,
      passwordResetExpires,
    },
  });

  // TODO: Send reset token via email
  // const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
  // try {
  //   await sendEmail({
  //     email: user.email,
  //     subject: 'Your password reset token (valid for 10 min)',
  //     message: `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`
  //   });
  // } catch (err) {
  //   await prisma.user.update({
  //     where: { id: user.id },
  //     data: {
  //       passwordResetToken: null,
  //       passwordResetExpires: null,
  //     },
  //   });
  //   return next(new AppError('There was an error sending the email. Try again later!', 500));
  // }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!',
    resetToken, // Remove in production - send via email instead
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { resetToken } = req.params;
  const { password, passwordConfirm } = req.body;

  if (!password || !passwordConfirm) {
    return next(new AppError('Please provide password and passwordConfirm!', 400));
  }

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match!', 400));
  }

  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken,
      passwordResetExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired!', 400));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  createSendToken(user, 200, req, res);
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
