const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const prisma = require('../dbConfig/prisma');
const bcrypt = require('bcryptjs');
const path = require('path');
const logActivity = require('../utils/logActivity');

const buildFileUrl = (req, relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath;
  return `${req.protocol}://${req.get('host')}${relativePath}`;
};

const withAvatarUrl = (req, user) => {
  if (!user) return user;
  if (user.avatar) {
    user.avatar = buildFileUrl(req, user.avatar);
  }
  return user;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  users.forEach((u) => withAvatarUrl(req, u));

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user: withAvatarUrl(req, user) },
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Please provide name, email, and password!', 400));
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
    role: role || 'user',
  };

  if (req.file) {
    data.avatar = path.join('/uploads/avatars', req.file.filename);
  }

  const newUser = await prisma.user.create({
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logActivity({
    action: 'CREATE_USER',
    entity: 'User',
    entityId: newUser.id,
    description: `کاربر جدید ایجاد شد: ${newUser.name} (${newUser.role})`,
    userId: req.user?.id,
    userName: req.user?.name,
    userRole: req.user?.role,
  });

  res.status(201).json({
    status: 'success',
    data: { user: withAvatarUrl(req, newUser) },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  const updateData = {};
  
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (password) {
    updateData.password = await bcrypt.hash(password, 12);
  }
  if (req.file) {
    updateData.avatar = path.join('/uploads/avatars', req.file.filename);
  }

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logActivity({
    action: 'UPDATE_USER',
    entity: 'User',
    entityId: user.id,
    description: `اطلاعات کاربر ویرایش شد: ${user.name}`,
    userId: req.user?.id,
    userName: req.user?.name,
    userRole: req.user?.role,
  });

  res.status(200).json({
    status: 'success',
    data: { user: withAvatarUrl(req, user) },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const existingUser = await prisma.user.findUnique({ where: { id: parseInt(id) }, select: { id: true, name: true, role: true } });

  await prisma.user.delete({
    where: { id: parseInt(id) },
  });

  logActivity({
    action: 'DELETE_USER',
    entity: 'User',
    entityId: parseInt(id),
    description: `کاربر حذف شد: ${existingUser?.name || id} (${existingUser?.role || ''})`,
    userId: req.user?.id,
    userName: req.user?.name,
    userRole: req.user?.role,
  });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
