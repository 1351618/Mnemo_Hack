document.addEventListener("DOMContentLoaded", () => {
  const SCRIPT_URL_KEY = "scriptUrl";

  // Загрузка данных из таблицы
  async function loadData() {
    const url = localStorage.getItem(SCRIPT_URL_KEY);
    if (!url) return null;

    const response = await fetch(url);
    const data = await response.json();
    return data;
  }

  // Сохранение ссылки
  document.getElementById("btn-save-url").addEventListener("click", () => {
    const url = document.getElementById("input-url").value.trim();
    if (url) {
      localStorage.setItem(SCRIPT_URL_KEY, url);
      loadData().then((data) => {
        console.log("Данные загружены:", data);
        renderWords(data);
      });
    }
  });

  // При открытии приложения
  loadData().then((data) => {
    if (data) {
      console.log("Данные:", data);
      renderWords(data);
    } else {
      // показать настройки
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

      // найти свободный номер в диапазоне
      const data = await loadData();
      const usedNumbers = data.map((row) => row[4]); // колонка с номером

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
        "", // интервал
        "", // дата
        document.getElementById("add-comment").value, // комент
        true, // TRUE
        document.getElementById("add-code").value, // код
        true,
        number, // номер
        true,
        document.getElementById("add-native").value, // родной
        true,
        document.getElementById("add-lang1").value, // язык 1
        true,
        document.getElementById("add-lang2").value, // язык 2
      ];

      await fetch(url, {
        method: "POST",
        body: JSON.stringify({ action: "add", data: row }),
      });

      alert("Добавлено!");
    });
});
