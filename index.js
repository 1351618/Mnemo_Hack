document.addEventListener("DOMContentLoaded", () => {
  const SCRIPT_URL_KEY = "scriptUrl";

  async function loadData() {
    const url = localStorage.getItem(SCRIPT_URL_KEY);
    if (!url) return null;
    const response = await fetch(url);
    const result = await response.json();
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
      console.log("Данные:", result);
      renderWords(result.data);
      applySettings(result.settings);
    } else {
      // document.getElementById("block-settings").style.display = "block";
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

  // Обработчик кнопки "Назад" (выполнить один раз при загрузке)
  document.getElementById("btn-back-words").onclick = () => {
    hideAll();
    document.getElementById("block-words").style.display = "block";
  };

  function applySettings(settings) {
    settings.forEach((row) => {
      if (row[0] === "lang-native")
        document.getElementById("lang-native").value = row[1];
      if (row[0] === "lang-1") document.getElementById("lang-1").value = row[1];
      if (row[0] === "lang-2") document.getElementById("lang-2").value = row[1];
    });
  }

  // --------------------------------
  // слова поиск

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

  const GROUPS = {
    "80%": [0, 999],
    глаг: [1000, 3999],
    сущ: [4000, 7999],
    прилаг: [8000, 8999],
    наречия: [9000, 9999],
  };

  document
    .getElementById("btn-add-word")
    .addEventListener("click", async () => {
      console.log("кнопка нажата");
      const url = localStorage.getItem(SCRIPT_URL_KEY);
      if (!url) return alert("Нет ссылки на таблицу");

      const group = document.getElementById("add-group").value;
      const [min, max] = GROUPS[group];

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
  // статистика
  const totalWords = 1500;

  const data = [
    { label: "80%", word: 10, eng: 40, gre: 10 },
    { label: "Сущ.", word: 20, eng: 50, gre: 20 },
    { label: "Глаг.", word: 30, eng: 60, gre: 30 },
    { label: "Нар.", word: 40, eng: 70, gre: 56 },
    { label: "Прил.", word: 50, eng: 80, gre: 82 },
  ];

  const layers = [
    { key: "word", color: "#e47575" }, // светлый
    { key: "eng", color: "#9D4EDD" }, // средний
    { key: "gre", color: "#22c88f" }, // тёмный
  ];

  // const TRACK_H = 18;
  const LAYER_H = 10;

  document.getElementById("total").textContent = totalWords;

  const chart = document.getElementById("chart");

  data.forEach((row) => {
    const bar = document.createElement("div");
    bar.className = "row";

    const label = document.createElement("span");
    label.className = "row-label";
    label.textContent = row.label;

    const track = document.createElement("div");
    track.className = "track";

    layers.forEach((layer, i) => {
      const fill = document.createElement("div");
      fill.className = "fill";
      fill.style.top = i * LAYER_H + "px";
      fill.style.width = row[layer.key] + "%";
      fill.style.background = layer.color;
      track.appendChild(fill);
    });

    const nums = document.createElement("span");
    nums.className = "row-nums";
    nums.textContent = `${row.word}·${row.eng}·${row.gre}`;

    bar.appendChild(label);
    bar.appendChild(track);
    // bar.appendChild(nums);
    chart.appendChild(bar);
  });

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
  document.getElementById("btn-start").onclick = () =>
    showScreen("block-learn");
  document.getElementById("btn-words").onclick = () =>
    showScreen("block-words");
  document.getElementById("block-word-detail").onclick = () =>
    showScreen("block-order");
  document.getElementById("btn-settings").onclick = () =>
    showScreen("block-settings");
  document.getElementById("btn-add").onclick = () => showScreen("block-add");

  // кнопка назад в меню
  menuBtn.onclick = showMenu;
  // -----------------------
});
