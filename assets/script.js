/* =========================================================
   FenyHub
   Expense Tracker + Bookmark Manager + Quiz App
========================================================= */

"use strict";

/* =========================================================
   UTILITIES
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let deleteTarget = null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function loadData(key, fallback = []) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`Gagal membaca localStorage: ${key}`, error);
    return fallback;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Gagal menyimpan localStorage: ${key}`, error);
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function generateId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/* =========================================================
   STORAGE KEYS
========================================================= */

const EXPENSE_STORAGE_KEY = "fenyhub_expenses";
const BOOKMARK_STORAGE_KEY = "fenyhub_bookmarks";
const QUIZ_HIGH_SCORE_KEY = "fenyhub_quiz_high_score";

/* =========================================================
   TAB NAVIGATION
========================================================= */

const VALID_TABS = ["expense", "bookmark", "quiz"];

const tabButtons = $$(".tab-btn");
const tabPanels = $$(".tab-panel");

function getTabFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");

  return VALID_TABS.includes(tab) ? tab : "expense";
}

function setActiveTab(tab, updateUrl = true) {
  const validTab = VALID_TABS.includes(tab) ? tab : "expense";

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === validTab;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  tabPanels.forEach((panel) => {
    const isActive = panel.dataset.panel === validTab;

    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });

  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", validTab);

    window.history.pushState(
      { tab: validTab },
      "",
      url
    );
  }
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.tab);
  });
});

window.addEventListener("popstate", () => {
  setActiveTab(getTabFromUrl(), false);
});

/* =========================================================
   EXPENSE TRACKER
========================================================= */

let expenses = loadData(EXPENSE_STORAGE_KEY, []);

const expenseForm = $("#expense-form");
const expenseIdInput = $("#expense-id");
const expenseTitleInput = $("#expense-title");
const expenseAmountInput = $("#expense-amount");
const expenseTypeInput = $("#expense-type");
const expenseDateInput = $("#expense-date");
const expenseCategoryInput = $("#expense-category");
const expenseSearchInput = $("#expense-search");
const expenseFilterInput = $("#expense-filter");
const expenseSortInput = $("#expense-sort");

const expenseList = $("#expense-list");
const expenseEmpty = $("#expense-empty");

const totalIncomeElement = $("#total-income");
const totalExpenseElement = $("#total-expense");
const balanceElement = $("#balance");

const expenseModal = $("#expense-modal");
const expenseModalTitle = $("#expense-modal-title");
const expenseModalClose = $("#expense-modal-close");
const expenseModalCancel = $("#expense-modal-cancel");

const expenseTitleError = $("#expense-title-error");
const expenseAmountError = $("#expense-amount-error");
const expenseDateError = $("#expense-date-error");

function resetExpenseErrors() {
  if (expenseTitleError) {
    expenseTitleError.textContent = "";
  }

  if (expenseAmountError) {
    expenseAmountError.textContent = "";
  }

  if (expenseDateError) {
    expenseDateError.textContent = "";
  }
}

function validateExpenseForm() {
  let valid = true;

  resetExpenseErrors();

  const title = expenseTitleInput.value.trim();
  const amount = Number(expenseAmountInput.value);
  const date = expenseDateInput.value;

  if (!title) {
    expenseTitleError.textContent =
      "Nama transaksi wajib diisi.";
    valid = false;
  }

  if (!amount || amount <= 0) {
    expenseAmountError.textContent =
      "Jumlah harus lebih dari 0.";
    valid = false;
  }

  if (!date) {
    expenseDateError.textContent =
      "Tanggal wajib diisi.";
    valid = false;
  }

  return valid;
}

function openExpenseModal(expense = null) {
  resetExpenseErrors();

  if (expense) {
    expenseModalTitle.textContent = "Edit Transaksi";

    expenseIdInput.value = expense.id;
    expenseTitleInput.value = expense.title;
    expenseAmountInput.value = expense.amount;
    expenseTypeInput.value = expense.type;
    expenseDateInput.value = expense.date;
    expenseCategoryInput.value =
      expense.category || "";
  } else {
    expenseModalTitle.textContent =
      "Tambah Transaksi";

    expenseForm.reset();
    expenseIdInput.value = "";
  }

  expenseModal.classList.add("open");
  expenseModal.setAttribute("aria-hidden", "false");

  expenseTitleInput.focus();
}

function closeExpenseModal() {
  expenseModal.classList.remove("open");
  expenseModal.setAttribute("aria-hidden", "true");

  resetExpenseErrors();
}

function renderExpenses() {
  const searchTerm =
    expenseSearchInput.value.trim().toLowerCase();

  const filterType = expenseFilterInput.value;
  const sortType = expenseSortInput.value;

  let filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchTerm) ||
      (expense.category || "")
        .toLowerCase()
        .includes(searchTerm);

    const matchesFilter =
      filterType === "all" ||
      expense.type === filterType;

    return matchesSearch && matchesFilter;
  });

  filteredExpenses.sort((a, b) => {
    if (sortType === "newest") {
      return new Date(b.date) - new Date(a.date);
    }

    if (sortType === "oldest") {
      return new Date(a.date) - new Date(b.date);
    }

    if (sortType === "highest") {
      return b.amount - a.amount;
    }

    if (sortType === "lowest") {
      return a.amount - b.amount;
    }

    return 0;
  });

  expenseList.innerHTML = "";

  if (filteredExpenses.length === 0) {
    expenseEmpty.hidden = false;
  } else {
    expenseEmpty.hidden = true;
  }

  filteredExpenses.forEach((expense) => {
    const item = document.createElement("article");

    item.className =
      `expense-item ${expense.type}`;

    const typeLabel =
      expense.type === "income"
        ? "Pemasukan"
        : "Pengeluaran";

    item.innerHTML = `
      <div class="expense-main">
        <div>
          <h3>${escapeHtml(expense.title)}</h3>

          <p class="expense-meta">
            ${escapeHtml(expense.category || "Tanpa kategori")}
            ·
            ${escapeHtml(expense.date)}
          </p>
        </div>

        <strong class="expense-amount">
          ${expense.type === "income" ? "+" : "-"}
          ${formatCurrency(expense.amount)}
        </strong>
      </div>

      <div class="expense-actions">
        <span class="expense-type">
          ${typeLabel}
        </span>

        <button
          type="button"
          class="btn-small edit-expense"
          data-id="${escapeHtml(expense.id)}"
        >
          Edit
        </button>

        <button
          type="button"
          class="btn-small danger delete-expense"
          data-id="${escapeHtml(expense.id)}"
        >
          Hapus
        </button>
      </div>
    `;

    expenseList.appendChild(item);
  });

  updateExpenseSummary();
}

function updateExpenseSummary() {
  const income = expenses
    .filter((expense) => expense.type === "income")
    .reduce(
      (total, expense) => total + Number(expense.amount),
      0
    );

  const expense = expenses
    .filter((item) => item.type === "expense")
    .reduce(
      (total, item) => total + Number(item.amount),
      0
    );

  const balance = income - expense;

  totalIncomeElement.textContent =
    formatCurrency(income);

  totalExpenseElement.textContent =
    formatCurrency(expense);

  balanceElement.textContent =
    formatCurrency(balance);
}

expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateExpenseForm()) {
    return;
  }

  const id = expenseIdInput.value;

  const expenseData = {
    id: id || generateId("expense"),
    title: expenseTitleInput.value.trim(),
    amount: Number(expenseAmountInput.value),
    type: expenseTypeInput.value,
    date: expenseDateInput.value,
    category:
      expenseCategoryInput.value.trim(),
  };

  if (id) {
    expenses = expenses.map((expense) =>
      expense.id === id
        ? expenseData
        : expense
    );
  } else {
    expenses.push(expenseData);
  }

  saveData(EXPENSE_STORAGE_KEY, expenses);

  renderExpenses();
  closeExpenseModal();
});

expenseList.addEventListener("click", (event) => {
  const editButton =
    event.target.closest(".edit-expense");

  const deleteButton =
    event.target.closest(".delete-expense");

  if (editButton) {
    const expense = expenses.find(
      (item) =>
        item.id === editButton.dataset.id
    );

    if (expense) {
      openExpenseModal(expense);
    }
  }

  if (deleteButton) {
    const expense = expenses.find(
      (item) =>
        item.id === deleteButton.dataset.id
    );

    if (expense) {
      deleteTarget = {
        type: "expense",
        id: expense.id,
      };

      openDeleteModal(
        `Hapus transaksi "${expense.title}"?`
      );
    }
  }
});

expenseModalClose.addEventListener(
  "click",
  closeExpenseModal
);

expenseModalCancel.addEventListener(
  "click",
  closeExpenseModal
);

expenseSearchInput.addEventListener(
  "input",
  renderExpenses
);

expenseFilterInput.addEventListener(
  "change",
  renderExpenses
);

expenseSortInput.addEventListener(
  "change",
  renderExpenses
);

/* =========================================================
   BOOKMARK MANAGER
========================================================= */

let bookmarks = loadData(
  BOOKMARK_STORAGE_KEY,
  []
);

const bookmarkForm = $("#bookmark-form");
const bookmarkIdInput = $("#bookmark-id");
const bookmarkTitleInput = $("#bookmark-title");
const bookmarkUrlInput = $("#bookmark-url");
const bookmarkCategoryInput =
  $("#bookmark-category");
const bookmarkNoteInput =
  $("#bookmark-note");

const bookmarkSearchInput =
  $("#bookmark-search");

const bookmarkSortInput =
  $("#bookmark-sort");

const bookmarkList = $("#bookmark-list");
const bookmarkEmpty = $("#bookmark-empty");

const bookmarkModal = $("#bookmark-modal");
const bookmarkModalTitle =
  $("#bookmark-modal-title");

const bookmarkModalClose =
  $("#bookmark-modal-close");

const bookmarkModalCancel =
  $("#bookmark-modal-cancel");

const bookmarkTitleError =
  $("#bookmark-title-error");

const bookmarkUrlError =
  $("#bookmark-url-error");

function resetBookmarkErrors() {
  if (bookmarkTitleError) {
    bookmarkTitleError.textContent = "";
  }

  if (bookmarkUrlError) {
    bookmarkUrlError.textContent = "";
  }
}

function validateBookmarkForm() {
  let valid = true;

  resetBookmarkErrors();

  const title =
    bookmarkTitleInput.value.trim();

  const urlValue =
    bookmarkUrlInput.value.trim();

  if (!title) {
    bookmarkTitleError.textContent =
      "Judul bookmark wajib diisi.";

    valid = false;
  }

  if (!urlValue) {
    bookmarkUrlError.textContent =
      "URL wajib diisi.";

    valid = false;
  } else {
    try {
      const url = new URL(urlValue);

      if (
        url.protocol !== "http:" &&
        url.protocol !== "https:"
      ) {
        throw new Error("Invalid protocol");
      }
    } catch {
      bookmarkUrlError.textContent =
        "Masukkan URL http:// atau https:// yang valid.";

      valid = false;
    }
  }

  return valid;
}

function openBookmarkModal(bookmark = null) {
  resetBookmarkErrors();

  if (bookmark) {
    bookmarkModalTitle.textContent =
      "Edit Bookmark";

    bookmarkIdInput.value = bookmark.id;
    bookmarkTitleInput.value =
      bookmark.title;

    bookmarkUrlInput.value =
      bookmark.url;

    bookmarkCategoryInput.value =
      bookmark.category || "";

    bookmarkNoteInput.value =
      bookmark.note || "";
  } else {
    bookmarkModalTitle.textContent =
      "Tambah Bookmark";

    bookmarkForm.reset();
    bookmarkIdInput.value = "";
  }

  bookmarkModal.classList.add("open");
  bookmarkModal.setAttribute(
    "aria-hidden",
    "false"
  );

  bookmarkTitleInput.focus();
}

function closeBookmarkModal() {
  bookmarkModal.classList.remove("open");
  bookmarkModal.setAttribute(
    "aria-hidden",
    "true"
  );

  resetBookmarkErrors();
}

function renderBookmarks() {
  const searchTerm =
    bookmarkSearchInput.value
      .trim()
      .toLowerCase();

  const sortType =
    bookmarkSortInput.value;

  let filteredBookmarks =
    bookmarks.filter((bookmark) => {
      return (
        bookmark.title
          .toLowerCase()
          .includes(searchTerm) ||
        bookmark.url
          .toLowerCase()
          .includes(searchTerm) ||
        (bookmark.category || "")
          .toLowerCase()
          .includes(searchTerm) ||
        (bookmark.note || "")
          .toLowerCase()
          .includes(searchTerm)
      );
    });

  filteredBookmarks.sort((a, b) => {
    if (sortType === "az") {
      return a.title.localeCompare(
        b.title
      );
    }

    if (sortType === "za") {
      return b.title.localeCompare(
        a.title
      );
    }

    if (sortType === "newest") {
      return (
        new Date(b.createdAt) -
        new Date(a.createdAt)
      );
    }

    if (sortType === "oldest") {
      return (
        new Date(a.createdAt) -
        new Date(b.createdAt)
      );
    }

    return 0;
  });

  bookmarkList.innerHTML = "";

  bookmarkEmpty.hidden =
    filteredBookmarks.length !== 0;

  filteredBookmarks.forEach((bookmark) => {
    const item =
      document.createElement("article");

    item.className = "bookmark-item";

    item.innerHTML = `
      <div class="bookmark-main">
        <div class="bookmark-title-row">
          <h3>
            ${escapeHtml(bookmark.title)}
          </h3>

          ${
            bookmark.category
              ? `<span class="bookmark-category">
                  ${escapeHtml(
                    bookmark.category
                  )}
                </span>`
              : ""
          }
        </div>

        <a
          href="${escapeHtml(bookmark.url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="bookmark-url"
        >
          ${escapeHtml(bookmark.url)}
        </a>

        ${
          bookmark.note
            ? `<p class="bookmark-note">
                ${escapeHtml(
                  bookmark.note
                )}
              </p>`
            : ""
        }
      </div>

      <div class="bookmark-actions">
        <button
          type="button"
          class="btn-small edit-bookmark"
          data-id="${escapeHtml(bookmark.id)}"
        >
          Edit
        </button>

        <button
          type="button"
          class="btn-small danger delete-bookmark"
          data-id="${escapeHtml(bookmark.id)}"
        >
          Hapus
        </button>
      </div>
    `;

    bookmarkList.appendChild(item);
  });
}

bookmarkForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    if (!validateBookmarkForm()) {
      return;
    }

    const id = bookmarkIdInput.value;

    const bookmarkData = {
      id: id || generateId("bookmark"),
      title:
        bookmarkTitleInput.value.trim(),
      url:
        bookmarkUrlInput.value.trim(),
      category:
        bookmarkCategoryInput.value.trim(),
      note:
        bookmarkNoteInput.value.trim(),
      createdAt:
        id
          ? (
              bookmarks.find(
                (item) => item.id === id
              )?.createdAt ||
              new Date().toISOString()
            )
          : new Date().toISOString(),
    };

    if (id) {
      bookmarks = bookmarks.map(
        (bookmark) =>
          bookmark.id === id
            ? bookmarkData
            : bookmark
      );
    } else {
      bookmarks.push(bookmarkData);
    }

    saveData(
      BOOKMARK_STORAGE_KEY,
      bookmarks
    );

    renderBookmarks();
    closeBookmarkModal();
  }
);

bookmarkList.addEventListener(
  "click",
  (event) => {
    const editButton =
      event.target.closest(
        ".edit-bookmark"
      );

    const deleteButton =
      event.target.closest(
        ".delete-bookmark"
      );

    if (editButton) {
      const bookmark =
        bookmarks.find(
          (item) =>
            item.id ===
            editButton.dataset.id
        );

      if (bookmark) {
        openBookmarkModal(bookmark);
      }
    }

    if (deleteButton) {
      const bookmark =
        bookmarks.find(
          (item) =>
            item.id ===
            deleteButton.dataset.id
        );

      if (bookmark) {
        deleteTarget = {
          type: "bookmark",
          id: bookmark.id,
        };

        openDeleteModal(
          `Hapus bookmark "${bookmark.title}"?`
        );
      }
    }
  }
);

bookmarkModalClose.addEventListener(
  "click",
  closeBookmarkModal
);

bookmarkModalCancel.addEventListener(
  "click",
  closeBookmarkModal
);

bookmarkSearchInput.addEventListener(
  "input",
  renderBookmarks
);

bookmarkSortInput.addEventListener(
  "change",
  renderBookmarks
);
/* =========================================================
   DELETE CONFIRMATION MODAL
========================================================= */

const deleteModal = $("#delete-modal");
const deleteModalMessage =
  $("#delete-modal-message");

const deleteModalClose =
  $("#delete-modal-close");

const deleteModalCancel =
  $("#delete-modal-cancel");

const deleteModalConfirm =
  $("#delete-modal-confirm");

function openDeleteModal(message) {
  deleteModalMessage.textContent = message;

  deleteModal.classList.add("open");

  deleteModal.setAttribute(
    "aria-hidden",
    "false"
  );

  deleteModalConfirm.focus();
}

function closeDeleteModal() {
  deleteModal.classList.remove("open");

  deleteModal.setAttribute(
    "aria-hidden",
    "true"
  );

  deleteTarget = null;
}

deleteModalClose.addEventListener(
  "click",
  closeDeleteModal
);

deleteModalCancel.addEventListener(
  "click",
  closeDeleteModal
);

deleteModalConfirm.addEventListener(
  "click",
  () => {
    if (!deleteTarget) {
      closeDeleteModal();
      return;
    }

    if (deleteTarget.type === "expense") {
      expenses = expenses.filter(
        (expense) =>
          expense.id !== deleteTarget.id
      );

      saveData(
        EXPENSE_STORAGE_KEY,
        expenses
      );

      renderExpenses();
    }

    if (deleteTarget.type === "bookmark") {
      bookmarks = bookmarks.filter(
        (bookmark) =>
          bookmark.id !== deleteTarget.id
      );

      saveData(
        BOOKMARK_STORAGE_KEY,
        bookmarks
      );

      renderBookmarks();
    }

    closeDeleteModal();
  }
);

/* =========================================================
   CLOSE MODALS WHEN CLICKING OUTSIDE
========================================================= */

expenseModal.addEventListener(
  "click",
  (event) => {
    if (event.target === expenseModal) {
      closeExpenseModal();
    }
  }
);

bookmarkModal.addEventListener(
  "click",
  (event) => {
    if (event.target === bookmarkModal) {
      closeBookmarkModal();
    }
  }
);

deleteModal.addEventListener(
  "click",
  (event) => {
    if (event.target === deleteModal) {
      closeDeleteModal();
    }
  }
);

/* =========================================================
   ESCAPE KEY FOR MODALS
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (
      expenseModal.classList.contains("open")
    ) {
      closeExpenseModal();
    }

    if (
      bookmarkModal.classList.contains("open")
    ) {
      closeBookmarkModal();
    }

    if (
      deleteModal.classList.contains("open")
    ) {
      closeDeleteModal();
    }
  }
);

/* =========================================================
   QUIZ APP
========================================================= */

const quizQuestions = [
  {
    question:
      "Apa fungsi utama HTML dalam pengembangan web?",
    options: [
      "Mengatur struktur halaman web",
      "Mengatur database",
      "Menjalankan server",
      "Membuat API"
    ],
    answer: 0,
    explanation:
      "HTML digunakan untuk membuat dan menyusun struktur konten pada halaman web."
  },

  {
    question:
      "Bahasa yang digunakan untuk mengatur tampilan halaman web adalah...",
    options: [
      "Python",
      "CSS",
      "SQL",
      "Java"
    ],
    answer: 1,
    explanation:
      "CSS digunakan untuk mengatur tampilan, layout, warna, ukuran, dan gaya elemen HTML."
  },

  {
    question:
      "Apa fungsi JavaScript pada website?",
    options: [
      "Menyimpan semua file gambar",
      "Mengatur struktur database",
      "Menambahkan interaksi dan perilaku dinamis",
      "Menggantikan HTML sepenuhnya"
    ],
    answer: 2,
    explanation:
      "JavaScript membuat halaman web dapat merespons tindakan pengguna dan menjalankan logika tertentu."
  },

  {
    question:
      "Manakah yang termasuk Web Storage pada browser?",
    options: [
      "localStorage",
      "PythonStorage",
      "HTMLStorage",
      "BrowserSQL"
    ],
    answer: 0,
    explanation:
      "localStorage merupakan Web Storage API yang dapat digunakan untuk menyimpan data pada browser."
  },

  {
    question:
      "Apa kegunaan method addEventListener()?",
    options: [
      "Menghapus HTML",
      "Menambahkan event handler",
      "Membuat database",
      "Mengubah URL website"
    ],
    answer: 1,
    explanation:
      "addEventListener() digunakan untuk memasang listener agar kode dapat merespons event tertentu."
  },

  {
    question:
      "Apa yang dimaksud dengan DOM?",
    options: [
      "Database Object Manager",
      "Document Object Model",
      "Dynamic Online Module",
      "Document Online Method"
    ],
    answer: 1,
    explanation:
      "DOM adalah representasi dokumen HTML dalam bentuk struktur objek yang dapat dimanipulasi menggunakan JavaScript."
  }
];

/* =========================================================
   QUIZ STATE
========================================================= */

let currentQuestionIndex = 0;
let quizScore = 0;
let quizAnswered = false;

let quizHighScore = Number(
  localStorage.getItem(
    QUIZ_HIGH_SCORE_KEY
  ) || 0
);

/* =========================================================
   QUIZ DOM ELEMENTS
========================================================= */

const quizStartScreen =
  $("#quiz-start-screen");

const quizQuestionScreen =
  $("#quiz-question-screen");

const quizResultScreen =
  $("#quiz-result-screen");

const quizStartButton =
  $("#quiz-start");

const quizRestartButton =
  $("#quiz-restart");

const quizQuestionNumber =
  $("#quiz-question-number");

const quizQuestion =
  $("#quiz-question");

const quizOptions =
  $("#quiz-options");

const quizProgress =
  $("#quiz-progress");

const quizCurrentScore =
  $("#quiz-current-score");

const quizFeedback =
  $("#quiz-feedback");

const quizNextButton =
  $("#quiz-next");

const quizFinalScore =
  $("#quiz-final-score");

const quizHighScoreElement =
  $("#quiz-high-score");

const quizResultMessage =
  $("#quiz-result-message");

/* =========================================================
   QUIZ SCREEN MANAGEMENT
========================================================= */

function showQuizScreen(screen) {
  quizStartScreen.hidden =
    screen !== "start";

  quizQuestionScreen.hidden =
    screen !== "question";

  quizResultScreen.hidden =
    screen !== "result";
}

/* =========================================================
   START QUIZ
========================================================= */

function startQuiz() {
  currentQuestionIndex = 0;
  quizScore = 0;
  quizAnswered = false;

  showQuizScreen("question");

  renderQuizQuestion();
}

/* =========================================================
   RENDER QUIZ QUESTION
========================================================= */

function renderQuizQuestion() {
  const currentQuestion =
    quizQuestions[currentQuestionIndex];

  if (!currentQuestion) {
    finishQuiz();
    return;
  }

  quizAnswered = false;

  quizQuestionNumber.textContent =
    `Soal ${currentQuestionIndex + 1} dari ${quizQuestions.length}`;

  quizQuestion.textContent =
    currentQuestion.question;

  quizCurrentScore.textContent =
    `Skor: ${quizScore}`;

  const progress =
    ((currentQuestionIndex + 1) /
      quizQuestions.length) *
    100;

  quizProgress.style.width =
    `${progress}%`;

  quizOptions.innerHTML = "";

  quizFeedback.classList.remove(
    "feedback-correct",
    "feedback-wrong"
  );

  quizFeedback.classList.add(
    "hidden"
  );

  quizFeedback.textContent = "";

  quizNextButton.hidden = true;

  currentQuestion.options.forEach(
    (option, index) => {
      const button =
        document.createElement("button");

      button.type = "button";

      button.className =
        "quiz-option";

      button.dataset.answer =
        String(index);

      button.textContent =
        option;

      quizOptions.appendChild(button);
    }
  );
}

/* =========================================================
   ANSWER QUIZ
========================================================= */

function answerQuiz(selectedIndex) {
  if (quizAnswered) {
    return;
  }

  quizAnswered = true;

  const currentQuestion =
    quizQuestions[currentQuestionIndex];

  const optionButtons =
    $$(".quiz-option");

  optionButtons.forEach(
    (button) => {
      button.disabled = true;
    }
  );

  const selectedButton =
    optionButtons[selectedIndex];

  const correctButton =
    optionButtons[
      currentQuestion.answer
    ];

  if (selectedIndex === currentQuestion.answer) {
    quizScore += 1;

    selectedButton.classList.add(
      "correct"
    );

    quizFeedback.classList.remove(
      "hidden",
      "feedback-wrong"
    );

    quizFeedback.classList.add(
      "quiz-feedback",
      "feedback-correct"
    );

    quizFeedback.textContent =
      `Benar! ${currentQuestion.explanation}`;
  } else {
    selectedButton.classList.add(
      "wrong"
    );

    correctButton.classList.add(
      "correct"
    );

    quizFeedback.classList.remove(
      "hidden",
      "feedback-correct"
    );

    quizFeedback.classList.add(
      "quiz-feedback",
      "feedback-wrong"
    );

    quizFeedback.textContent =
      `Belum tepat. ${currentQuestion.explanation}`;
  }

  quizCurrentScore.textContent =
    `Skor: ${quizScore}`;

  quizNextButton.hidden = false;

  if (
    currentQuestionIndex ===
    quizQuestions.length - 1
  ) {
    quizNextButton.textContent =
      "Lihat Hasil";
  } else {
    quizNextButton.textContent =
      "Soal Berikutnya";
  }
}

/* =========================================================
   QUIZ OPTION CLICK
========================================================= */

quizOptions.addEventListener(
  "click",
  (event) => {
    const option =
      event.target.closest(
        ".quiz-option"
      );

    if (!option) {
      return;
    }

    const selectedIndex =
      Number(option.dataset.answer);

    answerQuiz(selectedIndex);
  }
);

/* =========================================================
   NEXT QUESTION
========================================================= */

quizNextButton.addEventListener(
  "click",
  () => {
    currentQuestionIndex += 1;

    if (
      currentQuestionIndex >=
      quizQuestions.length
    ) {
      finishQuiz();
      return;
    }

    renderQuizQuestion();
  }
);

/* =========================================================
   FINISH QUIZ
========================================================= */

function finishQuiz() {
  showQuizScreen("result");

  quizFinalScore.textContent =
    `${quizScore} / ${quizQuestions.length}`;

  if (quizScore > quizHighScore) {
    quizHighScore = quizScore;

    localStorage.setItem(
      QUIZ_HIGH_SCORE_KEY,
      String(quizHighScore)
    );
  }

  quizHighScoreElement.textContent =
    String(quizHighScore);

  const percentage =
    (quizScore /
      quizQuestions.length) *
    100;

  if (percentage === 100) {
    quizResultMessage.textContent =
      "Semua jawaban benar. Bagus!";
  } else if (percentage >= 70) {
    quizResultMessage.textContent =
      "Hasilnya sudah bagus. Coba lagi untuk meningkatkan skor.";
  } else if (percentage >= 50) {
    quizResultMessage.textContent =
      "Lumayan. Pelajari kembali materi dan coba lagi.";
  } else {
    quizResultMessage.textContent =
      "Yuk coba lagi dan tingkatkan skor kamu.";
  }
}

/* =========================================================
   QUIZ BUTTON EVENTS
========================================================= */

quizStartButton.addEventListener(
  "click",
  startQuiz
);

quizRestartButton.addEventListener(
  "click",
  startQuiz
);

/* =========================================================
   INITIALIZATION
========================================================= */

function initializeApp() {
  const initialTab =
    getTabFromUrl();

  const url =
    new URL(window.location.href);

  if (!url.searchParams.has("tab")) {
    url.searchParams.set(
      "tab",
      initialTab
    );

    window.history.replaceState(
      { tab: initialTab },
      "",
      url
    );
  }

  setActiveTab(
    initialTab,
    false
  );

  renderExpenses();
  renderBookmarks();

  showQuizScreen("start");

  quizHighScoreElement.textContent =
    String(quizHighScore);
}

initializeApp();
