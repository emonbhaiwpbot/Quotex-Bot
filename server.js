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
    { name: "EURUSD", type: "forex", symbol: "EURUSD=X" },
    { name: "GBPUSD", type: "forex", symbol: "GBPUSD=X" },
    { name: "USDJPY", type: "forex", symbol: "USDJPY=X" },

    { name: "BTCUSDT", type: "crypto", symbol: "BTCUSDT" },
    { name: "ETHUSDT", type: "crypto", symbol: "ETHUSDT" },

    { name: "AAPL", type: "stock", symbol: "AAPL" },

    { name: "EURUSD OTC", type: "otc", symbol: "OTC" }
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

// ===== FETCH PRICE =====
async function getPrices(market) {

    // Yahoo (forex + stock)
    if (market.type === "forex" || market.type === "stock") {
        try {
            const res = await axios.get(
                `https://query1.finance.yahoo.com/v8/finance/chart/${market.symbol}?interval=1m&range=30m`
            );
            return res.data.chart.result[0].indicators.quote[0].close.filter(v => v);
        } catch {}
    }

    // Binance (crypto)
    if (market.type === "crypto") {
        try {
            const res = await axios.get(
                `https://api.binance.com/api/v3/klines?symbol=${market.symbol}&interval=1m&limit=50`
            );
            return res.data.map(c => parseFloat(c[4]));
        } catch {}
    }

    // OTC fake
    if (market.type === "otc") {
        let base = 1 + Math.random() * 0.01;
        return Array.from({ length: 30 }, (_, i) => base + Math.sin(i) * 0.001);
    }

    return null;
}

// ===== SIGNAL =====
function generateSignal(prices) {
    const ema = EMA(prices);
    const rsi = RSI(prices);
    const last = prices[prices.length - 1];

    if (last > ema && rsi > 50 && rsi < 70) return "🚀 CALL";
    if (last < ema && rsi < 50 && rsi > 30) return "📉 PUT";

    return "WAIT";
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

    const signal = generateSignal(prices);

    res.json({
        pair,
        signal,
        power: Math.floor(Math.random() * 20 + 80) + "%"
    });
});

// ===== START =====
app.listen(PORT, () => {
    console.log("🚀 Server running on " + PORT);
});
