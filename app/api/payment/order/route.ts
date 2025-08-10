import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body as {
      amount: number; // in paise
      currency?: string;
      receipt?: string;
    };

    console.log('Payment order request:', { amount, currency, receipt });

    if (!amount || amount <= 0) {
      console.error('Invalid amount received:', amount);
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log('Razorpay credentials check:', {
      keyIdExists: !!keyId,
      keySecretExists: !!keySecret,
      keyIdLength: keyId?.length,
      keySecretLength: keySecret?.length
    });

    if (!keyId || !keySecret) {
      console.error('Missing Razorpay credentials:', { keyId: !!keyId, keySecret: !!keySecret });
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 });
    }

    // Validate key format (Razorpay keys typically start with 'rzp_')
    if (!keyId.startsWith('rzp_') || !keySecret.startsWith('rzp_')) {
      console.error('Invalid Razorpay key format:', { 
        keyIdStartsWithRzp: keyId.startsWith('rzp_'),
        keySecretStartsWithRzp: keySecret.startsWith('rzp_')
      });
      return NextResponse.json({ error: 'Invalid Razorpay credentials format' }, { status: 500 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    const orderPayload = { amount, currency, receipt };
    console.log('Creating Razorpay order with payload:', orderPayload);

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await res.json();
    console.log('Razorpay API response:', { 
      status: res.status, 
      ok: res.ok, 
      data: data 
    });

    if (!res.ok) {
      console.error('Razorpay API error:', {
        status: res.status,
        statusText: res.statusText,
        error: data
      });
      
      // Provide more specific error messages
      let errorMessage = 'Order creation failed';
      if (res.status === 401) {
        errorMessage = 'Authentication failed - check Razorpay credentials';
      } else if (res.status === 400) {
        errorMessage = data?.error?.description || 'Invalid request parameters';
      } else if (res.status === 429) {
        errorMessage = 'Rate limit exceeded - please try again later';
      } else if (data?.error?.description) {
        errorMessage = data.error.description;
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    console.log('Order created successfully:', data.id);
    return NextResponse.json({ order: data, keyId });
  } catch (error) {
    console.error('Order creation error:', error);
    
    // Provide more specific error information
    let errorMessage = 'Order creation failed';
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error - unable to connect to payment gateway';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Invalid response from payment gateway';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 