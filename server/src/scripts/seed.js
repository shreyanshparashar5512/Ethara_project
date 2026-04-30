import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function run() {
  await connectDB();
  console.log('[seed] clearing existing data...');
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({})]);

  console.log('[seed] creating users...');
  const [admin, alice, bob] = await Promise.all([
    User.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      passwordHash: await User.hashPassword('admin123'),
      role: 'admin',
    }),
    User.create({
      name: 'Alice Member',
      email: 'alice@demo.com',
      passwordHash: await User.hashPassword('alice123'),
      role: 'member',
    }),
    User.create({
      name: 'Bob Member',
      email: 'bob@demo.com',
      passwordHash: await User.hashPassword('bob123'),
      role: 'member',
    }),
  ]);

  console.log('[seed] creating projects...');
  const websiteRedesign = await Project.create({
    name: 'Website Redesign',
    description: 'Redesign the marketing website with a modern look and faster load times.',
    owner: admin._id,
    members: [
      { user: admin._id, role: 'owner' },
      { user: alice._id, role: 'member' },
      { user: bob._id, role: 'member' },
    ],
  });

  const mobileApp = await Project.create({
    name: 'Mobile App v2',
    description: 'Build the v2 of the mobile app with React Native.',
    owner: alice._id,
    members: [
      { user: alice._id, role: 'owner' },
      { user: bob._id, role: 'member' },
    ],
  });

  console.log('[seed] creating tasks...');
  await Task.insertMany([
    {
      title: 'Design landing page hero section',
      description: 'Create 3 hero variants for A/B testing.',
      project: websiteRedesign._id,
      assignee: alice._id,
      createdBy: admin._id,
      status: 'in_progress',
      priority: 'high',
      dueDate: daysFromNow(3),
    },
    {
      title: 'Migrate blog CMS',
      description: 'Move from WordPress to a headless CMS.',
      project: websiteRedesign._id,
      assignee: bob._id,
      createdBy: admin._id,
      status: 'todo',
      priority: 'medium',
      dueDate: daysFromNow(10),
    },
    {
      title: 'Update footer social icons',
      project: websiteRedesign._id,
      assignee: bob._id,
      createdBy: alice._id,
      status: 'done',
      priority: 'low',
      dueDate: daysFromNow(-2),
    },
    {
      title: 'Fix meta description on /pricing',
      project: websiteRedesign._id,
      assignee: null,
      createdBy: admin._id,
      status: 'todo',
      priority: 'low',
      dueDate: daysFromNow(-5),
    },
    {
      title: 'Write accessibility checklist',
      project: websiteRedesign._id,
      assignee: alice._id,
      createdBy: admin._id,
      status: 'todo',
      priority: 'medium',
      dueDate: null,
    },
    {
      title: 'Set up React Native project',
      project: mobileApp._id,
      assignee: alice._id,
      createdBy: alice._id,
      status: 'done',
      priority: 'high',
      dueDate: daysFromNow(-7),
    },
    {
      title: 'Implement login screen',
      description: 'Use the shared auth API.',
      project: mobileApp._id,
      assignee: bob._id,
      createdBy: alice._id,
      status: 'in_progress',
      priority: 'high',
      dueDate: daysFromNow(2),
    },
    {
      title: 'Wire up push notifications',
      project: mobileApp._id,
      assignee: bob._id,
      createdBy: alice._id,
      status: 'todo',
      priority: 'medium',
      dueDate: daysFromNow(14),
    },
    {
      title: 'Draft App Store listing copy',
      project: mobileApp._id,
      assignee: null,
      createdBy: alice._id,
      status: 'todo',
      priority: 'low',
      dueDate: daysFromNow(21),
    },
    {
      title: 'Fix iOS splash screen bug',
      project: mobileApp._id,
      assignee: bob._id,
      createdBy: alice._id,
      status: 'todo',
      priority: 'high',
      dueDate: daysFromNow(-1),
    },
  ]);

  console.log('\n[seed] Done. Demo credentials:');
  console.log('  Admin:  admin@demo.com / admin123');
  console.log('  Member: alice@demo.com / alice123');
  console.log('  Member: bob@demo.com   / bob123');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed] error:', err);
  process.exit(1);
});
