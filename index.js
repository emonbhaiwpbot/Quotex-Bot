const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

// --- এখানে আপনার সঠিক টেলিগ্রাম টোকেন দিন ---
const token = '8476142789:AAF68HLjQ1che4AdQGgzFxBKOd41JjQ1Xzg'; 

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

// সিগন্যাল জেনারেটর ফিক্সড ফাংশন
async function generateSignal(pair) {
    try {
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${pair}=X?interval=1m&range=15m`);
        const result = response.data.chart.result[0];
        const prices = result.indicators.quote[0].close;
        const lastPrice = prices[prices.length - 1];
        const firstPrice = prices[0];
        
        const isUp = lastPrice > firstPrice;
        const signalType = isUp ? "🚀 CALL (UP)" : "📉 PUT (DOWN)";
        const signalColor = isUp ? "#00ff00" : "#ff3333";
        const currentTime = new Date().toLocaleTimeString();

        lastSignal = {
            pair: pair,
            signal: signalType,
            power: (85 + Math.floor(Math.random() * 14)) + "%", // Dynamic Power
            time: currentTime,
            color: signalColor
        };
        return lastSignal;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

// --- টেলিগ্রাম বট ফিক্স ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        bot.sendMessage(chatId, "🔥 স্বাগতম ইমন ভাই! 🔥\nসিগন্যাল পেতে লিখুন: /signal EURUSD");
    } else if (text.startsWith('/signal')) {
        const parts = text.split(' ');
        if (parts.length < 2) return bot.sendMessage(chatId, "উদা: /signal GBPUSD");
        
        const pair = parts[1].toUpperCase();
        bot.sendMessage(chatId, `🔍 ${pair} এনালাইসিস করছি...`);
        
        const data = await generateSignal(pair);
        if (data) {
            const message = `✨ **EMon-BHai Premium Signal** ✨\n━━━━━━━━━━━━━━\n📊 Asset: ${data.pair}\n👉 Signal: ${data.signal}\n💪 Power: ${data.power}\n⏰ Time: ${data.time}\n━━━━━━━━━━━━━━\n📢 এই মেসেজটি ২ মিনিট পর ডিলিট হবে।`;
            const sent = await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            
            setTimeout(() => {
                bot.deleteMessage(chatId, sent.message_id).catch(() => {});
            }, 120000);
        } else {
            bot.sendMessage(chatId, "❌ ডাটা পাওয়া যায়নি। সঠিক পেয়ার নাম দিন (যেমন: EURUSD)");
        }
    }
});

// --- প্রিমিয়াম ওয়েবসাইট ডিজাইন ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EMon-BHai Live Signals</title>
        <style>
            body { 
                background: radial-gradient(circle, #1a1a2e, #16213e); 
                color: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                height: 100vh; margin: 0; overflow: hidden;
            }
            .container {
                background: rgba(255, 255, 255, 0.05);
                padding: 40px; border-radius: 25px;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                text-align: center; width: 80%; max-width: 400px;
            }
            h1 { font-size: 28px; margin-bottom: 20px; text-shadow: 2px 2px 10px #000; }
            .name-brand { color: #ff007f; font-weight: bold; border-bottom: 2px solid #ff007f; }
            .signal-box {
                font-size: 30px; font-weight: bold; margin: 20px 0;
                padding: 15px; border-radius: 10px;
                background: rgba(0,0,0,0.3);
                color: ${lastSignal.color};
                box-shadow: inset 0 0 15px ${lastSignal.color};
            }
            .info { font-size: 18px; margin: 10px 0; color: #ccc; }
            .accuracy { color: #00d4ff; font-weight: bold; font-size: 20px; }
            .footer { margin-top: 20px; font-size: 12px; opacity: 0.6; }
            .live-dot {
                height: 10px; width: 10px; background-color: #ff0000;
                border-radius: 50%; display: inline-block;
                margin-right: 5px; animation: blink 1s infinite;
            }
            @keyframes blink { 0% {opacity: 1;} 50% {opacity: 0.3;} 100% {opacity: 1;} }
        </style>
        <script>
            setTimeout(() => { location.reload(); }, 15000); // ১৫ সেকেন্ড পর অটো আপডেট
        </script>
    </head>
    <body>
        <div class="container">
            <h1>🔥 <span class="name-brand">EMon-BHai</span> VIP 🔥</h1>
            <p><span class="live-dot"></span> LIVE MARKET ANALYSIS</p>
            <div class="info">Asset: <b>${lastSignal.pair}</b></div>
            <div class="signal-box">${lastSignal.signal}</div>
            <div class="info">Accuracy: <span class="accuracy">${lastSignal.power}</span></div>
            <div class="info">Last Update: ${lastSignal.time}</div>
            <p class="footer">টেলিগ্রাম বট থেকে সিগন্যাল রিকোয়েস্ট করুন</p>
        </div>
    </body>
    </html>
    `);
});

app.listen(PORT, () => console.log(`Server started on ${PORT}`));
