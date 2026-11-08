const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  try { tg.setHeaderColor("#101a22"); tg.setBackgroundColor("#101a22"); } catch (_) {}
}

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

const modal = document.getElementById("workout-modal");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");
let selectedWorkout = null;

document.querySelectorAll("[data-workout]").forEach(button => {
  button.addEventListener("click", () => {
    selectedWorkout = button.dataset.workout;
    const plan = plans[selectedWorkout];
    modalTitle.textContent = plan.title;
    modalContent.innerHTML = "<ul>" + plan.items.map(item => `<li>${item}</li>`).join("") + "</ul>";
    modal.hidden = false;
  });
});

document.getElementById("modal-close").addEventListener("click", () => modal.hidden = true);
modal.addEventListener("click", event => { if (event.target === modal) modal.hidden = true; });

document.getElementById("complete-workout").addEventListener("click", () => {
  const key = "sport-training-completed";
  const completed = JSON.parse(localStorage.getItem(key) || "[]");
  completed.push({ id: selectedWorkout, date: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(completed));
  document.getElementById("complete-workout").textContent = "Выполнение отмечено ✓";
  setTimeout(() => { modal.hidden = true; document.getElementById("complete-workout").textContent = "Отметить выполненной"; }, 700);
});

function validTime(value) {
  return /^\d{1,2}:\d{2}$/.test(value) && Number(value.split(":")[1]) < 60;
}
document.getElementById("save-result").addEventListener("click", () => {
  const run = document.getElementById("run-time").value.trim();
  const pull = document.getElementById("pull-count").value.trim();
  const message = document.getElementById("save-message");
  if (run && !validTime(run)) { message.textContent = "Время укажи в формате минуты:секунды, например 15:30."; return; }
  if (pull && (!Number.isInteger(Number(pull)) || Number(pull) < 0 || Number(pull) > 100)) { message.textContent = "Проверь количество подтягиваний."; return; }
  if (!run && !pull) { message.textContent = "Введи хотя бы один результат."; return; }
  const data = JSON.parse(localStorage.getItem("sport-training-results") || "[]");
  data.push({ date: new Date().toISOString(), run: run || null, pull: pull === "" ? null : Number(pull) });
  localStorage.setItem("sport-training-results", JSON.stringify(data));
  renderLatest();
  message.textContent = "Результат сохранён на этом устройстве.";
  document.getElementById("run-time").value = "";
  document.getElementById("pull-count").value = "";
});

function renderLatest() {
  const data = JSON.parse(localStorage.getItem("sport-training-results") || "[]");
  const latest = data[data.length - 1];
  if (!latest) return;
  if (latest.run) document.getElementById("run-result").textContent = latest.run;
  if (latest.pull !== null) document.getElementById("pull-result").textContent = latest.pull + " раз";
}
renderLatest();

// Простая навигация по секциям страницы.
document.querySelectorAll(".nav-item").forEach((item, index) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(nav => nav.classList.remove("active"));
    item.classList.add("active");
    const target = [".welcome", ".section:nth-of-type(2)", ".record-card"][index];
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
