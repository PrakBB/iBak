(function(){
  const boardEl = document.getElementById('board');
  const trayEl = document.getElementById('tray');
  const statusEl = document.getElementById('status');
  const coordsEl = document.getElementById('coords');
  const locateBtn = document.getElementById('locateBtn');
  const exportBtn = document.getElementById('exportBtn');

  //Utwórz siatkę 4x4
  const size = 4;
  const totalPieces = size * size;
  const cells = [];
  for (let i = 0; i < totalPieces; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = String(i);
    addDnDTarget(cell);
    boardEl.appendChild(cell);
    cells.push(cell);
  }

  //Leaflet – mapa
  //Domyślne położenie: Szczecin
  const map = L.map('map', { zoomControl: true }).setView([53.4289, 14.5530], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    crossOrigin: true
  }).addTo(map);

  let myMarker = null;

  locateBtn.addEventListener('click', async () => {
    requestNotificationsIfNeeded();

    if (!('geolocation' in navigator)) {
      setStatus('Geolokalizacja nie jest wspierana przez tę przeglądarkę.');
      return;
    }


    locateBtn.disabled = true;
    setStatus('Pobieram lokalizację...');
    coordsEl.textContent = '—';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        coordsEl.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        if (myMarker) {
          myMarker.setLatLng([latitude, longitude]);
        } else {
          myMarker = L.marker([latitude, longitude]).addTo(map);
        }
        map.setView([latitude, longitude], 15, { animate: true });
        setStatus('Zlokalizowano Twoje położenie.');
        locateBtn.disabled = false;
      },
      (err) => {
        console.error(err);
        setStatus(formatGeoError(err));
        locateBtn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });


  function formatGeoError(err) {
    if (!err) return 'Nie udało się pobrać lokalizacji (nieznany błąd).';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'Odmówiono dostępu do lokalizacji. Sprawdź uprawnienia przeglądarki. Na macOS: Ustawienia systemowe > Prywatność i bezpieczeństwo > Usługi lokalizacji.';
      case err.POSITION_UNAVAILABLE:
        return 'Pozycja jest niedostępna. Upewnij się, że usługi lokalizacji są włączone i spróbuj ponownie.';
      case err.TIMEOUT:
        return 'Przekroczono czas oczekiwania na lokalizację. Spróbuj ponownie (najlepiej na zewnątrz lub z włączonym Wi‑Fi).';
      default:
        return 'Nie udało się pobrać lokalizacji: ' + err.message;
    }
  }

  //Eksport mapy i przygotowanie puzzli
  exportBtn.addEventListener('click', async () => {
    try {
      exportBtn.disabled = true;
      setStatus('Renderowanie mapy...');
      const dataUrl = await renderMapToDataURL(map);

      //Zapis PNG
      try {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'mapa.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (_) { /* pomiń w razie braku wsparcia */ }

      setStatus('Tworzenie elementów układanki...');
      createPuzzleFromImage(dataUrl);
      setStatus('Elementy zostały utworzone i wymieszane. Przeciągnij je na planszę.');
    } catch (e) {
      console.error(e);
      setStatus('Błąd podczas tworzenia układanki: ' + e.message);
    } finally {
      exportBtn.disabled = false;
    }
  });

  // Notification API
  function requestNotificationsIfNeeded() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  function notifyCompleted() {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Gratulacje!', {
          body: 'Ułożyłeś wszystkie elementy mapy!'
        });
      } else {
        alert('Gratulacje! Ułożyłeś wszystkie elementy mapy!');
      }
    } catch (_) {
      alert('Gratulacje! Ułożyłeś wszystkie elementy mapy!');
    }
  }

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  //Render Leaflet mapy do dataURL (raster) – leaflet-image
  function renderMapToDataURL(map) {
    return new Promise((resolve, reject) => {
      if (typeof window.leafletImage !== 'function') {
        reject(new Error('leaflet-image nie jest dostępny.'));
        return;
      }
      window.leafletImage(map, function(err, canvas) {
        if (err) return reject(err);
        try {
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // Podziel obraz (dataURL) na 16 części i przygotuj drag & drop
  function createPuzzleFromImage(dataUrl) {
    // Reset stanu: usuń poprzednie elementy
    trayEl.innerHTML = '';
    cells.forEach(c => c.innerHTML = '');

    const img = new Image();
    img.onload = () => {
      // Ustal wymiary wycinków
      const pieceW = Math.floor(img.width / size);
      const pieceH = Math.floor(img.height / size);

      // Utwórz tablicę fragmentów z poprawnym indeksem
      const pieces = [];
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const index = row * size + col; // poprawne miejsce
          const piece = document.createElement('div');
          piece.className = 'piece';
          piece.draggable = true;
          piece.dataset.index = String(index);
          // ustaw tło tak, by odpowiadało fragmentowi (background-position)
          const posX = (col * 100) / (size - 1);
          const posY = (row * 100) / (size - 1);
          piece.style.backgroundImage = `url(${dataUrl})`;
          piece.style.backgroundSize = `${size * 100}% ${size * 100}%`;
          piece.style.backgroundPosition = `${posX}% ${posY}%`;

          addDnDSource(piece);
          pieces.push(piece);
        }
      }

      // Wymieszaj
      shuffleArray(pieces);
      for (const p of pieces) trayEl.appendChild(p);

      setStatus('Przeciągnij elementy na właściwe miejsca.');
    };
    img.onerror = () => setStatus('Nie udało się wczytać obrazu mapy.');
    img.src = dataUrl;
  }

  // Drag & Drop
  function addDnDSource(el) {
    el.addEventListener('dragstart', (ev) => {
      ev.dataTransfer.setData('text/plain', el.dataset.index);
      // Dla WebKit warto ustawić obraz przeciągania
      if (ev.dataTransfer.setDragImage) {
        const ghost = el.cloneNode(true);
        ghost.style.position = 'absolute';
        ghost.style.top = '-9999px';
        document.body.appendChild(ghost);
        ev.dataTransfer.setDragImage(ghost, 10, 10);
        setTimeout(() => document.body.removeChild(ghost), 0);
      }
    });
  }

  function addDnDTarget(cell) {
    cell.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      cell.classList.add('dragover');
    });
    cell.addEventListener('dragleave', () => cell.classList.remove('dragover'));
    cell.addEventListener('drop', (ev) => {
      ev.preventDefault();
      cell.classList.remove('dragover');
      const pieceIndex = ev.dataTransfer.getData('text/plain');
      if (!pieceIndex) return;

      // Jeśli komórka już ma element, przenieś go z powrotem na tacę
      if (cell.firstChild) {
        trayEl.appendChild(cell.firstChild);
      }

      // Znajdź element w tacy (lub na planszy)
      const piece = findPieceByIndex(pieceIndex);
      if (!piece) return;

      cell.appendChild(piece);

      // Sprawdź poprawność
      const correctIndex = cell.dataset.index;
      const isCorrect = piece.dataset.index === correctIndex;
      piece.classList.toggle('correct', isCorrect);

      checkIfCompleted();
    });
  }

  // Umożliw upuszczanie elementów z powrotem na tacę
  addTrayDropTarget(trayEl);
  function addTrayDropTarget(tray) {
    tray.addEventListener('dragover', (ev) => {
      ev.preventDefault();
    });
    tray.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const pieceIndex = ev.dataTransfer.getData('text/plain');
      if (!pieceIndex) return;
      const piece = findPieceByIndex(pieceIndex);
      if (!piece) return;
      piece.classList.remove('correct');
      tray.appendChild(piece);
    });
  }

  function findPieceByIndex(index) {
    // Spróbuj znaleźć w tacy
    let el = trayEl.querySelector(`.piece[data-index="${CSS.escape(index)}"]`);
    if (el) return el;
    // lub na planszy
    el = boardEl.querySelector(`.piece[data-index="${CSS.escape(index)}"]`);
    return el;
  }

  function checkIfCompleted() {
    // Wszystkie komórki muszą zawierać element i każdy musi być na swoim miejscu
    for (const cell of cells) {
      const piece = cell.firstElementChild;
      if (!piece) return; // jeszcze nie komplet
      if (piece.dataset.index !== cell.dataset.index) return; // błędne ułożenie
    }
    setStatus('Brawo! Układanka ukończona.');
    notifyCompleted();
  }

  // Utils
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
})();
