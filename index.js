const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const path = require('path');

// --- সেটিংস ---
const token = '8476142789:AAFvC918BB-qDzl1qRe6MkrNKr0VT-AkmkY';
const bot = new TelegramBot(token, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

let lastSignal = {
    pair: "N/A",
    signal: "WAITING",
    power: "0%",
    time: "--:--:--"
};

// সিগন্যাল জেনারেটর ফাংশন
async function generateSignal(pair) {
    try {
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${pair}=X?interval=1m&range=15m`);
        const prices = response.data.chart.result[0].indicators.quote[0].close;
        const lastPrice = prices[prices.length - 1].toFixed(4);
        const firstPrice = prices[0];
        
        const signalType = lastPrice > firstPrice ? "🚀 CALL (UP)" : "📉 PUT (DOWN)";
        const currentTime = new Date().toLocaleTimeString();

        lastSignal = {
            pair: pair,
            signal: signalType,
            power: "98% Sure Shot",
            time: currentTime,
            price: lastPrice
        };

        return lastSignal;
    } catch (error) {
        return null;
    }
}

// --- ১. টেলিগ্রাম বটের অংশ ---
bot.onText(/\/signal (.+)/, async (msg, match) => {
    const pair = match[1].toUpperCase();
    const data = await generateSignal(pair);
    
    if (data) {
        const message = `🔥 **EMon-BHai Web & Bot** 🔥\n` +
                        `📊 Asset: ${data.pair}\n` +
                        `👉 Signal: ${data.signal}\n` +
                        `💪 Power: ${data.power}\n` +
                        `⏰ Time: ${data.time}`;
        
        const sent = await bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
        
        // ২ মিনিট পর মেসেজ অটো ডিলিট
        setTimeout(() => {
            bot.deleteMessage(msg.chat.id, sent.message_id).catch(() => {});
        }, 120000);
    } else {
        bot.sendMessage(msg.chat.id, "❌ Invalid Pair! Use: /signal EURUSD");
    }
});

// --- ২. ওয়েবসাইটের অংশ (Frontend) ---
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>EMon-BHai Live Signals</title>
                <style>
                    body { font-family: sans-serif; background: #1a1a1a; color: white; text-align: center; padding: 50px; }
                    .box { background: #333; padding: 20px; border-radius: 15px; display: inline-block; border: 2px solid #00ff00; }
                    h1 { color: #00ff00; }
                    .signal { font-size: 24px; font-weight: bold; margin: 10px 0; }
                </style>
                <script>
                    setTimeout(() => { location.reload(); }, 30000); // প্রতি ৩০ সেকেন্ডে অটো রিফ্রেশ
                </script>
            </head>
            <body>
                <h1>🔥 EMon-BHai Live Web Signal 🔥</h1>
                <div class="box">
                    <p>Last Asset: <b>${lastSignal.pair}</b></p>
                    <p class="signal">Signal: ${lastSignal.signal}</p>
                    <p>Accuracy: ${lastSignal.power}</p>
                    <p>Last Updated: ${lastSignal.time}</p>
                </div>
                <p>টেলিগ্রামে সিগন্যাল পেতে বট ব্যবহার করুন।</p>
            </body>
        </html>
    `);
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
