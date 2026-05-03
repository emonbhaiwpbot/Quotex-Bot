let currentPair = null;

async function loadMarkets() {
    const res = await fetch('/markets');
    const data = await res.json();

    const box = document.getElementById('markets');

    data.forEach(m => {
        const div = document.createElement('div');
        div.className = 'market';
        div.innerText = m.name;

        div.onclick = () => {
            currentPair = m.name;
            fetchSignal();
        };

        box.appendChild(div);
    });
}

async function fetchSignal() {
    if (!currentPair) return;

    const res = await fetch('/signal/' + currentPair);
    const data = await res.json();

    document.getElementById('pair').innerText = currentPair;
    document.getElementById('signal').innerText = data.signal;
    document.getElementById('power').innerText = data.power;
}

setInterval(fetchSignal, 10000);
loadMarkets();
