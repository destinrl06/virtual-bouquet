const MAX_BUNGA = 15;
const SLOT_ORDER = [
    'slot-tengah', 'slot-kiri', 'slot-kanan',
    ...Array.from({ length: MAX_BUNGA - 3 }, (_, index) => `slot-tambahan-${index + 1}`)
];
const FLOWER_LAYOUT = [
    [0, -12, 0], [-10, -4, -6], [10, -4, 6],
    [-20, 4, -10], [20, 4, 10], [-26, 10, -12],
    [26, 10, 12], [-6, -28, -4], [6, -28, 4],
    [-16, -20, -8], [16, -20, 8], [-22, -2, -11],
    [22, -2, 11], [-12, -40, -6], [12, -40, 6]
];
const FLOWER_BY_ID = {
    1: 'alcea.png',
    2: 'crown.png',
    3: 'flitillaria.png',
    4: 'garbera.png',
    5: 'guzmania.png',
    6: 'hosta.png',
    7: 'maltese.png',
    8: 'marigold.png',
    9: 'narcissus.png',
    10: 'plumeria.png',
    11: 'rose.png',
    12: 'forsythia.png'
};
const FLOWER_ID_BY_FILE = Object.fromEntries(
    Object.entries(FLOWER_BY_ID).map(([id, file]) => [file, id])
);

function siapkanSlotBunga() {
    const stage = document.querySelector('.bouquet-stage');
    const ribbon = stage.querySelector('.bouquet-ribbon');

    SLOT_ORDER.forEach((slotId, index) => {
        let slotEl = document.getElementById(slotId);
        if (!slotEl) {
            slotEl = document.createElement('div');
            slotEl.id = slotId;
            slotEl.className = 'flower-slot flower-layer';
            stage.insertBefore(slotEl, ribbon);
        }

        const [x, y, rotation] = FLOWER_LAYOUT[index];
        slotEl.style.setProperty('--flower-x', `${x}px`);
        slotEl.style.setProperty('--flower-y', `${y}px`);
        slotEl.style.setProperty('--flower-rotation', `${rotation}deg`);
        slotEl.style.zIndex = String(2 + (index % 3));
        slotEl.addEventListener('click', () => {
            if (pilihanBunga[slotId]) hapusDariSlot(slotId);
        });
    });
}

siapkanSlotBunga();

// Track: slotId → { file, el (flower-item button) }
let pilihanBunga = {}; // { 'slot-tengah': {file, itemEl}, ... }
let slotTerisi = 0;

function pilihBunga(namaFile, itemEl) {
    // Cari slot kosong berikutnya
    const slotKosong = SLOT_ORDER.find(id => !pilihanBunga[id]);
    if (!slotKosong) return; // penuh

    pasangBungaKeSlot(namaFile, itemEl, slotKosong);
    updateDisabledState();
}

function pasangBungaKeSlot(namaFile, itemEl, slotId) {
    const slotEl = document.getElementById(slotId);
    slotEl.innerHTML = '';
    slotEl.classList.add('is-filled');
    const img = document.createElement('img');
    img.src = `assets/flowers/${namaFile}`;
    img.alt = namaFile;
    slotEl.appendChild(img);

    pilihanBunga[slotId] = { file: namaFile, itemEl };
    slotTerisi++;
    itemEl.classList.add('selected');
}

function hapusDariSlot(slotId) {
    const slotEl = document.getElementById(slotId);
    const dataBunga = pilihanBunga[slotId];
    slotEl.innerHTML = '';
    slotEl.classList.remove('is-filled');
    slotTerisi--;
    delete pilihanBunga[slotId];

    if (dataBunga && !Object.values(pilihanBunga).some(bunga => bunga.itemEl === dataBunga.itemEl)) {
        dataBunga.itemEl.classList.remove('selected');
    }
    updateDisabledState();
}

function updateDisabledState() {
    const penuh = slotTerisi >= MAX_BUNGA;
    document.querySelectorAll('.flower-item').forEach(el => {
        const dipilih = el.classList.contains('selected');
        if (penuh && !dipilih) {
            el.classList.add('disabled');
        } else {
            el.classList.remove('disabled');
        }
    });
}

function resetBuket() {
    SLOT_ORDER.forEach(id => {
        const slotEl = document.getElementById(id);
        slotEl.innerHTML = '';
        slotEl.classList.remove('is-filled');
    });
    pilihanBunga = {};
    slotTerisi = 0;
    document.querySelectorAll('.flower-item').forEach(el => {
        el.classList.remove('selected', 'disabled');
    });
    document.getElementById('note-card').classList.add('hidden');
    document.getElementById('input-note').value = '';
    document.getElementById('note-text-preview').textContent = '';
    document.getElementById('note-text-preview').style.removeProperty('--note-font-size');
}

function downloadBuket() {
    const areaKartu = document.getElementById('main-card');
    if (slotTerisi === 0) {
        alert('Pilih dulu bunganya ya.');
        return;
    }
    const semuaGambar = areaKartu.querySelectorAll('img');
    const janjiGambar = Array.from(semuaGambar).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => { img.onload = res; img.onerror = res; });
    });
    const fontSiap = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.all([...janjiGambar, fontSiap]).then(() => {
        html2canvas(areaKartu, {
            useCORS: true,
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false
        }).then(canvas => {
            const a = document.createElement('a');
            a.download = 'buket-bunga.png';
            a.href = canvas.toDataURL('image/png');
            a.click();
        });
    });
}

function getSelectedFlowerFiles() {
    return Object.values(pilihanBunga)
        .map(({ file }) => FLOWER_ID_BY_FILE[file])
        .filter(Boolean);
}

function buatBouquetUrl(pesanText) {
    const daftarIdBunga = getSelectedFlowerFiles();
    // Mengikuti domain aktif, termasuk saat nanti di-deploy ke GitHub Pages.
    const baseUrl = window.location.origin.includes('127.0.0.1') || window.location.origin.includes('localhost') ? window.location.href.split('?')[0] : window.location.href.split('?')[0];
    return `${baseUrl}?f=${daftarIdBunga.join(',')}&msg=${encodeURIComponent(pesanText)}`;
}

function renderBuketDariUrl() {
    const params = new URLSearchParams(window.location.search);
    const bungaDariUrl = (params.get('f') || '')
        .split(',')
        .map(id => FLOWER_BY_ID[id.trim()])
        .filter(Boolean)
        .slice(0, MAX_BUNGA);
    const pesanDariUrl = params.get('msg');

    bungaDariUrl.forEach((namaFile, index) => {
        const itemEl = Array.from(document.querySelectorAll('.flower-item'))
            .find(el => el.getAttribute('onclick')?.includes(`'${namaFile}'`));
        const slotId = SLOT_ORDER[index];
        if (itemEl && slotId && !pilihanBunga[slotId]) {
            pasangBungaKeSlot(namaFile, itemEl, slotId);
        }
    });

    if (pesanDariUrl) {
        const noteInput = document.getElementById('input-note');
        noteInput.value = pesanDariUrl;
        tampilkanPesanCatatan(pesanDariUrl);
    }

    updateDisabledState();
}

window.addEventListener('DOMContentLoaded', renderBuketDariUrl);