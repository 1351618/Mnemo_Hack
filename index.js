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
      document.getElementById("block-settings").style.display = "block";
    }
  });

  function renderWords(data) {
    const block = document.getElementById("block-words");
    block.innerHTML = "";
    data.forEach((row) => {
      const div = document.createElement("div");
      div.textContent = `${row[0]} | ${row[2]} | ${row[4]} | ${row[6]} | ${row[8]} | ${row[10]}`;
      block.appendChild(div);
    });
  }

  function applySettings(settings) {
    settings.forEach((row) => {
      if (row[0] === "lang-native")
        document.getElementById("lang-native").value = row[1];
      if (row[0] === "lang-1") document.getElementById("lang-1").value = row[1];
      if (row[0] === "lang-2") document.getElementById("lang-2").value = row[1];
    });
  }

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
});
