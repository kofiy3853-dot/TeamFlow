import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { hashPassword } from '@/lib/auth-node';

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const defaultUsers = [
      {
        fullname: 'Team Owner',
        email: 'owner@teamflow.com',
        phone: '+233 24 000 0001',
        password: await hashPassword('owner123'),
        subscriptionStatus: 'ACTIVE',
        role: 'OWNER',
      },
      {
        fullname: 'Team Admin',
        email: 'admin@teamflow.com',
        phone: '+233 24 000 0002',
        password: await hashPassword('admin123'),
        subscriptionStatus: 'ACTIVE',
        role: 'ADMIN',
      },
      {
        fullname: 'Team Member',
        email: 'member@teamflow.com',
        phone: '+233 24 000 0003',
        password: await hashPassword('member123'),
        subscriptionStatus: 'ACTIVE',
        role: 'MEMBER',
      },
    ];

    // Upsert each user by email so re-running is safe
    for (const u of defaultUsers) {
      await User.findOneAndUpdate(
        { email: u.email },
        { $set: u },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      message: 'Default users created successfully',
      logins: [
        { role: 'OWNER', email: 'owner@teamflow.com', password: 'owner123' },
        { role: 'ADMIN', email: 'admin@teamflow.com', password: 'admin123' },
        { role: 'MEMBER', email: 'member@teamflow.com', password: 'member123' },
      ],
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed', details: error.message }, { status: 500 });
  }
}
