const STORAGE_KEY = "habitTrackerData"

let habits = loadHabits();
let calendarHabitId = null;
let calendarData = new Date();

const addForm = document.getElementById("addForm");
const habitInput = document.getElementById("habitInput");
const habitList = document.getElementById("habitList");
const emptyMsg = document.getElementById("emptyMsg");
const overallFill =document.getElementById("overallFill");
const overallPercent = document.getElementById("overallPercent");

const calendarModal = document.getElementById("calendarModal");
const calendarGrid = document.getElementById("calendarGrid");
const calendarTitle = document.getElementById("calendarTitle");
const calendarHabitName = document.getElementById("calendarHabitName");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMothBtn = document.getElementById("nextMonth");
const closeModalBtn = document.getElementById("closeModal");

function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function todayKey () {
    return toDateKey(new Date());
}

function loadHabits() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveHabits() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function calcStreak(habit) {
    let streak = 0;
    let cursor = new Date();

    if (!habit.dates[todayKey()]) {
        cursor.setDate(cursor.getDate() - 1);
    }

    while (habit.dates[toDateKey(cursor)]) {
        streak++;
        cursor.setDate(cursor.getDate() -1);
    }

    return streak;
}

function renderHabits() {
    habitList.innerHTML = "";
    emptyMsg.classList.toggle("hidden", habits.length > 0);
    habits.forEach(habit => {
        const done = !!habit.dates[todayKey()];
        const streak = calcStreak(habit);

        const card = document.createElement("div");
        card.className = "habit-card";

        const check = document.createElement("button");
        check.className = "habit-check" + (done ? " done" : ""); 
        check.textContent = done ? "✓" : "";
        check.addEventListener("click", () => toggleToday(habit.id));

        const info = document.createElement("div");
        info.className = "habit-info";
        info.innerHTML = `<div class="habit-name">${escapeHtml(habit.name)}</div>
            <div class="habit-streak">🔥 ${streak} day in a row &nbsp:&nbsp; 🗓️ View Calendar</div>`;
        info.addEventListener("click", () => openCalendar(habit.id));

        const del = document.createElement("button");
        del.className = "habit-delete";
        del.textContent = "x";
        del.addEventListener("click", () => deleteHabit(habit.id));

        card.append(check, info, del);
        habitList.appendChild(card);
    });

    renderOverallStats();
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function toggleToday(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const key = todayKey();
    if (habit.dates[key]) {
        delete habit.dates[key];
    } else {
        habit.dates[key] = true;
    }

    saveHabits();
    renderHabits();
}

addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = habitInput.value.trim();
    if (!name) return;

    habits.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        name,
        dates: {},
    });

    habitInput.value = "";
    saveHabits();
    renderHabits();
});

function deleteHabit(habitId) {
    habits = habits.filter(h => h.id !== habitId);
    saveHabits();
    renderHabits();
}

function renderOverallStats() {
    if (habits.length === 0) {
        overallFill.style.width = "0%";
        overallPercent.textContent = "0%";
        return;
    }

    const key = todayKey();
    const doneToday = habits.filter(habit => habit.dates[key]).length;

    const percent = Math.round((doneToday / habits.length) * 100);
    overallFill.style.width = percent + "%";
    overallPercent.textContent = percent + "%";
}

function openCalendar(habitId) {
    calendarHabitId = habitId;
    calendarDate = new Date();
    renderCalendar();
    calendarModal.classList.remove("hidden");
}

function closeCalendar() {
    calendarModal.classList.add("hidden");
    calendarHabitId = null;
}

function renderCalendar() {
    const habit = habits.find(h => h.id === calendarHabitId);
    if (!habit) return;

    const year = calendarDate.getFullYear();
    const month = calendarData.getMonth();

    calendarTitle.textContent = `${year} / ${month +1}`;
    calendarHabitName.textContent = habit.name;

    calendarGrid.innerHTML = "";

    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(d => {
        const cell = document.createElement("div");
        cell.className = "cal-cell dow";
        cell.textContent = d;
        calendarGrid.appendChild(cell);
    });

    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < startWeekday; i++) {
        const cell = document.createElement("div");
        cell.className = "cal-cell empty";
        calendarGrid.appendChild(cell);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = toDateKey(new Date(year, month, d));
        const done = !!habit.dates[dateKey];

        const cell = document.createElement("div");
        cell.className = "cal-cell" + (done ? " done" : "");
        cell.textContent = d;

        cell.addEventListener("click", () => {
            if (habit.dates[dateKey]) {
                delete habit.dates[dateKey];
            } else {
                habit.dates[dateKey] = true;
            }
            saveHabits();
            renderCalendar();
            renderHabits();
        });

        calendarGrid.appendChild(cell);
    }
}

prevMonthBtn.addEventListener("click", () => {
    calendarData.setMonth(calendarData.getMonth() - 1);
    renderCalendar();
});

nextMothBtn.addEventListener("click", () => {
    calendarData.setMonth(calendarData.getMonth() + 1);
    renderCalendar();
});

closeModalBtn.addEventListener("click", closeCalendar);
renderHabits();
