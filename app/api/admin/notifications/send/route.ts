import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/shared/constants/auth-options';
import { sendPushToUsers } from '@/back/lib/send-push';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, imageUrl, url, userIds } = await req.json();
    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const summary = await sendPushToUsers(
      { title, body, imageUrl, url },
      { userIds, recordNotification: true },
    );

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('[NOTIFICATIONS_SEND_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
