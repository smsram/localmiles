const prisma = require('../utils/prisma');

// 1. VERIFY WEBHOOK (Meta asks: "Are you real?")
exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      console.log('✅ Meta Webhook Verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
};

// 2. RECEIVE MESSAGE (User sends: "Verify 1234")
exports.handleIncomingMessage = async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const message = changes?.messages?.[0];

    if (message?.type === 'text') {
      const from = message.from; // User's phone (e.g., 919999999999)
      const text = message.text.body.trim(); // The code (e.g., "1234")

      console.log(`📩 Message from ${from}: ${text}`);

      // LOGIC: Find user with this verification code
      // Note: In real app, you might match phone number too, 
      // but for "User-to-Bot", we match the unique code.
      
      const user = await prisma.user.findFirst({
        where: { verificationToken: text } 
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            isPhoneVerified: true,
            phone: from, // Save their verified number
            verificationToken: null // Clear code
          }
        });
        console.log(`✅ User ${user.email} verified via WhatsApp!`);
        
        // Optional: Send reply back using Meta API (Not shown for brevity)
      }
    }

    res.sendStatus(200); // Always say "OK" to Meta
  } catch (error) {
    console.error("Webhook Error:", error);
    res.sendStatus(500);
  }
};