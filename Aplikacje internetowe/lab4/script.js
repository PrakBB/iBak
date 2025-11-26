(function(){
  // mój klucz
  const API_KEY = 'ce8bfcadcd744fe7c1ed71eb62edd3e1';
  const BASE = 'https://api.openweathermap.org/data/2.5';

  const input = document.getElementById('city');
  const btn = document.getElementById('checkWeather');
  const msg = document.getElementById('messages');
  const currentBox = document.getElementById('currentWeather');
  const forecastBox = document.getElementById('forecast');

  function setMessage(text, type = 'info') {
    msg.textContent = text || '';
    msg.className = `messages ${type}`;
  }

  function formatTemp(t){
    return `${Math.round(t)}°C`;
  }

  function iconUrl(icon){
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }

  function renderCurrent(data){
    if (!data) { currentBox.innerHTML = ''; return; }
    const { name, weather = [], main = {}, wind = {}, sys = {} } = data;
    const w = weather[0] || {};
    const sunrise = sys.sunrise ? new Date(sys.sunrise * 1000).toLocaleTimeString('pl-PL') : '';
    const sunset = sys.sunset ? new Date(sys.sunset * 1000).toLocaleTimeString('pl-PL') : '';

    currentBox.innerHTML = `
      <div class="row">
        <div class="left">
          <h3>${name ?? ''}</h3>
          <div class="temp">${formatTemp(main.temp)}</div>
          <div class="desc">${w.description ? w.description[0].toUpperCase()+w.description.slice(1) : ''}</div>
          <div class="meta">Odczuwalna: ${formatTemp(main.feels_like)} • Wilgotność: ${main.humidity ?? '-'}% • Wiatr: ${Math.round(wind.speed ?? 0)} m/s</div>
          <div class="meta">Wschód: ${sunrise} • Zachód: ${sunset}</div>
        </div>
        <div class="right">
          ${w.icon ? `<img alt="Ikona pogody" src="${iconUrl(w.icon)}">` : ''}
        </div>
      </div>`;
  }

  function renderForecast(list){
    if (!Array.isArray(list)) { forecastBox.innerHTML = ''; return; }

    // prognoza co 6 godzin
    const targetHours = ['00:00:00', '06:00:00', '12:00:00', '18:00:00'];

    // filtorwanie co 6 godzin i ograniczenie do 5 dni
    const filtered = list.filter(it => {
      if (!it.dt_txt) return false;
      const timePart = it.dt_txt.split(' ')[1];
      return targetHours.includes(timePart);
    });

    // sortowanie rosnaco po czasie
    filtered.sort((a,b) => a.dt - b.dt);

    // ograniczenie do 5 dni
    const seenDays = new Set();
    const capped = [];
    for (const it of filtered) {
      const datePart = it.dt_txt.split(' ')[0];
      if (!seenDays.has(datePart) && seenDays.size === 5) break;
      seenDays.add(datePart);
      capped.push(it);
    }

    const html = capped.map(it => {
      const w = (it.weather && it.weather[0]) || {};
      const main = it.main || {};
      const wind = it.wind || {};
      const date = new Date(it.dt * 1000);
      const title = date.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: '2-digit' });
      const time = it.dt_txt.split(' ')[1].slice(0,5); // HH:MM
      return `
        <div class="card">
          <div class="row">
            <div class="left">
              <h3>${title} • ${time}</h3>
              <div class="temp">${formatTemp(main.temp)}</div>
              <div class="desc">${w.description ? w.description : ''}</div>
              <div class="meta">Odczuwalna: ${formatTemp(main.feels_like)} • Wilgotność: ${main.humidity ?? '-'}% • Wiatr: ${Math.round(wind.speed ?? 0)} m/s</div>
            </div>
            <div class="right">
              ${w.icon ? `<img alt="Ikona pogody" src="${iconUrl(w.icon)}">` : ''}
            </div>
          </div>
        </div>`;
    }).join('');

    forecastBox.innerHTML = html;
  }

  function getCurrentWeather(city){
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pl`;
      xhr.open('GET', url);
      xhr.onload = () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const json = JSON.parse(xhr.responseText);
            console.log('XHR current response:', json);
            resolve(json);
          } else {
            const err = JSON.parse(xhr.responseText || '{}');
            reject(new Error(err.message || `Błąd XHR: ${xhr.status}`));
          }
        } catch (e) {
          reject(new Error('Nieprawidłowa odpowiedź z serwera (XHR).'));
        }
      };
      xhr.onerror = () => reject(new Error('Błąd sieci (XHR).'));
      xhr.send();
    });
  }

  async function getForecast(city){
    const url = `${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pl`;
    const res = await fetch(url);
    if (!res.ok) {
      let msg = `Błąd Fetch: ${res.status}`;
      try { const j = await res.json(); if (j && j.message) msg = j.message; } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    console.log('Fetch forecast response:', data);
    return data;
  }

  async function onClick(){
    const city = (input.value || '').trim();
    if (!city) { setMessage('Podaj nazwę miasta.', 'warn'); return; }

    setMessage('Ładowanie…', 'info');
    currentBox.innerHTML = '';
    forecastBox.innerHTML = '';

    try {
      const [current, forecast] = await Promise.all([
        getCurrentWeather(city),
        getForecast(city)
      ]);
      renderCurrent(current);
      renderForecast(forecast.list);
      setMessage('Gotowe.', 'success');
    } catch (e) {
      setMessage(e.message || 'Wystąpił nieznany błąd.', 'error');
    }
  }

  btn?.addEventListener('click', onClick);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') onClick();
  });
})();