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
    });
  }
});

// При открытии приложения
loadData().then((data) => {
  if (data) {
    console.log("Данные:", data);
  } else {
    // показать настройки
    document.getElementById("block-settings").style.display = "block";
  }
});
