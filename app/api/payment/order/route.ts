import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body as {
      amount: number; // in paise
      currency?: string;
      receipt?: string;
    };

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ amount, currency, receipt }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.description || 'Order creation failed' }, { status: 500 });
    }

    return NextResponse.json({ order: data, keyId });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 });
  }
} 