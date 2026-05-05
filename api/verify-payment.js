export default async function handler(req, res) {
// Allow requests from your site
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) return res.status(200).end();
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘Method not allowed’ });

const { paymentId } = req.body;

if (!paymentId || paymentId.trim().length < 6) {
return res.status(400).json({ error: ‘Invalid payment ID’ });
}

try {
const secretKey = process.env.STRIPE_SECRET_KEY;

```
// Try looking up as a Payment Intent
const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentId.trim()}`, {
  headers: {
    'Authorization': `Bearer ${secretKey}`
  }
});

const data = await response.json();

if (data.error) {
  // Try as a checkout session ID instead
  const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${paymentId.trim()}`, {
    headers: { 'Authorization': `Bearer ${secretKey}` }
  });
  const sessionData = await sessionRes.json();

  if (sessionData.error) {
    return res.status(400).json({ verified: false, error: 'Payment not found' });
  }

  if (sessionData.payment_status === 'paid') {
    return res.status(200).json({ verified: true });
  } else {
    return res.status(400).json({ verified: false, error: 'Payment not completed' });
  }
}

if (data.status === 'succeeded') {
  return res.status(200).json({ verified: true });
} else {
  return res.status(400).json({ verified: false, error: 'Payment not completed' });
}
```

} catch (err) {
console.error(‘Stripe verification error:’, err);
return res.status(500).json({ verified: false, error: ‘Verification failed’ });
}
}