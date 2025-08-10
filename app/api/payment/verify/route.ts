import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET as string;
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Verify signature
    const hmacPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(hmacPayload)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    return NextResponse.json({ success: isValid });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
} 