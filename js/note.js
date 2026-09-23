function tampilkanPesanCatatan(teks) {
    const noteCard = document.getElementById('note-card');
    const preview = document.getElementById('note-text-preview');
    const pesan = teks.trim();

    preview.textContent = pesan;
    if (!pesan) {
        noteCard.classList.add('hidden');
        preview.style.removeProperty('--note-font-size');
        return;
    }

    const jumlahKarakter = pesan.length;
    const ukuranFont = jumlahKarakter < 30 ? 13 : 11;
    preview.style.setProperty('--note-font-size', `${ukuranFont}px`);
    noteCard.classList.remove('hidden');
}

document.getElementById('input-note').addEventListener('input', function () {
    tampilkanPesanCatatan(this.value);
});