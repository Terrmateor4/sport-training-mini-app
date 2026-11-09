
const API_URL = "https://sport-training-api.onrender.com";

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  try {
    tg.setHeaderColor("#101a22");
    tg.setBackgroundColor("#101a22");
  } catch (_) {}
}

// -----------------------------
// Подключение к серверу
// -----------------------------

async function apiRequest(path, options = {}) {
  if (!tg?.initData) {
    throw new Error("Открой приложение через Telegram.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": tg.initData,
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Ошибка сервера.");
  }

  return data;
}

// -----------------------------
// Планы тренировок
// -----------------------------

const plans = {
  monday: {
    title: "Понедельник — бег и техника",
    items: [
      "Разминка: 5–10 минут ходьбы и лёгких движений.",
      "Основная часть: спокойный бег или чередование ходьбы и бега по самочувствию.",
      "Техника: несколько коротких расслабленных ускорений только при хорошем самочувствии.",
      "Заминка: спокойная ходьба и лёгкая подвижность."
    ]
  },

  wednesday: {
    title: "Среда — силовая подготовка",
    items: [
      "Разминка плеч, рук и корпуса.",
      "Подтягивания с подходящим уровнем помощи или облегчённым вариантом; не работай до отказа.",
      "Лёгкие упражнения на корпус и мышцы спины.",
      "Заминка и восстановление."
    ]
  },

  saturday: {
    title: "Суббота — выносливость",
    items: [
      "Разминка: ходьба и лёгкая суставная гимнастика.",
      "Спокойная непрерывная активность или интервалы ходьбы и бега.",
      "Сохраняй темп, при котором можешь говорить короткими фразами.",
      "Заминка: ходьба и отдых."
    ]
  }
};

// -----------------------------
// Окно тренировок
// -----------------------------

const modal = document.getElementById("workout-modal");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");

let selectedWorkout = null;

document.querySelectorAll("[data-workout]").forEach(button => {
  button.addEventListener("click", () => {
    selectedWorkout = button.dataset.workout;

    const plan = plans[selectedWorkout];

    if (!plan) return;

    modalTitle.textContent = plan.title;

    modalContent.innerHTML =
      "<ul>" +
      plan.items.map(item => `<li>${item}</li>`).join("") +
      "</ul>";

    modal.hidden = false;
  });
});

document.getElementById("modal-close").addEventListener("click", () => {
  modal.hidden = true;
});

modal.addEventListener("click", event => {
  if (event.target === modal) {
    modal.hidden = true;
  }
});

// -----------------------------
// Отметка выполненной тренировки
// -----------------------------

document.getElementById("complete-workout").addEventListener("click", () => {
  if (!selectedWorkout) return;

  const key = "sport-training-completed";

  const completed = JSON.parse(
    localStorage.getItem(key) || "[]"
  );

  completed.push({
    id: selectedWorkout,
    date: new Date().toISOString()
  });

  localStorage.setItem(key, JSON.stringify(completed));

  const button = document.getElementById("complete-workout");

  button.textContent = "Выполнение отмечено ✓";

  setTimeout(() => {
    modal.hidden = true;
    button.textContent = "Отметить выполненной";
  }, 700);
});

// -----------------------------
// Проверка времени
// -----------------------------

function validTime(value) {
  if (!/^\d{1,2}:\d{2}$/.test(value)) {
    return false;
  }

  const [minutes, seconds] = value.split(":").map(Number);

  return minutes >= 0 && seconds >= 0 && seconds < 60;
}

// -----------------------------
// Сохранение результатов
// -----------------------------

document.getElementById("save-result").addEventListener("click", async () => {
  const run = document.getElementById("run-time").value.trim();
  const pull = document.getElementById("pull-count").value.trim();

  const message = document.getElementById("save-message");
  const button = document.getElementById("save-result");

  if (run && !validTime(run)) {
    message.textContent =
      "Время укажи в формате минуты:секунды, например 15:30.";
    return;
  }

  if (
    pull &&
    (!Number.isInteger(Number(pull)) ||
      Number(pull) < 0 ||
      Number(pull) > 100)
  ) {
    message.textContent = "Проверь количество подтягиваний.";
    return;
  }

  if (!run && !pull) {
    message.textContent = "Введи хотя бы один результат.";
    return;
  }

  button.disabled = true;
  message.textContent = "Сохраняем результат...";

  try {
    if (run) {
      await apiRequest("/api/results", {
        method: "POST",
        body: JSON.stringify({
          exercise: "run",
          result: run
        })
      });
    }

    if (pull !== "") {
      await apiRequest("/api/results", {
        method: "POST",
        body: JSON.stringify({
          exercise: "pullups",
          result: Number(pull)
        })
      });
    }

    await loadResults();

    message.textContent = "Результат успешно сохранён на сервере! ✓";

    document.getElementById("run-time").value = "";
    document.getElementById("pull-count").value = "";

  } catch (error) {
    message.textContent = "Не удалось сохранить: " + error.message;
  } finally {
    button.disabled = false;
  }
});

// -----------------------------
// Загрузка истории результатов
// -----------------------------

async function loadResults() {
  try {
    const data = await apiRequest("/api/results");

    const results = data.results || [];

    const latestRun = results.find(item => item.exercise === "run");
    const latestPull = results.find(item => item.exercise === "pullups");

    if (latestRun) {
      document.getElementById("run-result").textContent =
        latestRun.result;
    }

    if (latestPull) {
      document.getElementById("pull-result").textContent =
        latestPull.result + " раз";
    }

  } catch (error) {
    console.error("Ошибка загрузки результатов:", error);
  }
}

// Загружаем результаты при запуске приложения
loadResults();

// -----------------------------
// Навигация по разделам
// -----------------------------

document.querySelectorAll(".nav-item").forEach((item, index) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(nav => {
      nav.classList.remove("active");
    });

    item.classList.add("active");

    const target = [
      ".welcome",
      ".section:nth-of-type(2)",
      ".record-card"
    ][index];

    document.querySelector(target)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});
