(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const list = $(".todo-list");
  const textInput = $(".add-input");
  const dateInput = $(".date-wrap input[type='date']");
  const saveBtn = $(".save-btn");
  const searchInput = $(".search-row input");

  const STORAGE_KEY = "lab2.todo.items";
 
   function todayAtMidnight(){
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  }

  // --- Wyszukiwanie i podświetlanie ---
  function escapeRegExp(str){
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function getItemText(li){
    const editing = li.querySelector("input.edit-input");
    if(editing) return (editing.value || "").trim();
    const txt = li.querySelector(".todo-text");
    return (txt?.textContent || "").trim();
  }

  function clearHighlight(li){
    const txt = li.querySelector(".todo-text");
    if(!txt) return;
    // usuwamy wcześniejsze <mark>, przywracając czysty tekst
    const plain = txt.textContent || "";
    txt.innerHTML = ""; // czyść
    txt.textContent = plain;
  }

  function highlightMatches(li, query){
    const txt = li.querySelector(".todo-text");
    if(!txt) return;
    const original = txt.textContent || "";
    if(!query) { clearHighlight(li); return; }
    const re = new RegExp(`(${escapeRegExp(query)})`, "gi");
    const parts = original.split(re);
    // zbuduj bezpiecznie DOM
    txt.innerHTML = "";
    parts.forEach((part, i)=>{
      if(i % 2 === 1){
        const m = document.createElement("mark");
        m.textContent = part;
        txt.appendChild(m);
      } else {
        txt.appendChild(document.createTextNode(part));
      }
    });
  }

  function applyFilter(){
    const q = (searchInput?.value || "").trim();
    const active = q.length >= 2;
    $$(".todo-item", list).forEach(li=>{
      clearHighlight(li);
      if(!active){
        li.hidden = false;
        return;
      }
      const text = getItemText(li);
      const match = text.toLowerCase().includes(q.toLowerCase());
      li.hidden = !match;
      if(match){
        highlightMatches(li, q);
      }
    });
  }

  // --- Local Storage ---
  function readStorage(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch(e){
      return [];
    }
  }

  function writeStorage(items){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch(e){
      // ignore quota errors
    }
  }

  function collectItems(){
    return $$(".todo-item", list).map(li => {
      const text = (li.querySelector(".todo-text")?.textContent || "").trim();
      const date = li.dataset.date || null;
      return { text, date };
    });
  }

  function persist(){
    writeStorage(collectItems());
  }

  function loadFromStorage(){
    const items = readStorage();
    if(!Array.isArray(items)) return;
    items.forEach(it => {
      if(!it || typeof it.text !== "string") return;
      const text = it.text.trim();
      if(!text) return;
      const date = typeof it.date === "string" && it.date ? it.date : null;
      const li = createItem(text, date);
      list.appendChild(li);
    });
  }

  function parseDateInput(val){
    // val w formacie YYYY-MM-DD
    if(!val) return null;
    const [y,m,day] = val.split("-").map(Number);
    if(!y || !m || !day) return null;
    return new Date(y, m-1, day, 0, 0, 0, 0);
  }

  function validateInputs(){
    // Czyści poprzednie błędy
    textInput.setCustomValidity("");
    dateInput.setCustomValidity("");

    const raw = textInput.value ?? "";
    const text = raw.trim();

    if(text.length < 3){
      textInput.setCustomValidity("Wpisz co najmniej 3 znaki.");
      textInput.reportValidity();
      return { ok:false, field: textInput };
    }
    if(text.length > 255){
      textInput.setCustomValidity("Maksymalnie 255 znaków.");
      textInput.reportValidity();
      return { ok:false, field: textInput };
    }

    const val = dateInput.value;
    if(val){
      const sel = parseDateInput(val);
      const today = todayAtMidnight();
      if(!sel || sel < today){
        dateInput.setCustomValidity("Data musi być pusta albo dzisiejsza/przyszła.");
        dateInput.reportValidity();
        return { ok:false, field: dateInput };
      }
    }

    return { ok:true, text, date: val || null };
  }

  function createItem(text, dateStr){
    const li = document.createElement("li");
    li.className = "todo-item";
    if(dateStr){
      li.dataset.date = dateStr;
    }

    const check = document.createElement("span");
    check.className = "check";
    check.setAttribute("aria-hidden", "true");

    const textSpan = document.createElement("span");
    textSpan.className = "todo-text";
    textSpan.textContent = text;

    let contentEl;
    if(dateStr){
      const when = document.createElement("span");
      when.style.fontSize = "12px";
      when.style.color = "#666";
      when.style.marginLeft = "8px";
      when.textContent = `(${dateStr})`;
      const wrap = document.createElement("span");
      wrap.className = "content";
      wrap.append(textSpan, when);
      contentEl = wrap;
    } else {
      // bez daty środkowy element to sam tekst, ale oznacz go jako .content dla edycji
      textSpan.classList.add("content");
      contentEl = textSpan;
    }

    const del = document.createElement("button");
    del.className = "trash";
    del.type = "button";
    del.setAttribute("aria-label", "Usuń zadanie");
    del.textContent = "Usuń";
    del.addEventListener("click", (ev) => {
      ev.stopPropagation(); // kliknięcie w Usuń nie powinno zaczynać edycji
      li.remove();
      persist();
    });

    // Ułóż strukturę zgodną z CSS grid: 20px | 1fr | auto
    li.append(check, contentEl, del);
    return li;
  }

  function addTask(){
    const v = validateInputs();
    if(!v.ok){
      // Skup się na polu z błędem dla lepszej dostępności
      v.field?.focus?.();
      return;
    }

    // Dodaj element do listy
    const li = createItem(v.text, v.date);
    list.appendChild(li);
    // Zastosuj aktualny filtr (ukryj/oznacz dopasowania)
    applyFilter();
    // Zapisz do Local Storage
    persist();
 
    // Wyczyść pola
    textInput.value = "";
    dateInput.value = "";
    textInput.setCustomValidity("");
    dateInput.setCustomValidity("");
    textInput.focus();
  }

  // Zdarzenia
  saveBtn?.addEventListener("click", addTask);
  textInput?.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
      e.preventDefault();
      addTask();
    }
  });

  // Zdarzenie wyszukiwarki
  searchInput?.addEventListener("input", applyFilter);
  
  // Wczytaj listę z Local Storage podczas startu
  loadFromStorage();
  // zastosuj filtr na starcie (gdyby było coś w polu)
  applyFilter();

  // Opcjonalnie: usuwanie po kliknięciu Enter na przycisku
  $(".todo-list")?.addEventListener("keydown", (e)=>{
    if(e.target?.classList?.contains("trash") && (e.key === "Enter" || e.key === " ")){
      e.preventDefault();
      e.target.click();
    }
  });

  // --- Edycja pozycji listy ---
  let currentEditing = null; // <li> aktualnie edytowany

  function buildContentNode(text, dateStr){
    const textSpan = document.createElement("span");
    textSpan.className = "todo-text";
    textSpan.textContent = text;

    if(dateStr){
      const when = document.createElement("span");
      when.style.fontSize = "12px";
      when.style.color = "#666";
      when.style.marginLeft = "8px";
      when.textContent = `(${dateStr})`;
      const wrap = document.createElement("span");
      wrap.className = "content";
      wrap.append(textSpan, when);
      return wrap;
    } else {
      textSpan.classList.add("content");
      return textSpan;
    }
  }

  function startEdit(li){
    if(currentEditing && currentEditing !== li){
      // Spróbuj najpierw zapisać bieżącą edycję
      const ok = saveEdit(currentEditing);
      if(!ok) return; // jeśli walidacja nie przeszła, nie zaczynaj kolejnej edycji
    }
    if(li.dataset.editing === "1") return;

    const content = li.querySelector(".content");
    const textSpan = li.querySelector(".todo-text");
    if(!content || !textSpan) return;

    const originalText = textSpan.textContent || "";
    const originalDate = li.dataset.date || "";
    li.dataset.originalText = originalText;
    li.dataset.originalDate = originalDate;

    // wrapper edycji z polem tekstowym i datą
    const wrap = document.createElement("span");
    wrap.className = "edit-wrap";
    wrap.style.display = "grid";
    wrap.style.gridTemplateColumns = "1fr max-content";
    wrap.style.gap = "8px";
    wrap.style.alignItems = "center";
    wrap.style.width = "100%";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "edit-input";
    input.value = originalText;
    input.maxLength = 255;
    input.style.width = "100%";
    input.style.fontSize = "15px";
    input.setAttribute("aria-label", "Edytuj zadanie");

    const date = document.createElement("input");
    date.type = "date";
    date.className = "edit-date";
    date.value = originalDate;
    date.setAttribute("aria-label", "Edytuj datę");
    date.style.fontSize = "14px";

    wrap.append(input, date);

    content.replaceWith(wrap);
    li.dataset.editing = "1";
    currentEditing = li;
    setTimeout(()=>{ input.focus(); input.select(); }, 0);

    function onKey(e){
      if(e.key === "Enter"){
        e.preventDefault();
        saveEdit(li);
      } else if(e.key === "Escape"){
        e.preventDefault();
        cancelEdit(li);
      }
    }
    input.addEventListener("keydown", onKey);
    date.addEventListener("keydown", onKey);
  }

  function validateEditedFields(textInputEl, dateInputEl){
    // walidacja tekstu
    textInputEl.setCustomValidity("");
    const text = (textInputEl.value ?? "").trim();
    if(text.length < 3){
      textInputEl.setCustomValidity("Wpisz co najmniej 3 znaki.");
      textInputEl.reportValidity();
      return { ok:false, focus: textInputEl };
    }
    if(text.length > 255){
      textInputEl.setCustomValidity("Maksymalnie 255 znaków.");
      textInputEl.reportValidity();
      return { ok:false, focus: textInputEl };
    }

    // walidacja daty
    dateInputEl.setCustomValidity("");
    const val = dateInputEl.value;
    if(val){
      const sel = parseDateInput(val);
      const today = todayAtMidnight();
      if(!sel || sel < today){
        dateInputEl.setCustomValidity("Data musi być pusta albo dzisiejsza/przyszła.");
        dateInputEl.reportValidity();
        return { ok:false, focus: dateInputEl };
      }
    }

    return { ok:true, text, date: val || null };
  }

  function saveEdit(li){
    const input = li.querySelector("input.edit-input");
    const dateEl = li.querySelector("input.edit-date");
    if(!input || !dateEl) return true;

    const v = validateEditedFields(input, dateEl);
    if(!v.ok){
      v.focus?.focus?.();
      return false;
    }

    // zaktualizuj datę w atrybucie dataset
    if(v.date){
      li.dataset.date = v.date;
    } else {
      delete li.dataset.date;
    }

    const newContent = buildContentNode(v.text, v.date || null);
    // zastąp cały wrapper edycji zawartością
    const wrap = li.querySelector(".edit-wrap");
    (wrap || input).replaceWith(newContent);

    delete li.dataset.editing;
    delete li.dataset.originalText;
    delete li.dataset.originalDate;
    if(currentEditing === li) currentEditing = null;

    // po zapisaniu edycji ponownie zastosuj filtr (może zmienić widoczność i highlight)
    applyFilter();
    // Zapisz zmiany do Local Storage
    persist();
    return true;
  }

  function cancelEdit(li){
    const input = li.querySelector("input.edit-input");
    if(!input) return;
    const originalText = li.dataset.originalText || "";
    const originalDate = li.dataset.originalDate || null;
    const newContent = buildContentNode(originalText, originalDate);

    const wrap = li.querySelector(".edit-wrap");
    (wrap || input).replaceWith(newContent);

    // przywróć oryginalne dataset.date
    if(originalDate){
      li.dataset.date = originalDate;
    } else {
      delete li.dataset.date;
    }

    delete li.dataset.editing;
    delete li.dataset.originalText;
    delete li.dataset.originalDate;
    if(currentEditing === li) currentEditing = null;
    // po anulowaniu edycji też odśwież filtr
    applyFilter();
  }

  // Kliknięcie na pozycję listy -> edycja (z wyłączeniem przycisku Usuń)
  list?.addEventListener("click", (e)=>{
    const li = e.target?.closest?.(".todo-item");
    if(!li) return;
    // Ignoruj kliknięcia w przycisk usuń (już zatrzymaliśmy propagację, ale na wszelki wypadek)
    if(e.target?.classList?.contains("trash")) return;
    startEdit(li);
  });

  // Kliknięcie poza edytowaną pozycję -> zapisz
  document.addEventListener("mousedown", (e)=>{
    if(!currentEditing) return;
    if(currentEditing.contains(e.target)) return; // klik w środku
    // próbujemy zapisać
    const ok = saveEdit(currentEditing);
    if(!ok){
      // jeśli walidacja nie przeszła, przywróć fokus do inputa
      const input = currentEditing.querySelector("input.edit-input");
      input?.focus();
    }
  });
})();