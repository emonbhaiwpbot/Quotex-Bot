require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

// ===== TELEGRAM OPTIONAL =====
let bot = null;
if (process.env.BOT_TOKEN) {
    const TelegramBot = require('node-telegram-bot-api');
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
}

// ===== MARKET LIST =====
const markets = [

    // Forex
    { name: "EURUSD", type: "forex", symbol: "EURUSD=X" },
    { name: "GBPUSD", type: "forex", symbol: "GBPUSD=X" },
    { name: "USDJPY", type: "forex", symbol: "USDJPY=X" },
    { name: "AUDUSD", type: "forex", symbol: "AUDUSD=X" },
    { name: "USDCAD", type: "forex", symbol: "USDCAD=X" },

    // Crypto
    { name: "BTCUSDT", type: "crypto", symbol: "BTCUSDT" },
    { name: "ETHUSDT", type: "crypto", symbol: "ETHUSDT" },

    // Stocks
    { name: "AAPL", type: "stock", symbol: "AAPL" },
    { name: "TSLA", type: "stock", symbol: "TSLA" },

    // 🔥 MASSIVE OTC
    { name: "EURUSD OTC", type: "otc" },
    { name: "GBPUSD OTC", type: "otc" },
    { name: "USDJPY OTC", type: "otc" },
    { name: "AUDUSD OTC", type: "otc" },
    { name: "USDCAD OTC", type: "otc" },
    { name: "EURGBP OTC", type: "otc" },
    { name: "EURJPY OTC", type: "otc" },
    { name: "GBPJPY OTC", type: "otc" },
    { name: "NZDUSD OTC", type: "otc" },
    { name: "USDCHF OTC", type: "otc" },
    { name: "BTCUSD OTC", type: "otc" },
    { name: "ETHUSD OTC", type: "otc" },
    { name: "Gold OTC", type: "otc" },
    { name: "Silver OTC", type: "otc" }
];

// ===== INDICATORS =====
function EMA(prices, period = 10) {
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
}

function RSI(prices, period = 14) {
    let gains = 0, losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
        let diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    let rs = gains / (losses || 1);
    return 100 - (100 / (1 + rs));
}

// ===== PRICE FETCH =====
async function getPrices(market) {

    // Forex + Stock (Yahoo)
    if (market.type === "forex" || market.type === "stock") {
        try {
            const res = await axios.get(
                `https://query1.finance.yahoo.com/v8/finance/chart/${market.symbol}?interval=1m&range=30m`
            );
            return res.data.chart.result[0].indicators.quote[0].close.filter(v => v);
        } catch {}
    }

    // Crypto (Binance)
    if (market.type === "crypto") {
        try {
            const res = await axios.get(
                `https://api.binance.com/api/v3/klines?symbol=${market.symbol}&interval=1m&limit=50`
            );
            return res.data.map(c => parseFloat(c[4]));
        } catch {}
    }

    // OTC (simulated)
    if (market.type === "otc") {
        let base = 1 + Math.random() * 0.01;
        let data = [];

        for (let i = 0; i < 40; i++) {
            base += (Math.random() - 0.5) * 0.002;
            data.push(base);
        }

        return data;
    }

    return null;
}

// ===== SIGNAL GENERATOR =====
function generateSignalData(prices) {
    const ema = EMA(prices);
    const rsi = RSI(prices);
    const last = prices[prices.length - 1];

    let signal = "WAIT";
    let power = "50%";

    if (last > ema && rsi > 50 && rsi < 70) {
        signal = "🚀 CALL";
        power = Math.floor(80 + Math.random() * 15) + "%";
    } 
    else if (last < ema && rsi < 50 && rsi > 30) {
        signal = "📉 PUT";
        power = Math.floor(80 + Math.random() * 15) + "%";
    } 
    else {
        power = Math.floor(50 + Math.random() * 20) + "%";
    }

    return { signal, power };
}

// ===== ROUTES =====
app.get('/markets', (req, res) => {
    res.json(markets);
});

app.get('/signal/:pair', async (req, res) => {
    const pair = req.params.pair;

    const market = markets.find(m => m.name === pair);
    if (!market) return res.json({ error: "Market not found" });

    const prices = await getPrices(market);
    if (!prices) return res.json({ error: "No data" });

    const data = generateSignalData(prices);

    // Telegram send
    if (bot && data.signal !== "WAIT") {
        bot.sendMessage(process.env.CHAT_ID, `${pair} → ${data.signal} (${data.power})`);
    }

    res.json({
        pair,
        signal: data.signal,
        power: data.power
    });
});

// ===== START =====
app.listen(PORT, () => {
    console.log("🚀 EMon-BHai FINAL SERVER RUNNING ON " + PORT);
});
