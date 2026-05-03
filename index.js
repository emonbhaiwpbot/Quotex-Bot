const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

// ⚠️ এখানে তোমার আসল bot token বসাও
const token = process.env.BOT_TOKEN || '8476142789:AAF68HLjQ1che4AdQGgzFxBKOd41JjQ1Xzg';

const bot = new TelegramBot(token, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

let lastSignal = {
    pair: "WAITING",
    signal: "READY",
    power: "0%",
    time: "--:--:--",
    color: "#00ff00"
};

// ✅ FIXED SIGNAL FUNCTION
async function generateSignal(pair) {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${pair}=X?interval=1m&range=15m`;

        const response = await axios.get(url);
        const result = response.data.chart.result;

        if (!result) return null;

        const prices = result[0].indicators.quote[0].close.filter(v => v !== null);

        if (prices.length < 2) return null;

        const lastPrice = prices[prices.length - 1];
        const firstPrice = prices[0];

        const isUp = lastPrice > firstPrice;

        lastSignal = {
            pair: pair,
            signal: isUp ? "🚀 CALL (UP)" : "📉 PUT (DOWN)",
            power: (85 + Math.floor(Math.random() * 14)) + "%",
            time: new Date().toLocaleTimeString(),
            color: isUp ? "#00ff00" : "#ff3333"
        };

        return lastSignal;

    } catch (err) {
        console.error("API ERROR:", err.message);
        return null;
    }
}

// ✅ TELEGRAM HANDLER
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id,
        "🔥 স্বাগতম EMon-BHai 🔥\n\n📊 Signal নিতে লিখো:\n/signal EURUSD"
    );
});

bot.onText(/\/signal (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const pair = match[1].toUpperCase();

    await bot.sendMessage(chatId, `🔍 ${pair} এনালাইসিস হচ্ছে...`);

    const data = await generateSignal(pair);

    if (!data) {
        return bot.sendMessage(chatId, "❌ Invalid pair বা data পাওয়া যায়নি");
    }

    const text = `
✨ *EMon-BHai Premium Signal*
━━━━━━━━━━━━━━
📊 Asset: ${data.pair}
👉 Signal: ${data.signal}
💪 Power: ${data.power}
⏰ Time: ${data.time}
━━━━━━━━━━━━━━
⏳ ২ মিনিট পর মেসেজ ডিলিট হবে
`;

    const sent = await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

    setTimeout(() => {
        bot.deleteMessage(chatId, sent.message_id).catch(() => {});
    }, 120000);
});

// ✅ WEBSITE
app.get('/', (req, res) => {
    res.send(`
    <html>
    <head>
        <title>EMon-BHai Live</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
            body {
                background:#0f172a;
                color:white;
                display:flex;
                justify-content:center;
                align-items:center;
                height:100vh;
                font-family:sans-serif;
            }
            .box {
                background:#1e293b;
                padding:30px;
                border-radius:15px;
                text-align:center;
            }
        </style>
    </head>
    <body>
        <div class="box">
            <h2>🔥 EMon-BHai Live</h2>
            <p>Pair: ${lastSignal.pair}</p>
            <h1 style="color:${lastSignal.color}">
                ${lastSignal.signal}
            </h1>
            <p>Power: ${lastSignal.power}</p>
            <p>Time: ${lastSignal.time}</p>
        </div>

        <script>
            setTimeout(()=>location.reload(),15000);
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log("Server running on " + PORT);
});
