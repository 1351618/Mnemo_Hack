document.addEventListener("DOMContentLoaded", () => {
  const SCRIPT_URL_KEY = "scriptUrl";
  let allWords = [];
  let sessionWords = [];
  let currentIndex = 0;
  let changedWords = [];
  let touchStartX = 0;

  async function loadData() {
    const url = localStorage.getItem(SCRIPT_URL_KEY);
    if (!url) return null;
    document.getElementById("loader").style.display = "block";
    const response = await fetch(url);
    const result = await response.json();
    document.getElementById("loader").style.display = "none";
    return result;
  }

  document.getElementById("btn-save-url").addEventListener("click", () => {
    const url = document.getElementById("input-url").value.trim();
    if (url) {
      localStorage.setItem(SCRIPT_URL_KEY, url);
      loadData().then((result) => {
        console.log("Данные загружены:", result);
        renderWords(result.data);
        applySettings(result.settings);
      });
    }
  });

  loadData().then((result) => {
    if (result) {
      allWords = result.data;
      renderWords(result.data);
      applySettings(result.settings);
      renderStats();
    }
  });

  function renderWords(data) {
    const block = document.getElementById("words-list");
    block.innerHTML = "";

    data.forEach((row) => {
      const div = document.createElement("div");
      div.className = "word-row";

      // Используем шаблонную строку для создания структуры
      div.innerHTML = `
      <span>${row[6] || ""}</span>
      <span>${row[8] || ""}</span>
      <span>${row[10] || ""}</span>
      <span>${row[12] || ""}</span>
    `;

      div.onclick = () => showWordDetail(row);
      block.appendChild(div);
    });
  }

  function showWordDetail(row) {
    hideAll(); // Скрываем остальные блоки
    const detailBlock = document.getElementById("block-word-detail");
    detailBlock.style.display = "flex"; // Используем flex для центрирования/расположения

    const content = detailBlock.querySelector("#detail-content");
    content.innerHTML = `
    <div class="detail-item"><strong>Номер:</strong> ${row[6]}</div>
    <div class="detail-item"><strong>Слово:</strong> ${row[8]}</div>
    <div class="detail-item"><strong>Язык 1:</strong> ${row[10]}</div>
    <div class="detail-item"><strong>Язык 2:</strong> ${row[12]}</div>
    <div class="detail-item"><strong>Комментарий:</strong> ${row[2]}</div>
  `;
  }

  function applySettings(settings) {
    settings.forEach((row) => {
      if (row[0] === "lang-native")
        document.getElementById("lang-native").value = row[1];
      if (row[0] === "lang-1") document.getElementById("lang-1").value = row[1];
      if (row[0] === "lang-2") document.getElementById("lang-2").value = row[1];
    });
  }

  // --------------------------------
  // настройки отображения карточек
  // Настройки по умолчанию если данных нет
  const defaultParams = {
    rangeMin: 0,
    rangeMax: "",
    order: "order",
    showNum: false,
    showCode: false,
    showLang0: false,
    showLang1: false,
    showLang2: false,
    showComment: false,
    knownNum: false,
    knownCode: false,
    knownLang0: false,
    knownLang1: false,
    knownLang2: false,
  };

  function saveParams(params) {
    localStorage.setItem("params", JSON.stringify(params));
    // console.log("params:", params);
  }

  function loadParams() {
    const saved = localStorage.getItem("params");
    return saved ? JSON.parse(saved) : defaultParams;
  }

  function applyParams(params) {
    document.querySelectorAll("#parameters input[type=number]")[0].value =
      params.rangeMin;
    document.querySelectorAll("#parameters input[type=number]")[1].value =
      params.rangeMax;
    document.querySelectorAll("input[name=order]")[0].checked =
      params.order === "order";
    document.querySelectorAll("input[name=order]")[1].checked =
      params.order === "random";
    document.querySelectorAll("#parameters input[type=checkbox]")[0].checked =
      params.showNum;
    document.querySelectorAll("#parameters input[type=checkbox]")[1].checked =
      params.showCode;
    document.querySelectorAll("#parameters input[type=checkbox]")[2].checked =
      params.showLang0;
    document.querySelectorAll("#parameters input[type=checkbox]")[3].checked =
      params.showLang1;
    document.querySelectorAll("#parameters input[type=checkbox]")[4].checked =
      params.showLang2;
    document.querySelectorAll("#parameters input[type=checkbox]")[5].checked =
      params.showComment;
  }

  function getParams() {
    const nums = document.querySelectorAll("#parameters input[type=number]");
    const checks = document.querySelectorAll(
      "#parameters input[type=checkbox]",
    );
    const order = document.querySelector("input[name=order]:checked");
    return {
      rangeMin: nums[0].value,
      rangeMax: nums[1].value,
      order: order ? order.value : "order",
      showNum: checks[0].checked,
      showCode: checks[1].checked,
      showLang0: checks[2].checked,
      showLang1: checks[3].checked,
      showLang2: checks[4].checked,
      showComment: checks[5].checked,
    };
  }

  // Инициализация
  const params = loadParams();
  applyParams(params);
  saveParams(params);

  // Слушаем изменения
  document.getElementById("parameters").addEventListener("change", () => {
    const params = getParams();
    saveParams(params);
  });

  // --------------------------------
  // временный список слов для карточек
  function buildSession() {
    const params = loadParams();
    const min = Number(params.rangeMin) || 0;
    const max = Number(params.rangeMax) || Infinity;

    sessionWords = allWords
      .filter((row) => {
        const num = Number(String(row[6]).replace(" ", ""));
        return num >= min && num <= max && row[8] !== "";
      })
      .map((row) => ({
        number: { value: row[6], show: params.showNum, known: row[5] },
        code: { value: row[4], show: params.showCode, known: row[3] },
        lang0: { value: row[8], show: params.showLang0, known: row[7] },
        lang1: { value: row[10], show: params.showLang1, known: row[9] },
        lang2: { value: row[12], show: params.showLang2, known: row[11] },
        comment: { value: row[2], show: params.showComment },
        learned: false,
      }));

    if (params.order === "random") {
      sessionWords = sessionWords.sort(() => Math.random() - 0.5);
    }

    // console.log("сессия:", sessionWords);
  }

  // --------------------------------
  // отображение карточек

  function showCard() {
    const word = sessionWords[currentIndex];
    if (!word) return;

    document.getElementById("card-number").textContent = word.number.value;
    document.getElementById("card-code").textContent = word.code.value;
    document.getElementById("card-ru").textContent = word.lang0.value;
    document.getElementById("card-en").textContent = word.lang1.value;
    document.getElementById("card-gr").textContent = word.lang2.value;
    document.getElementById("card-comment").textContent = word.comment.value;
    document.getElementById("card-learned").textContent = word.learned
      ? "знаю"
      : "не знаю";

    document
      .getElementById("card-number")
      .classList.toggle("known", word.number.known);
    document
      .getElementById("card-code")
      .classList.toggle("known", word.code.known);
    document
      .getElementById("card-ru")
      .classList.toggle("known", word.lang0.known);
    document
      .getElementById("card-en")
      .classList.toggle("known", word.lang1.known);
    document
      .getElementById("card-gr")
      .classList.toggle("known", word.lang2.known);

    document
      .getElementById("card-number")
      .classList.toggle("hidden", !word.number.show);
    document
      .getElementById("card-code")
      .classList.toggle("hidden", !word.code.show);
    document
      .getElementById("card-ru")
      .classList.toggle("hidden", !word.lang0.show);
    document
      .getElementById("card-en")
      .classList.toggle("hidden", !word.lang1.show);
    document
      .getElementById("card-gr")
      .classList.toggle("hidden", !word.lang2.show);
    document
      .getElementById("card-comment")
      .classList.toggle("hidden", !word.comment.show);
  }

  // --------------------------------
  //  листание карточек

  document.getElementById("card").addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  });

  document.getElementById("card").addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) {
      if (currentIndex < sessionWords.length - 1) currentIndex++;
      showCard();
    } else if (diff < -50) {
      if (currentIndex > 0) currentIndex--;
      showCard();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      if (currentIndex < sessionWords.length - 1) currentIndex++;
      showCard();
    } else if (e.key === "ArrowLeft") {
      if (currentIndex > 0) currentIndex--;
      showCard();
    }
  });

  // --------------------------------
  //  знаю не знаю

  document.getElementById("card-learned").addEventListener("click", (e) => {
    e.stopPropagation();
    if (!sessionWords[currentIndex]) return;
    const word = sessionWords[currentIndex];
    word.learned = !word.learned;
    e.target.textContent = word.learned ? "знаю" : "не знаю";
  });

  // --------------------------------
  //  скрыть показать элемент
  document.querySelectorAll(".card-item").forEach((el) => {
    let pressTimer = null;

    const startPress = (e) => {
      e.stopPropagation();
      pressTimer = setTimeout(() => {
        pressTimer = null;
        const word = sessionWords[currentIndex];
        if (!word) return;
        if (el.id === "card-number") word.number.known = !word.number.known;
        if (el.id === "card-code") word.code.known = !word.code.known;
        if (el.id === "card-ru") word.lang0.known = !word.lang0.known;
        if (el.id === "card-en") word.lang1.known = !word.lang1.known;
        if (el.id === "card-gr") word.lang2.known = !word.lang2.known;
        el.classList.toggle("known");
        if (!changedWords.includes(word)) changedWords.push(word);
      }, 300);
    };

    const endPress = (e) => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
        e.stopPropagation();
        const word = sessionWords[currentIndex];
        if (!word) return;
        if (el.id === "card-number") word.number.show = !word.number.show;
        if (el.id === "card-code") word.code.show = !word.code.show;
        if (el.id === "card-ru") word.lang0.show = !word.lang0.show;
        if (el.id === "card-en") word.lang1.show = !word.lang1.show;
        if (el.id === "card-gr") word.lang2.show = !word.lang2.show;
        if (el.id === "card-comment") word.comment.show = !word.comment.show;
        el.classList.toggle("hidden");
      }
    };

    el.addEventListener("mousedown", startPress);
    el.addEventListener("mouseup", endPress);
    el.addEventListener("touchstart", startPress);
    el.addEventListener("touchend", endPress);
  });
  // --------------------------------

  document
    .getElementById("btn-save-langs")
    .addEventListener("click", async () => {
      const url = localStorage.getItem(SCRIPT_URL_KEY);
      if (!url) return alert("Нет ссылки на таблицу");
      await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          action: "save-settings",
          "lang-native": document.getElementById("lang-native").value,
          "lang-1": document.getElementById("lang-1").value,
          "lang-2": document.getElementById("lang-2").value,
        }),
      });
      alert("Сохранено!");
    });

  const groups = [
    { label: "80%", min: 0, max: 999 },
    { label: "Глаг.", min: 1000, max: 3999 },
    { label: "Сущ.", min: 4000, max: 9999 },
  ];

  document
    .getElementById("btn-add-word")
    .addEventListener("click", async () => {
      console.log("кнопка нажата");
      const url = localStorage.getItem(SCRIPT_URL_KEY);
      if (!url) return alert("Нет ссылки на таблицу");

      const group = document.getElementById("add-group").value;
      const groupObj = groups.find((g) => g.label === group);
      const [min, max] = [groupObj.min, groupObj.max];

      const result = await loadData();
      const usedNumbers = result.data.map((row) => row[4]);

      let number = null;
      for (let i = min; i <= max; i++) {
        const code = String(i).padStart(4, "0");
        const formatted = code.slice(0, 1) + " " + code.slice(1);
        if (!usedNumbers.includes(formatted)) {
          number = formatted;
          break;
        }
      }

      if (!number) return alert("Нет свободных номеров в этой группе");

      document.getElementById("add-number").value = number;

      const row = [
        "",
        "",
        document.getElementById("add-comment").value,
        true,
        document.getElementById("add-code").value,
        true,
        number,
        true,
        document.getElementById("add-native").value,
        true,
        document.getElementById("add-lang1").value,
        true,
        document.getElementById("add-lang2").value,
      ];

      await fetch(url, {
        method: "POST",
        body: JSON.stringify({ action: "add", data: row }),
      });

      alert("Добавлено!");
    });

  // -----------------------
  // статистика;

  function renderStats() {
    document.getElementById("total").textContent = allWords.filter(
      (r) => r[8] !== "",
    ).length;

    const chart = document.getElementById("chart");
    chart.innerHTML = "";

    const LAYER_H = 6;
    const layers = [
      { key: "word", col: 7, color: "#e47575" },
      { key: "eng", col: 9, color: "#9D4EDD" },
      { key: "gre", col: 11, color: "#22c88f" },
    ];

    groups.forEach((group) => {
      const groupWords = allWords.filter((r) => {
        const num = Number(String(r[6]).replace(" ", ""));
        return num >= group.min && num <= group.max && r[8] !== "";
      });

      const total = groupWords.length;
      if (total === 0) return;

      const bar = document.createElement("div");
      bar.className = "row";

      const label = document.createElement("span");
      label.className = "row-label";
      label.textContent = group.label;

      const track = document.createElement("div");
      track.className = "track";

      layers.forEach((layer, i) => {
        const fill = document.createElement("div");
        fill.className = "fill";
        fill.style.top = i * LAYER_H + "px";
        fill.style.width =
          Math.round(
            (groupWords.filter((r) => r[layer.col] === true).length / total) *
              100,
          ) + "%";
        fill.style.background = layer.color;
        track.appendChild(fill);
      });

      bar.appendChild(label);
      bar.appendChild(track);
      chart.appendChild(bar);
      console.log("groups:", groups);
      console.log("allWords:", allWords.length);
    });
  }

  // -----------------------
  // отображение блоков
  const menuBtn = document.getElementById("btn-menu");

  function hideAll() {
    document
      .querySelectorAll("div[id^='block-']")
      .forEach((b) => (b.style.display = "none"));
  }

  function showMenu() {
    hideAll();
    document.getElementById("block-menu").style.display = "flex";
    menuBtn.style.display = "none";
  }

  function showScreen(id) {
    hideAll();
    document.getElementById(id).style.display = "block";
    menuBtn.style.display = "block";
  }

  // кнопки
  document.getElementById("btn-start").onclick = () => {
    buildSession();
    showCard();
    showScreen("block-learn");
  };
  document.getElementById("btn-words").onclick = () =>
    showScreen("block-words");
  document.getElementById("btn-back-words").onclick = () =>
    showScreen("block-words");
  // document.getElementById("block-word-detail").onclick = () =>
  //   showScreen("block-order");
  document.getElementById("btn-settings").onclick = () =>
    showScreen("block-settings");
  document.getElementById("btn-add").onclick = () => showScreen("block-add");

  // кнопка назад в меню
  menuBtn.onclick = async () => {
    const wasLearning =
      document.getElementById("block-learn").style.display !== "none";
    if (wasLearning) {
      await syncToAllWords();
      renderStats();
      changedWords = [];
    }
    showMenu();
  };
  // -----------------------
  // обновляем основной массив данных
  async function syncToAllWords() {
    changedWords.forEach((word) => {
      const row = allWords.find((r) => r[6] === word.number.value);
      if (!row) return;
      row[5] = word.number.known;
      row[3] = word.code.known;
      row[7] = word.lang0.known;
      row[9] = word.lang1.known;
      row[11] = word.lang2.known;
    });

    const url = localStorage.getItem(SCRIPT_URL_KEY);
    if (!url) return;

    await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        action: "update-known",
        data: changedWords.map((word) => ({
          number: word.number.value,
          knownNum: word.number.known,
          knownCode: word.code.known,
          knownLang0: word.lang0.known,
          knownLang1: word.lang1.known,
          knownLang2: word.lang2.known,
        })),
      }),
    });
  }

  // -------------------------
  // копирование кода
  document
    .getElementById("btn-copy-script")
    .addEventListener("click", async () => {
      const response = await fetch("./script.gs");
      const code = await response.text();
      navigator.clipboard.writeText(code);
      alert("Скопировано!");
    });
  // --------------------------
  // копирование шаблона
  document.getElementById("btn-copy-template").addEventListener("click", () => {
    const text = document.getElementById("template-data").textContent;
    navigator.clipboard.writeText(text);
    alert("Скопировано!");
  });
});
