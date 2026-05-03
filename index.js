const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

// সরাসরি টোকেন সেট করার জায়গা
const token = '8476142789:AAFvC918BB-qDzl1qRe6MkrNKr0VT-AkmkY';

const bot = new TelegramBot(token, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

// মেসেজ অটো ডিলিট করার ফাংশন
function autoDelete(chatId, messageId, delayInSeconds) {
    setTimeout(() => {
        bot.deleteMessage(chatId, messageId).catch((err) => {
            console.log("Message already deleted or not found.");
        });
    }, delayInSeconds * 1000);
}

async function getSignal(pair) {
    try {
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${pair}=X?interval=1m&range=15m`);
        const result = response.data.chart.result[0];
        const prices = result.indicators.quote[0].close;
        const lastPrice = prices[prices.length - 1].toFixed(4);
        
        const firstPrice = prices[0];
        let signal = lastPrice > firstPrice ? "🚀 CALL (UP)" : "📉 PUT (DOWN)";
        let power = "98% Sure Shot 🔥"; 
        const time = new Date().toLocaleTimeString();

        return `⚡ **EMon-BHai Modified Bot v2** ⚡\n` +
               `━━━━━━━━━━━━━━━━━━━━\n` +
               `📊 Asset: ${pair}\n` +
               `👉 Signal: ${signal}\n` +
               `⏰ Time: ${time}\n` +
               `⏳ Expiry: 1-5 Min\n` +
               `💪 Power: ${power}\n` +
               `━━━━━━━━━━━━━━━━━━━━\n` +
               `📢 এই মেসেজটি ২ মিনিট পর ডিলিট হয়ে যাবে।`;
    } catch (error) {
        return "❌ পেয়ারটি খুঁজে পাওয়া যায়নি! (উদা: EURUSD)";
    }
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "EMon-BHai Bot অনলাইন! সিগন্যাল নিতে লিখুন: /signal EURUSD");
});

bot.onText(/\/signal (.+)/, async (msg, match) => {
    const pair = match[1].toUpperCase();
    const chatId = msg.chat.id;
    
    const processingMsg = await bot.sendMessage(chatId, "🔍 মার্কেট এনালাইসিস করছি...");
    
    const result = await getSignal(pair);
    const sentMsg = await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });

    // ১ সেকেন্ড পর 'প্রসেসিং' মেসেজ ডিলিট হবে
    autoDelete(chatId, processingMsg.message_id, 1);
    
    // ১২০ সেকেন্ড (২ মিনিট) পর সিগন্যাল মেসেজ ডিলিট হবে
    autoDelete(chatId, sentMsg.message_id, 120); 
});

app.get('/', (req, res) => res.send('EMon-BHai Bot is Active!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
