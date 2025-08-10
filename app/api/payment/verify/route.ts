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

    console.log('Payment verification request:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      hasSignature: !!razorpay_signature
    });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('Missing required fields for payment verification');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET as string;
    if (!secret) {
      console.error('Missing Razorpay secret key');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Verify signature
    const hmacPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(hmacPayload)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;
    
    console.log('Payment verification result:', {
      isValid,
      expectedSignature: expectedSignature.substring(0, 10) + '...',
      receivedSignature: razorpay_signature.substring(0, 10) + '...'
    });

    if (!isValid) {
      console.error('Payment signature verification failed');
      return NextResponse.json({ 
        success: false, 
        error: 'Payment signature verification failed' 
      });
    }

    // Optionally save payment details to database
    try {
      // You can add database operations here to save payment details
      console.log('Payment verified successfully:', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
    } catch (dbError) {
      console.error('Database error during payment verification:', dbError);
      // Don't fail the verification if database save fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Verification failed' 
    }, { status: 500 });
  }
} 