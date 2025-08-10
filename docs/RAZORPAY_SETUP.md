# Razorpay Payment Integration Setup

This document provides step-by-step instructions for setting up Razorpay payment integration in the bus pass booking system.

## Prerequisites

1. A Razorpay account (sign up at https://razorpay.com)
2. Node.js and npm installed
3. Access to your project's environment configuration

## Step 1: Get Razorpay Credentials

1. **Login to Razorpay Dashboard**
   - Go to https://dashboard.razorpay.com
   - Sign in to your account

2. **Navigate to API Keys**
   - Go to Settings → API Keys
   - Or use the direct link: https://dashboard.razorpay.com/app/keys

3. **Generate API Keys**
   - Click "Generate Key Pair"
   - Choose between Test Mode and Live Mode
   - **For development/testing**: Use Test Mode
   - **For production**: Use Live Mode

4. **Copy Your Keys**
   - **Key ID**: Starts with `rzp_test_` (test) or `rzp_live_` (live)
   - **Key Secret**: The secret key (keep this secure!)

## Step 2: Configure Environment Variables

1. **Open your `.env.local` file**
   ```bash
   nano .env.local
   ```

2. **Add Razorpay credentials**
   ```env
   # Razorpay Configuration
   RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
   RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
   ```

3. **Replace with your actual keys**
   - Replace `YOUR_KEY_ID_HERE` with your actual Key ID
   - Replace `YOUR_KEY_SECRET_HERE` with your actual Key Secret

## Step 3: Test the Configuration

1. **Run the test script**
   ```bash
   node scripts/test-razorpay.js
   ```

2. **Check the output**
   - ✅ All tests should pass
   - If there are errors, follow the troubleshooting steps below

## Step 4: Test the Payment Flow

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Navigate to the payment page**
   - Go through the booking flow
   - Reach the payment page
   - Click "Online Payment"

3. **Test with Razorpay test cards**
   - **Success**: 4111 1111 1111 1111
   - **Failure**: 4000 0000 0000 0002
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date

## Troubleshooting

### Common Issues

1. **"Razorpay not configured" error**
   - Check if environment variables are set correctly
   - Restart the development server after changing `.env.local`
   - Verify the variable names are exactly `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

2. **"Authentication failed" error**
   - Verify your API keys are correct
   - Make sure you're using the right environment (test/live)
   - Check if your Razorpay account is active

3. **"Invalid amount" error**
   - Ensure the amount is being passed in paise (multiply by 100)
   - Check that the amount is a positive integer

4. **Payment modal doesn't open**
   - Check browser console for JavaScript errors
   - Verify Razorpay script is loading
   - Check network connectivity

### Debug Steps

1. **Check server logs**
   ```bash
   npm run dev
   ```
   Look for detailed error messages in the terminal

2. **Check browser console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for error messages

3. **Check network requests**
   - Open Developer Tools (F12)
   - Go to Network tab
   - Look for failed requests to `/api/payment/order`

4. **Verify environment variables**
   ```bash
   node scripts/test-razorpay.js
   ```

## Production Deployment

1. **Use Live Mode Keys**
   - Generate live mode API keys from Razorpay dashboard
   - Update environment variables with live keys

2. **Set Environment Variables**
   - Add the live keys to your production environment
   - Never commit live keys to version control

3. **Test in Production**
   - Use real payment methods for testing
   - Monitor payment logs and webhooks

## Security Best Practices

1. **Never expose secret keys**
   - Keep `RAZORPAY_KEY_SECRET` secure
   - Don't commit it to version control
   - Use environment variables

2. **Verify payments server-side**
   - Always verify payment signatures
   - Don't rely on client-side verification only

3. **Use HTTPS in production**
   - Razorpay requires HTTPS for live payments
   - Ensure your domain has valid SSL certificate

## Support

If you encounter issues:

1. Check the [Razorpay Documentation](https://razorpay.com/docs/)
2. Review the troubleshooting section above
3. Check server logs and browser console
4. Contact your system administrator

## File Structure

```
app/
├── api/
│   └── payment/
│       ├── order/
│       │   └── route.ts          # Creates Razorpay orders
│       └── verify/
│           └── route.ts          # Verifies payment signatures
├── payment/
│   └── page.tsx                  # Payment page UI
scripts/
└── test-razorpay.js             # Test script for credentials
``` 