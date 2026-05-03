// ===== GLOBAL =====
let currentPair = null;

// ===== LOAD MARKET LIST =====
async function loadMarkets() {
    try {
        const res = await fetch('/markets');
        const data = await res.json();

        const container = document.getElementById('markets');
        container.innerHTML = '';

        data.forEach(m => {
            const div = document.createElement('div');
            div.className = 'market';
            div.innerText = m.name;

            div.onclick = () => {
                currentPair = m.name;
                highlightSelected(div);
                fetchSignal();
            };

            container.appendChild(div);
        });

    } catch (e) {
        console.log("Market load error:", e);
    }
}

// ===== HIGHLIGHT SELECTED =====
function highlightSelected(el) {
    document.querySelectorAll('.market').forEach(m => {
        m.style.background = 'transparent';
    });
    el.style.background = '#1e293b';
}

// ===== FETCH SIGNAL =====
async function fetchSignal() {
    if (!currentPair) return;

    try {
        const res = await fetch('/signal/' + currentPair);
        const data = await res.json();

        if (data.error) {
            document.getElementById('signal').innerText = data.error;
            return;
        }

        document.getElementById('pair').innerText = currentPair;
        document.getElementById('signal').innerText = data.signal;

        // Color control
        if (data.signal.includes("CALL")) {
            document.getElementById('signal').style.color = '#22c55e';
        } else if (data.signal.includes("PUT")) {
            document.getElementById('signal').style.color = '#ef4444';
        } else {
            document.getElementById('signal').style.color = '#facc15';
        }

        document.getElementById('power').innerText = data.power || '--';
        document.getElementById('time').innerText = new Date().toLocaleTimeString();

    } catch (e) {
        console.log("Signal error:", e);
    }
}

// ===== AUTO REFRESH =====
setInterval(fetchSignal, 10000);

// ===== INIT =====
window.onload = () => {
    loadMarkets();
};
