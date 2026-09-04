const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const User = require('../models/User');

/**
 * Format live MongoDB data into a grounded system knowledge context for Gemini AI
 */
const buildDatabaseContext = async (user) => {
  try {
    let buses = [];
    if (mongoose.connection.readyState === 1) {
      buses = await Bus.find({ isActive: true })
        .select('busNumber operatorName busType from to routeStops departureTime arrivalTime fare totalSeats')
        .lean();
    }

    let context = '### CURRENT LIVE BUS FLEET & ROUTES (FROM ROUTELK MONGODB DATABASE):\n';
    buses.forEach((b, idx) => {
      const stops = Array.isArray(b.routeStops) && b.routeStops.length > 0 ? b.routeStops.join(', ') : 'Direct';
      context += `${idx + 1}. [${b.busNumber}] ${b.operatorName} (${b.busType}) | Route: ${b.from} → ${b.to} | Dep: ${b.departureTime} Arr: ${b.arrivalTime} | Fare: Rs. ${b.fare} LKR | Capacity: ${b.totalSeats} seats | Stops: ${stops}\n`;
    });

    if (user) {
      context += `\n### LOGGED-IN PASSENGER ACCOUNT DETAILS:\n`;
      context += `- Name: ${user.name}\n`;
      context += `- Email: ${user.email}\n`;
      context += `- Current Wallet Balance: Rs. ${user.walletBalance || 0} LKR\n`;

      let recentBookings = [];
      if (mongoose.connection.readyState === 1) {
        recentBookings = await Booking.find({ userId: user._id })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();
      }

      if (recentBookings.length > 0) {
        context += `\n### PASSENGER RECENT BOOKINGS:\n`;
        recentBookings.forEach((bk) => {
          context += `- Booking Reference: ${bk.bookingId} | Travel Date: ${bk.travelDate} | Seats: ${bk.seats.join(', ')} | Fare: Rs. ${bk.totalFare} | Status: ${bk.status} | Payment: ${bk.paymentMethod || 'WALLET'}\n`;
        });
      } else {
        context += `- No prior bookings recorded yet.\n`;
      }
    } else {
      context += `\n### PASSENGER STATUS: Guest / Not signed in.\n`;
    }

    return context;
  } catch (err) {
    console.error('[ChatController] Error fetching MongoDB data:', err);
    return 'Bus database information is currently updating.';
  }
};

/**
 * Intelligent MongoDB Rule-Based Engine (used if GEMINI_API_KEY is not configured or as reliable fallback)
 */
const generateIntelligentFallbackResponse = async (userQuery, user) => {
  const query = userQuery.toLowerCase().trim();
  let buses = [];
  if (mongoose.connection.readyState === 1) {
    try {
      buses = await Bus.find({ isActive: true }).lean();
    } catch (err) {
      buses = [];
    }
  }

  // 1. Check for passenger's wallet balance / refund questions
  if (query.includes('wallet') || query.includes('balance') || query.includes('topup') || query.includes('top up') || query.includes('cash')) {
    if (user) {
      return `💳 **Your RouteLK Wallet Status:**\n- **Available Balance:** Rs. ${(user.walletBalance || 0).toLocaleString()} LKR\n\n**How Wallet Works:**\n- You can top up your wallet instantly using **Google Pay** (or cards) in your Dashboard.\n- When you reserve bus seats, the fare is automatically deducted from your wallet.\n- If you cancel a booking, the full fare is **instantly refunded** back to your wallet!`;
    } else {
      return `💳 **RouteLK Digital Passenger Wallet:**\n- Every passenger has a digital wallet in RouteLK.\n- You can top up funds via **Google Pay** directly in your Dashboard.\n- Ticket fares are deducted automatically upon seat reservation, and cancelled trips are refunded back immediately.\n\n*Please log in to view your current balance.*`;
    }
  }

  // 2. Check for passenger's existing bookings
  if (query.includes('my booking') || query.includes('my trip') || query.includes('ticket') || query.includes('reservation')) {
    if (user) {
      let bookings = [];
      try {
        bookings = await Booking.find({ userId: user._id }).sort({ createdAt: -1 }).limit(3).lean();
      } catch (err) {
        bookings = [];
      }
      if (bookings.length > 0) {
        let msg = `🎫 **Here are your latest bus bookings:**\n\n`;
        bookings.forEach((b) => {
          msg += `- **Ref: ${b.bookingId}** | Date: ${b.travelDate} | Seats: #${b.seats.join(', #')} | Total: Rs. ${b.totalFare} | Status: **${b.status}**\n`;
        });
        msg += `\nYou can view full ticket details and QR codes in your **My Trips** dashboard!`;
        return msg;
      } else {
        return `🎫 You do not have any active bus bookings yet. Use the search bar above to book a seat on our highway or intercity buses!`;
      }
    } else {
      return `🎫 To view your active reservations and tickets, please sign in to your passenger account.`;
    }
  }

  // 3. Search for specific route locations (from/to)
  const matchedBuses = buses.filter((b) => {
    const fromMatch = query.includes(b.from.toLowerCase());
    const toMatch = query.includes(b.to.toLowerCase());
    const stopMatch = Array.isArray(b.routeStops) && b.routeStops.some((s) => query.includes(s.toLowerCase()));
    const numberMatch = query.includes(b.busNumber.toLowerCase());
    const operatorMatch = query.includes(b.operatorName.toLowerCase());
    return fromMatch || toMatch || stopMatch || numberMatch || operatorMatch;
  });

  if (matchedBuses.length > 0) {
    let response = `🚌 **Found ${matchedBuses.length} active bus service${matchedBuses.length > 1 ? 's' : ''} in our database:**\n\n`;
    matchedBuses.slice(0, 4).forEach((b) => {
      response += `• **${b.operatorName}** (${b.busType})\n  - **Route:** ${b.from} → ${b.to}\n  - **Departure:** ${b.departureTime} | **Arrival:** ${b.arrivalTime}\n  - **Fare:** Rs. ${b.fare} LKR per seat\n  - **Bus Number:** \`${b.busNumber}\`\n\n`;
    });
    response += `💡 *You can select any of these buses and choose your seats directly on RouteLK!*`;
    return response;
  }

  // 4. Default helpful overview of routes in DB
  const destinations = [...new Set(buses.map((b) => b.to))].slice(0, 6).join(', ');
  return `👋 Hello! I am the **RouteLK AI Transit Assistant**.\n\nI can help you with live bus schedules, ticket fares, route stops, and booking management directly from our MongoDB database.\n\n📍 **Popular Destinations Available:** ${destinations}\n\n**Try asking me:**\n- *"What buses are available from Colombo to Kandy?"*\n- *"How much is the ticket to Jaffna or Galle?"*\n- *"Show me AC Express buses"*\n- *"What is my wallet balance?"*`;
};

/**
 * @desc    Process passenger chatbot interaction
 * @route   POST /api/chat
 * @access  Public (Guest) or Authenticated (Passenger)
 */
const handleChatMessage = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required.',
      });
    }

    const userMessage = message.trim();
    const user = req.user || null;

    // Fetch real-time context from MongoDB
    const dbContext = await buildDatabaseContext(user);

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();

    // If Gemini API Key is provided, call Google Gemini 2.5 Flash
    if (apiKey) {
      try {
        const systemInstruction = `You are "RouteLK AI Assistant", a smart and friendly Sri Lankan public transit assistant for the RouteLK bus booking platform.
Your primary role is to assist passengers with real-time bus schedules, fares, route stops, operators, seat reservations, and wallet management.
You have DIRECT REAL-TIME ACCESS to the live RouteLK MongoDB database provided below:

${dbContext}

RULES FOR YOUR RESPONSES:
1. Ground your answers strictly on the live MongoDB database data provided above.
2. If the user asks for bus routes, departure/arrival times, or fares, quote the exact details from the database context (e.g. Bus Number, Operator Name, AC/NON_AC, Fare in LKR, Departure and Arrival).
3. If the user asks about their wallet balance or bookings, use the logged-in passenger data in the context. If they are a guest, politely advise them to sign in.
4. Keep answers concise, helpful, friendly, and well-structured using markdown bullet points and bold text.
5. Use Sri Lankan currency formatting (e.g. Rs. 1,180 LKR).
6. Never make up buses or routes that do not exist in the database context.`;

        // Format conversation history for Gemini API
        const contents = [];

        // Include recent history (up to last 6 turns)
        if (Array.isArray(history) && history.length > 0) {
          history.slice(-6).forEach((h) => {
            if (h.role && h.content) {
              contents.push({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }],
              });
            }
          });
        }

        // Add current user prompt
        contents.push({
          role: 'user',
          parts: [{ text: userMessage }],
        });

        // Call Gemini 2.5 Flash endpoint
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            contents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 800,
            },
          }),
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const candidate = geminiData.candidates?.[0];
          const textReply = candidate?.content?.parts?.[0]?.text;

          if (textReply) {
            return res.status(200).json({
              success: true,
              reply: textReply,
              source: 'gemini-2.5-flash',
            });
          }
        } else {
          const errText = await geminiResponse.text();
          console.warn('[Gemini API Warning] Non-200 response from Gemini:', errText);
        }
      } catch (geminiError) {
        console.error('[Gemini API Error]', geminiError);
      }
    }

    // Fallback engine directly powered by live MongoDB data
    const fallbackReply = await generateIntelligentFallbackResponse(userMessage, user);

    res.status(200).json({
      success: true,
      reply: fallbackReply,
      source: 'mongodb-grounded-engine',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleChatMessage,
  buildDatabaseContext,
  generateIntelligentFallbackResponse,
};
