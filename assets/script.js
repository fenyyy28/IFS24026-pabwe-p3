"use strict";

/* =========================================================
   UTILITIES
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => {
  return Array.from(document.querySelectorAll(selector));
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function loadData(key) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Gagal membaca localStorage: ${key}`, error);
    return [];
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Gagal menyimpan localStorage: ${key}`, error);
    return false;
  }
}

/* =========================================================
   TAB SWITCHER
========================================================= */

const tabButtons = $$(".tab-btn");

const panels = {
  expense: $("#panel-expense"),
  bookmark: $("#panel-bookmark"),
  quiz: $("#panel-quiz")
};

const validTabs = Object.keys(panels);

function getTabFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");

  return validTabs.includes(tab) ? tab : "expense";
}

function setTabUrl(tab) {
  const url = new URL(window.location.href);

  url.searchParams.set("tab", tab);

  window.history.replaceState(
    {},
    "",
    url.toString()
  );
}

function switchTab(tab) {
  const activeTab = validTabs.includes(tab)
    ? tab
    : "expense";

  Object.entries(panels).forEach(([name, panel]) => {
    if (!panel) {
      return;
    }

    panel.classList.toggle(
      "hidden",
      name !== activeTab
    );
  });

  tabButtons.forEach((button) => {
    const isActive =
      button.dataset.tab === activeTab;

    button.classList.toggle(
      "active",
      isActive
    );

    button.setAttribute(
      "aria-selected",
      String(isActive)
    );
  });

  setTabUrl(activeTab);
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchTab(button.dataset.tab);
  });
});

window.addEventListener("popstate", () => {
  switchTab(getTabFromUrl());
});

switchTab(getTabFromUrl());

/* =========================================================
   MODAL
========================================================= */

function openModal(name) {
  const modal = $(`#${name}-modal`);

  if (!modal) {
    return;
  }

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(name) {
  const modal = $(`#${name}-modal`);

  if (!modal) {
    return;
  }

  modal.classList.remove("open");

  const anyModalOpen =
    $$(".modal.open").length > 0;

  if (!anyModalOpen) {
    document.body.style.overflow = "";
  }
}

$$("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", () => {
    closeModal(element.dataset.closeModal);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  $$(".modal.open").forEach((modal) => {
    modal.classList.remove("open");
  });

  document.body.style.overflow = "";
});

/* =========================================================
   EXPENSE TRACKER
========================================================= */

const EXPENSE_KEY = "fenyhub_expenses";

let expenses = loadData(EXPENSE_KEY);

let editingExpenseId = null;
let deletingExpenseId = null;

const expenseForm = $("#expense-form");
const expenseModalTitle = $("#expense-modal-title");

const expenseTitleInput =
  $("#expense-title-input");

const expenseCategoryInput =
  $("#expense-category-input");

const expenseAmountInput =
  $("#expense-amount-input");

const expenseTypeInput =
  $("#expense-type-input");

const expenseDateInput =
  $("#expense-date-input");

const expenseSearch =
  $("#expense-search");

const expenseTypeFilter =
  $("#expense-type-filter");

const expenseSort =
  $("#expense-sort");

const expenseList =
  $("#expense-list");

const expenseEmpty =
  $("#expense-empty");

const totalIncome =
  $("#total-income");

const totalExpense =
  $("#total-expense");

const totalBalance =
  $("#total-balance");

function openExpenseCreateModal() {
  editingExpenseId = null;

  expenseModalTitle.textContent =
    "Tambah Transaksi";

  expenseForm.reset();

  expenseTypeInput.value =
    "Pengeluaran";

  expenseDateInput.value =
    getToday();

  openModal("expense");
}

function openExpenseEditModal(id) {
  const expense = expenses.find(
    (item) => item.id === id
  );

  if (!expense) {
    return;
  }

  editingExpenseId = id;

  expenseModalTitle.textContent =
    "Ubah Transaksi";

  expenseTitleInput.value =
    expense.title;

  expenseCategoryInput.value =
    expense.category;

  expenseAmountInput.value =
    expense.amount;

  expenseTypeInput.value =
    expense.type;

  expenseDateInput.value =
    expense.date;

  openModal("expense");
}

function renderExpenseSummary() {
  const income = expenses
    .filter(
      (item) =>
        item.type === "Pemasukan"
    )
    .reduce(
      (total, item) =>
        total + Number(item.amount),
      0
    );

  const expense = expenses
    .filter(
      (item) =>
        item.type === "Pengeluaran"
    )
    .reduce(
      (total, item) =>
        total + Number(item.amount),
      0
    );

  const balance = income - expense;

  totalIncome.textContent =
    formatRupiah(income);

  totalExpense.textContent =
    formatRupiah(expense);

  totalBalance.textContent =
    formatRupiah(balance);
}

function getFilteredExpenses() {
  const query =
    expenseSearch.value
      .trim()
      .toLowerCase();

  const type =
    expenseTypeFilter.value;

  const sort =
    expenseSort.value;

  const result = expenses.filter(
    (item) => {
      const matchesSearch =
        item.title
          .toLowerCase()
          .includes(query);

      const matchesType =
        type === "all" ||
        item.type === type;

      return matchesSearch &&
        matchesType;
    }
  );

  result.sort((a, b) => {
    if (sort === "oldest") {
      return (
        new Date(a.date) -
        new Date(b.date)
      );
    }

    if (sort === "highest") {
      return (
        Number(b.amount) -
        Number(a.amount)
      );
    }

    if (sort === "lowest") {
      return (
        Number(a.amount) -
        Number(b.amount)
      );
    }

    return (
      new Date(b.date) -
      new Date(a.date)
    );
  });

  return result;
}

function renderExpenses() {
  const result =
    getFilteredExpenses();

  expenseList.innerHTML = "";

  expenseEmpty.classList.toggle(
    "hidden",
    result.length > 0
  );

  if (result.length === 0) {
    return;
  }

  result.forEach((item) => {
    const article =
      document.createElement("article");

    article.className =
      "item-card";

    const badgeClass =
      item.type === "Pemasukan"
        ? "badge-income"
        : "badge-expense";

    article.innerHTML = `
      <div class="item-card-header">
        <div>
          <div class="item-title">
            ${escapeHtml(item.title)}
          </div>

          <div class="item-meta">
            ${escapeHtml(formatDate(item.date))}
          </div>

          <span class="badge ${badgeClass}">
            ${escapeHtml(item.type)}
          </span>

          <span class="badge badge-category">
            ${escapeHtml(item.category)}
          </span>
        </div>

        <div class="item-actions">
          <button
            type="button"
            class="btn btn-secondary btn-small"
            data-action="edit-expense"
            data-id="${escapeHtml(item.id)}"
          >
            Ubah
          </button>

          <button
            type="button"
            class="btn btn-danger btn-small"
            data-action="delete-expense"
            data-id="${escapeHtml(item.id)}"
          >
            Hapus
          </button>
        </div>
      </div>

      <div
        style="
          margin-top: 12px;
          font-size: 1.1rem;
          font-weight: 800;
        "
      >
        ${escapeHtml(formatRupiah(item.amount))}
      </div>
    `;

    expenseList.appendChild(article);
  });
}

expenseForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const title =
      expenseTitleInput.value.trim();

    const category =
      expenseCategoryInput.value.trim();

    const amount =
      Number(expenseAmountInput.value);

    const type =
      expenseTypeInput.value;

    const date =
      expenseDateInput.value;

    if (
      !title ||
      !category ||
      !date ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert(
        "Lengkapi semua data dan pastikan jumlah lebih dari 0."
      );
      return;
    }

    if (editingExpenseId) {
      const index =
        expenses.findIndex(
          (item) =>
            item.id === editingExpenseId
        );

      if (index !== -1) {
        expenses[index] = {
          ...expenses[index],
          title,
          category,
          amount,
          type,
          date
        };
      }
    } else {
      expenses.push({
        id: createId(),
        title,
        category,
        amount,
        type,
        date
      });
    }

    saveData(
      EXPENSE_KEY,
      expenses
    );

    renderExpenseSummary();
    renderExpenses();

    closeModal("expense");
  }
);

expenseSearch.addEventListener(
  "input",
  renderExpenses
);

expenseTypeFilter.addEventListener(
  "change",
  renderExpenses
);

expenseSort.addEventListener(
  "change",
  renderExpenses
);

$("#add-expense-btn")
  .addEventListener(
    "click",
    openExpenseCreateModal
  );

/* =========================================================
   EXPENSE ACTIONS
========================================================= */

expenseList.addEventListener(
  "click",
  (event) => {
    const button =
      event.target.closest(
        "[data-action]"
      );

    if (!button) {
      return;
    }

    const id =
      button.dataset.id;

    const action =
      button.dataset.action;

    if (action === "edit-expense") {
      openExpenseEditModal(id);
    }

    if (action === "delete-expense") {
      openDeleteModal(
        "expense",
        id
      );
    }
  }
);

/* =========================================================
   BOOKMARK MANAGER
========================================================= */

const BOOKMARK_KEY =
  "fenyhub_bookmarks";

let bookmarks =
  loadData(BOOKMARK_KEY);

let editingBookmarkId = null;

const bookmarkForm =
  $("#bookmark-form");

const bookmarkModalTitle =
  $("#bookmark-modal-title");

const bookmarkTitleInput =
  $("#bookmark-title-input");

const bookmarkUrlInput =
  $("#bookmark-url-input");

const bookmarkCategoryInput =
  $("#bookmark-category-input");

const bookmarkNoteInput =
  $("#bookmark-note-input");

const bookmarkSearch =
  $("#bookmark-search");

const bookmarkCategoryFilter =
  $("#bookmark-category-filter");

const bookmarkSort =
  $("#bookmark-sort");

const bookmarkList =
  $("#bookmark-list");

const bookmarkEmpty =
  $("#bookmark-empty");

function isValidHttpUrl(value) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function openBookmarkCreateModal() {
  editingBookmarkId = null;

  bookmarkModalTitle.textContent =
    "Tambah Bookmark";

  bookmarkForm.reset();

  openModal("bookmark");
}

function openBookmarkEditModal(id) {
  const bookmark =
    bookmarks.find(
      (item) => item.id === id
    );

  if (!bookmark) {
    return;
  }

  editingBookmarkId = id;

  bookmarkModalTitle.textContent =
    "Ubah Bookmark";

  bookmarkTitleInput.value =
    bookmark.title;

  bookmarkUrlInput.value =
    bookmark.url;

  bookmarkCategoryInput.value =
    bookmark.category;

  bookmarkNoteInput.value =
    bookmark.note || "";

  openModal("bookmark");
}

function updateBookmarkCategories() {
  const currentValue =
    bookmarkCategoryFilter.value;

  const categories = [
    ...new Set(
      bookmarks
        .map(
          (item) =>
            item.category.trim()
        )
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b)
  );

  bookmarkCategoryFilter.innerHTML = `
    <option value="all">
      Semua kategori
    </option>
  `;

  categories.forEach(
    (category) => {
      const option =
        document.createElement("option");

      option.value = category;
      option.textContent = category;

      bookmarkCategoryFilter
        .appendChild(option);
    }
  );

  if (
    categories.includes(
      currentValue
    )
  ) {
    bookmarkCategoryFilter.value =
      currentValue;
  }
}

function getFilteredBookmarks() {
  const query =
    bookmarkSearch.value
      .trim()
      .toLowerCase();

  const category =
    bookmarkCategoryFilter.value;

  const sort =
    bookmarkSort.value;

  const result =
    bookmarks.filter(
      (item) => {
        const text =
          `${item.title} ${item.url} ${item.category}`
            .toLowerCase();

        const matchesSearch =
          text.includes(query);

        const matchesCategory =
          category === "all" ||
          item.category === category;

        return (
          matchesSearch &&
          matchesCategory
        );
      }
    );

  result.sort((a, b) => {
    if (sort === "az") {
      return a.title.localeCompare(
        b.title
      );
    }

    if (sort === "za") {
      return b.title.localeCompare(
        a.title
      );
    }

    return (
      Number(b.createdAt) -
      Number(a.createdAt)
    );
  });

  return result;
}

function renderBookmarks() {
  updateBookmarkCategories();

  const result =
    getFilteredBookmarks();

  bookmarkList.innerHTML = "";

  bookmarkEmpty.classList.toggle(
    "hidden",
    result.length > 0
  );

  if (result.length === 0) {
    return;
  }

  result.forEach((item) => {
    const article =
      document.createElement("article");

    article.className =
      "item-card";

    article.innerHTML = `
      <div class="item-card-header">
        <div>
          <div class="item-title">
            ${escapeHtml(item.title)}
          </div>

          <a
            class="bookmark-url"
            href="${escapeHtml(item.url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${escapeHtml(item.url)}
          </a>

          <span class="badge badge-category">
            ${escapeHtml(item.category)}
          </span>

          ${
            item.note
              ? `
                <p class="bookmark-note">
                  ${escapeHtml(item.note)}
                </p>
              `
              : ""
          }
        </div>

        <div class="item-actions">
          <button
            type="button"
            class="btn btn-secondary btn-small"
            data-action="edit-bookmark"
            data-id="${escapeHtml(item.id)}"
          >
            Ubah
          </button>

          <button
            type="button"
            class="btn btn-danger btn-small"
            data-action="delete-bookmark"
            data-id="${escapeHtml(item.id)}"
          >
            Hapus
          </button>
        </div>
      </div>
    `;

    bookmarkList.appendChild(article);
  });
}

bookmarkForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const title =
      bookmarkTitleInput.value.trim();

    const url =
      bookmarkUrlInput.value.trim();

    const category =
      bookmarkCategoryInput.value.trim();

    const note =
      bookmarkNoteInput.value.trim();

    if (
      !title ||
      !url ||
      !category
    ) {
      alert(
        "Judul, URL, dan kategori wajib diisi."
      );
      return;
    }

    if (!isValidHttpUrl(url)) {
      alert(
        "URL harus diawali http:// atau https://."
      );
      return;
    }

    if (editingBookmarkId) {
      const index =
        bookmarks.findIndex(
          (item) =>
            item.id ===
            editingBookmarkId
        );

      if (index !== -1) {
        bookmarks[index] = {
          ...bookmarks[index],
          title,
          url,
          category,
          note
        };
      }
    } else {
      bookmarks.push({
        id: createId(),
        title,
        url,
        category,
        note,
        createdAt: Date.now()
      });
    }

    saveData(
      BOOKMARK_KEY,
      bookmarks
    );

    renderBookmarks();

    closeModal("bookmark");
  }
);

bookmarkSearch.addEventListener(
  "input",
  renderBookmarks
);

bookmarkCategoryFilter.addEventListener(
  "change",
  renderBookmarks
);

bookmarkSort.addEventListener(
  "change",
  renderBookmarks
);

$("#add-bookmark-btn")
  .addEventListener(
    "click",
    openBookmarkCreateModal
  );

bookmarkList.addEventListener(
  "click",
  (event) => {
    const button =
      event.target.closest(
        "[data-action]"
      );

    if (!button) {
      return;
    }

    const id =
      button.dataset.id;

    const action =
      button.dataset.action;

    if (
      action ===
      "edit-bookmark"
    ) {
      openBookmarkEditModal(id);
    }

    if (
      action ===
      "delete-bookmark"
    ) {
      openDeleteModal(
        "bookmark",
        id
      );
    }
  }
);

/* =========================================================
   DELETE MODAL
========================================================= */

let deletingType = null;
let deletingId = null;

const deleteMessage =
  $("#delete-message");

const deleteConfirmButton =
  $("#delete-confirm-btn");

function openDeleteModal(
  type,
  id
) {
  deletingType = type;
  deletingId = id;

  if (type === "expense") {
    deletingExpenseId = id;

    const item =
      expenses.find(
        (expense) =>
          expense.id === id
      );

    deleteMessage.textContent =
      item
        ? `Yakin ingin menghapus transaksi "${item.title}"?`
        : "Yakin ingin menghapus transaksi ini?";
  }

  if (type === "bookmark") {
    const item =
      bookmarks.find(
        (bookmark) =>
          bookmark.id === id
      );

    deleteMessage.textContent =
      item
        ? `Yakin ingin menghapus bookmark "${item.title}"?`
        : "Yakin ingin menghapus bookmark ini?";
  }

  openModal("delete");
}

deleteConfirmButton.addEventListener(
  "click",
  () => {
    if (
      !deletingType ||
      !deletingId
    ) {
      return;
    }

    if (
      deletingType ===
      "expense"
    ) {
      expenses =
        expenses.filter(
          (item) =>
            item.id !==
            deletingId
        );

      saveData(
        EXPENSE_KEY,
        expenses
      );

      renderExpenseSummary();
      renderExpenses();
    }

    if (
      deletingType ===
      "bookmark"
    ) {
      bookmarks =
        bookmarks.filter(
          (item) =>
            item.id !==
            deletingId
        );

      saveData(
        BOOKMARK_KEY,
        bookmarks
      );

      renderBookmarks();
    }

    deletingType = null;
    deletingId = null;

    closeModal("delete");
  }
);

/* =========================================================
   QUIZ APP
========================================================= */

const QUIZ_HIGH_SCORE_KEY =
  "fenyhub_quiz_high_score";

const quizQuestions = [
  {
    question:
      "Tag HTML apa yang digunakan untuk membuat fungsi atau pembungkus utama halaman?",
    options: [
      "<main>",
      "<function>",
      "<script>",
      "<style>"
    ],
    answer: 0
  },

  {
    question:
      "Bahasa yang digunakan untuk mengatur tampilan dan layout halaman web adalah...",
    options: [
      "HTML",
      "JavaScript",
      "CSS",
      "SQL"
    ],
    answer: 2
  },

  {
    question:
      "JavaScript pada aplikasi web terutama digunakan untuk...",
    options: [
      "Menyimpan file di komputer",
      "Mengatur database server secara langsung",
      "Mengganti sistem operasi",
      "Menambahkan interaksi dan logika"
    ],
    answer: 3
  },

  {
    question:
      "Method JavaScript yang digunakan untuk menambahkan item ke akhir array adalah...",
    options: [
      "pop()",
      "shift()",
      "push()",
      "slice()"
    ],
    answer: 2
  },

  {
    question:
      "API browser yang dapat digunakan untuk menyimpan data sederhana secara lokal adalah...",
    options: [
      "localStorage",
      "console",
      "document.write",
      "window.print"
    ],
    answer: 0
  },

  {
    question:
      "Method yang digunakan untuk mengambil elemen pertama yang cocok dengan CSS selector adalah...",
    options: [
      "getAll()",
      "querySelector()",
      "findElement()",
      "selectFirst()"
    ],
    answer: 1
  }
];

let currentQuizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let quizNextTimer = null;

const highScoreElement =
  $("#high-score");

const quizStart =
  $("#quiz-start");

const quizQuestionArea =
  $("#quiz-question-area");

const quizResult =
  $("#quiz-result");

const quizProgress =
  $("#quiz-progress");

const quizQuestion =
  $("#quiz-question");

const quizOptions =
  $("#quiz-options");

const quizFeedback =
  $("#quiz-feedback");

const nextQuestionButton =
  $("#next-question-btn");

const quizResultScore =
  $("#quiz-result-score");

const quizResultMessage =
  $("#quiz-result-message");

function getHighScore() {
  try {
    const value =
      Number(
        localStorage.getItem(
          QUIZ_HIGH_SCORE_KEY
        )
      );

    return Number.isFinite(value)
      ? value
      : 0;
  } catch (error) {
    console.error(
      "Gagal membaca high score.",
      error
    );

    return 0;
  }
}

function saveHighScore(score) {
  try {
    localStorage.setItem(
      QUIZ_HIGH_SCORE_KEY,
      String(score)
    );
  } catch (error) {
    console.error(
      "Gagal menyimpan high score.",
      error
    );
  }
}

function updateHighScore() {
  highScoreElement.textContent =
    String(getHighScore());
}

function startQuiz() {
  if (quizNextTimer) {
    clearTimeout(quizNextTimer);
    quizNextTimer = null;
  }

  currentQuizIndex = 0;
  quizScore = 0;
  quizAnswered = false;

  quizStart.classList.add(
    "hidden"
  );

  quizResult.classList.add(
    "hidden"
  );

  quizQuestionArea.classList.remove(
    "hidden"
  );

  renderQuizQuestion();
}

function renderQuizQuestion() {
  const question =
    quizQuestions[
      currentQuizIndex
    ];

  if (!question) {
    finishQuiz();
    return;
  }

  quizAnswered = false;

  quizProgress.textContent =
    `Soal ${currentQuizIndex + 1} dari ${quizQuestions.length}`;

  quizQuestion.textContent =
    question.question;

  quizOptions.innerHTML = "";

  quizFeedback.className =
    "quiz-feedback hidden";

  quizFeedback.textContent = "";

  nextQuestionButton.classList.add(
    "hidden"
  );

  question.options.forEach(
    (option, index) => {
      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.className =
        "quiz-option";

      button.textContent =
        option;

      button.dataset.index =
        String(index);

      button.addEventListener(
        "click",
        () => {
          answerQuiz(index);
        }
      );

      quizOptions.appendChild(
        button
      );
    }
  );
}

function answerQuiz(selectedIndex) {
  if (quizAnswered) {
    return;
  }

  quizAnswered = true;

  const question =
    quizQuestions[
      currentQuizIndex
    ];

  const isCorrect =
    selectedIndex ===
    question.answer;

  if (isCorrect) {
    quizScore += 1;
  }

  const optionButtons =
    $$(".quiz-option");

  optionButtons.forEach(
    (button, index) => {
      button.disabled = true;

      if (
        index ===
        question.answer
      ) {
        button.classList.add(
          "correct"
        );
      }

      if (
        index === selectedIndex &&
        !isCorrect
      ) {
        button.classList.add(
          "wrong"
        );
      }
    }
  );

  quizFeedback.classList.remove(
    "hidden"
  );

  if (isCorrect) {
    quizFeedback.className =
      "quiz-feedback feedback-correct";

    quizFeedback.textContent =
      "✓ Jawaban benar!";
  } else {
    quizFeedback.className =
      "quiz-feedback feedback-wrong";

    quizFeedback.textContent =
      `✗ Jawaban kurang tepat. Jawaban yang benar: ${question.options[question.answer]}`;
  }

  nextQuestionButton.classList.remove(
    "hidden"
  );

  nextQuestionButton.textContent =
    currentQuizIndex ===
    quizQuestions.length - 1
      ? "Lihat Skor"
      : "Soal Berikutnya";
}

function nextQuizQuestion() {
  if (!quizAnswered) {
    return;
  }

  currentQuizIndex += 1;

  if (
    currentQuizIndex >=
    quizQuestions.length
  ) {
    finishQuiz();
    return;
  }

  renderQuizQuestion();
}

function finishQuiz() {
  if (quizNextTimer) {
    clearTimeout(quizNextTimer);
    quizNextTimer = null;
  }

  quizQuestionArea.classList.add(
    "hidden"
  );

  quizResult.classList.remove(
    "hidden"
  );

  quizResultScore.textContent =
    `${quizScore} / ${quizQuestions.length}`;

  const oldHighScore =
    getHighScore();

  if (quizScore > oldHighScore) {
    saveHighScore(quizScore);

    quizResultMessage.textContent =
      "Selamat! Kamu mendapatkan high score baru.";
  } else if (
    quizScore ===
    quizQuestions.length
  ) {
    quizResultMessage.textContent =
      "Sempurna! Semua jawaban benar.";
  } else {
    quizResultMessage.textContent =
      "Kuis selesai. Coba lagi untuk mendapatkan skor yang lebih tinggi.";
  }

  updateHighScore();
}

$("#start-quiz-btn")
  .addEventListener(
    "click",
    startQuiz
  );

$("#restart-quiz-btn")
  .addEventListener(
    "click",
    startQuiz
  );

nextQuestionButton
  .addEventListener(
    "click",
    nextQuizQuestion
  );

/* =========================================================
   INITIAL RENDER
========================================================= */

expenseDateInput.value =
  getToday();

renderExpenseSummary();
renderExpenses();
renderBookmarks();
updateHighScore();