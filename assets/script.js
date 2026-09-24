"use strict";

/* =========================================================
   FenyHub - Utilities
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const VALID_TABS = [
  "expense",
  "bookmark",
  "quiz"
];

/* Deklarasi state global di awal */
let deleteTarget = null;
let editingExpenseId = null;
let editingBookmarkId = null;

/* =========================================================
   Utility Functions
========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}

function formatRupiah(value) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(Number(value) || 0);
}

function todayISO() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function createId(prefix) {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID ===
      "function"
  ) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

/* =========================================================
   Inline Validation
========================================================= */

function clearFieldError(input) {
  if (!input) return;

  input.removeAttribute(
    "aria-invalid"
  );

  const error =
    input.nextElementSibling;

  if (
    error &&
    error.classList.contains(
      "field-error"
    )
  ) {
    error.remove();
  }
}

function showFieldError(
  input,
  message
) {
  if (!input) return false;

  clearFieldError(input);

  input.setAttribute(
    "aria-invalid",
    "true"
  );

  const error =
    document.createElement("small");

  error.className =
    "field-error";

  error.setAttribute(
    "role",
    "alert"
  );

  error.textContent =
    message;

  input.insertAdjacentElement(
    "afterend",
    error
  );

  input.focus();

  return false;
}

function clearFormErrors(form) {
  if (!form) return;

  form
    .querySelectorAll(
      ".field-error"
    )
    .forEach(
      (error) =>
        error.remove()
    );

  form
    .querySelectorAll(
      "[aria-invalid='true']"
    )
    .forEach(
      (input) =>
        input.removeAttribute(
          "aria-invalid"
        )
    );
}

function addValidationStyles() {
  if (
    $("#fenyhub-validation-style")
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "fenyhub-validation-style";

  style.textContent = `
    .field-error {
      display: block;
      margin-top: 4px;
      color: #b91c1c;
      font-size: 0.82rem;
      font-weight: 600;
    }

    [aria-invalid="true"] {
      border-color: #dc2626 !important;
      outline-color: #fecaca !important;
    }
  `;

  document.head.appendChild(
    style
  );
}

/* =========================================================
   TAB MANAGEMENT
========================================================= */

const tabButtons =
  $$(".tab-btn");

const panels = {
  expense:
    $("#panel-expense"),

  bookmark:
    $("#panel-bookmark"),

  quiz:
    $("#panel-quiz")
};

function getTabFromUrl() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const tab =
    params.get("tab");

  if (
    VALID_TABS.includes(tab)
  ) {
    return tab;
  }

  return "expense";
}

function updateTabUI(tabName) {
  const activeTab =
    VALID_TABS.includes(tabName)
      ? tabName
      : "expense";

  Object.entries(
    panels
  ).forEach(
    ([name, panel]) => {
      if (!panel) return;

      const isActive =
        name === activeTab;

      panel.classList.toggle(
        "hidden",
        !isActive
      );

      panel.setAttribute(
        "aria-hidden",
        String(!isActive)
      );
    }
  );

  tabButtons.forEach(
    (button) => {
      const isActive =
        button.dataset.tab ===
        activeTab;

      button.classList.toggle(
        "active",
        isActive
      );

      button.setAttribute(
        "aria-selected",
        String(isActive)
      );

      button.setAttribute(
        "tabindex",
        isActive
          ? "0"
          : "-1"
      );
    }
  );
}

function setTab(
  tabName,
  historyMode = "push"
) {
  const activeTab =
    VALID_TABS.includes(
      tabName
    )
      ? tabName
      : "expense";

  updateTabUI(
    activeTab
  );

  const url =
    new URL(
      window.location.href
    );

  url.searchParams.set(
    "tab",
    activeTab
  );

  if (
    historyMode === "push"
  ) {
    window.history.pushState(
      {
        tab: activeTab
      },
      "",
      url
    );
  } else {
    window.history.replaceState(
      {
        tab: activeTab
      },
      "",
      url
    );
  }
}

tabButtons.forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        setTab(
          button.dataset.tab,
          "push"
        );
      }
    );
  }
);

window.addEventListener(
  "popstate",
  () => {
    updateTabUI(
      getTabFromUrl()
    );
  }
);

const initialTab =
  getTabFromUrl();

if (
  !new URLSearchParams(
    window.location.search
  ).has("tab")
) {
  setTab(
    initialTab,
    "replace"
  );
} else {
  updateTabUI(
    initialTab
  );
}

/* =========================================================
   MODAL MANAGEMENT
========================================================= */

function openModal(modal) {
  if (!modal) return;

  modal.classList.add(
    "open"
  );

  document.body.style.overflow =
    "hidden";

  const firstInput =
    modal.querySelector(
      "input:not([type='hidden']), select, textarea, button"
    );

  if (firstInput) {
    firstInput.focus();
  }
}

function closeModal(modal) {
  if (!modal) return;

  modal.classList.remove(
    "open"
  );

  if (
    !$(".modal.open")
  ) {
    document.body.style.overflow =
      "";
  }
}

$$(
  "[data-close-modal]"
).forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        const modalName =
          button.dataset
            .closeModal;

        if (
          modalName ===
          "expense"
        ) {
          closeModal(
            $("#expense-modal")
          );
        }

        if (
          modalName ===
          "bookmark"
        ) {
          closeModal(
            $("#bookmark-modal")
          );
        }

        if (
          modalName ===
          "delete"
        ) {
          closeModal(
            $("#delete-modal")
          );

          deleteTarget =
            null;
        }
      }
    );
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key !==
      "Escape"
    ) {
      return;
    }

    $$(".modal.open")
      .forEach(
        (modal) => {
          closeModal(
            modal
          );
        }
      );

    deleteTarget =
      null;
  }
);

/* =========================================================
   EXPENSE TRACKER
========================================================= */

const EXPENSE_KEY =
  "fenyhub_expenses";

let expenses =
  loadJSON(
    EXPENSE_KEY,
    []
  );

const expenseForm =
  $("#expense-form");

const expenseModal =
  $("#expense-modal");

const expenseModalTitle =
  $("#expense-modal-title");

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

function resetExpenseForm() {
  expenseForm.reset();

  clearFormErrors(
    expenseForm
  );

  expenseDateInput.value =
    todayISO();

  expenseTypeInput.value =
    "Pengeluaran";

  editingExpenseId =
    null;

  expenseModalTitle.textContent =
    "Tambah Transaksi";
}

function openExpenseCreate() {
  resetExpenseForm();

  openModal(
    expenseModal
  );
}

function openExpenseEdit(id) {
  const item =
    expenses.find(
      (expense) =>
        expense.id === id
    );

  if (!item) return;

  editingExpenseId =
    id;

  expenseModalTitle.textContent =
    "Ubah Transaksi";

  expenseTitleInput.value =
    item.title;

  expenseCategoryInput.value =
    item.category;

  expenseAmountInput.value =
    item.amount;

  expenseTypeInput.value =
    item.type;

  expenseDateInput.value =
    item.date;

  clearFormErrors(
    expenseForm
  );

  openModal(
    expenseModal
  );
}

function validateExpense() {
  clearFormErrors(
    expenseForm
  );

  if (
    !expenseTitleInput.value.trim()
  ) {
    return showFieldError(
      expenseTitleInput,
      "Judul transaksi wajib diisi."
    );
  }

  if (
    !expenseCategoryInput.value.trim()
  ) {
    return showFieldError(
      expenseCategoryInput,
      "Kategori wajib diisi."
    );
  }

  const amount =
    Number(
      expenseAmountInput.value
    );

  if (
    !Number.isFinite(
      amount
    ) ||
    amount <= 0
  ) {
    return showFieldError(
      expenseAmountInput,
      "Jumlah harus berupa angka lebih dari 0."
    );
  }

  if (
    !expenseDateInput.value
  ) {
    return showFieldError(
      expenseDateInput,
      "Tanggal wajib diisi."
    );
  }

  return true;
}

function renderExpenseSummary() {
  const income =
    expenses
      .filter(
        (item) =>
          item.type ===
          "Pemasukan"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount
          ),
        0
      );

  const expense =
    expenses
      .filter(
        (item) =>
          item.type ===
          "Pengeluaran"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount
          ),
        0
      );

  totalIncome.textContent =
    formatRupiah(
      income
    );

  totalExpense.textContent =
    formatRupiah(
      expense
    );

  totalBalance.textContent =
    formatRupiah(
      income - expense
    );
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

  const result =
    expenses.filter(
      (item) => {
        const title =
          item.title
            .toLowerCase();

        const category =
          item.category
            .toLowerCase();

        const matchesSearch =
          title.includes(
            query
          ) ||
          category.includes(
            query
          );

        const matchesType =
          type === "all" ||
          item.type === type;

        return (
          matchesSearch &&
          matchesType
        );
      }
    );

  result.sort(
    (a, b) => {
      if (
        sort ===
        "oldest"
      ) {
        return (
          new Date(
            a.date
          ) -
          new Date(
            b.date
          )
        );
      }

      if (
        sort ===
        "highest"
      ) {
        return (
          Number(
            b.amount
          ) -
          Number(
            a.amount
          )
        );
      }

      if (
        sort ===
        "lowest"
      ) {
        return (
          Number(
            a.amount
          ) -
          Number(
            b.amount
          )
        );
      }

      return (
        new Date(
          b.date
        ) -
        new Date(
          a.date
        )
      );
    }
  );

  return result;
}

function renderExpenses() {
  renderExpenseSummary();

  const items =
    getFilteredExpenses();

  expenseList.innerHTML =
    "";

  if (
    expenses.length ===
    0
  ) {
    expenseEmpty.classList.remove(
      "hidden"
    );

    return;
  }

  expenseEmpty.classList.toggle(
    "hidden",
    items.length !==
      0
  );

  if (
    items.length ===
    0
  ) {
    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "empty-state";

    empty.textContent =
      "Tidak ada transaksi yang cocok.";

    expenseList.appendChild(
      empty
    );

    return;
  }

  items.forEach(
    (item) => {
      const article =
        document.createElement(
          "article"
        );

      article.className =
        "item-card";

      const typeClass =
        item.type ===
        "Pemasukan"
          ? "badge-income"
          : "badge-expense";

      article.innerHTML = `
        <div class="item-card-header">

          <div>

            <div class="item-title">
              ${escapeHtml(
                item.title
              )}
            </div>

            <div class="item-meta">
              ${escapeHtml(
                item.category
              )}
              •
              ${escapeHtml(
                item.date
              )}
            </div>

            <span class="badge ${typeClass}">
              ${escapeHtml(
                item.type
              )}
            </span>

            <div
              class="item-title"
              style="margin-top: 8px;"
            >
              ${formatRupiah(
                item.amount
              )}
            </div>

          </div>

          <div class="item-actions">

            <button
              type="button"
              class="btn btn-secondary btn-small"
              data-expense-edit="${escapeHtml(
                item.id
              )}"
            >
              Ubah
            </button>

            <button
              type="button"
              class="btn btn-danger btn-small"
              data-expense-delete="${escapeHtml(
                item.id
              )}"
            >
              Hapus
            </button>

          </div>

        </div>
      `;

      expenseList.appendChild(
        article
      );
    }
  );
}

expenseForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    if (
      !validateExpense()
    ) {
      return;
    }

    const data = {
      title:
        expenseTitleInput.value.trim(),

      category:
        expenseCategoryInput.value.trim(),

      amount:
        Number(
          expenseAmountInput.value
        ),

      type:
        expenseTypeInput.value,

      date:
        expenseDateInput.value
    };

    if (
      editingExpenseId
    ) {
      const index =
        expenses.findIndex(
          (item) =>
            item.id ===
            editingExpenseId
        );

      if (
        index !== -1
      ) {
        expenses[index] = {
          ...expenses[index],
          ...data
        };
      }
    } else {
      expenses.push({
        id: createId(
          "expense"
        ),
        ...data,
        createdAt:
          Date.now()
      });
    }

    saveJSON(
      EXPENSE_KEY,
      expenses
    );

    renderExpenses();

    resetExpenseForm();

    closeModal(
      expenseModal
    );
  }
);

$("#add-expense-btn")
  .addEventListener(
    "click",
    openExpenseCreate
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

expenseList.addEventListener(
  "click",
  (event) => {
    const editButton =
      event.target.closest(
        "[data-expense-edit]"
      );

    const deleteButton =
      event.target.closest(
        "[data-expense-delete]"
      );

    if (
      editButton
    ) {
      openExpenseEdit(
        editButton.dataset
          .expenseEdit
      );

      return;
    }

    if (
      deleteButton
    ) {
      openDeleteConfirmation(
        "expense",
        deleteButton.dataset
          .expenseDelete
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
  loadJSON(
    BOOKMARK_KEY,
    []
  );

const bookmarkForm =
  $("#bookmark-form");

const bookmarkModal =
  $("#bookmark-modal");

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

function resetBookmarkForm() {
  bookmarkForm.reset();

  clearFormErrors(
    bookmarkForm
  );

  editingBookmarkId =
    null;

  bookmarkModalTitle.textContent =
    "Tambah Bookmark";
}

function openBookmarkCreate() {
  resetBookmarkForm();

  openModal(
    bookmarkModal
  );
}

function openBookmarkEdit(id) {
  const item =
    bookmarks.find(
      (bookmark) =>
        bookmark.id === id
    );

  if (!item) return;

  editingBookmarkId =
    id;

  bookmarkModalTitle.textContent =
    "Ubah Bookmark";

  bookmarkTitleInput.value =
    item.title;

  bookmarkUrlInput.value =
    item.url;

  bookmarkCategoryInput.value =
    item.category;

  bookmarkNoteInput.value =
    item.note || "";

  clearFormErrors(
    bookmarkForm
  );

  openModal(
    bookmarkModal
  );
}

function isHttpUrl(value) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

function validateBookmark() {
  clearFormErrors(
    bookmarkForm
  );

  if (
    !bookmarkTitleInput.value.trim()
  ) {
    return showFieldError(
      bookmarkTitleInput,
      "Judul bookmark wajib diisi."
    );
  }

  const url =
    bookmarkUrlInput.value.trim();

  if (!url) {
    return showFieldError(
      bookmarkUrlInput,
      "URL wajib diisi."
    );
  }

  if (
    !isHttpUrl(url)
  ) {
    return showFieldError(
      bookmarkUrlInput,
      "URL harus menggunakan http:// atau https://."
    );
  }

  if (
    !bookmarkCategoryInput.value.trim()
  ) {
    return showFieldError(
      bookmarkCategoryInput,
      "Kategori wajib diisi."
    );
  }

  return true;
}

function renderBookmarkCategories() {
  const current =
    bookmarkCategoryFilter.value;

  const categories =
    [
      ...new Set(
        bookmarks
          .map(
            (item) =>
              item.category.trim()
          )
          .filter(Boolean)
      )
    ].sort(
      (a, b) =>
        a.localeCompare(
          b,
          "id"
        )
    );

  bookmarkCategoryFilter.innerHTML =
    `
      <option value="all">
        Semua kategori
      </option>
    `;

  categories.forEach(
    (category) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        category;

      option.textContent =
        category;

      bookmarkCategoryFilter.appendChild(
        option
      );
    }
  );

  if (
    current === "all" ||
    categories.includes(
      current
    )
  ) {
    bookmarkCategoryFilter.value =
      current;
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
        const text = [
          item.title,
          item.url,
          item.category,
          item.note || ""
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          text.includes(
            query
          );

        const matchesCategory =
          category ===
            "all" ||
          item.category ===
            category;

        return (
          matchesSearch &&
          matchesCategory
        );
      }
    );

  result.sort(
    (a, b) => {
      if (
        sort === "az"
      ) {
        return a.title.localeCompare(
          b.title,
          "id"
        );
      }

      if (
        sort === "za"
      ) {
        return b.title.localeCompare(
          a.title,
          "id"
        );
      }

      return (
        Number(
          b.createdAt
        ) -
        Number(
          a.createdAt
        )
      );
    }
  );

  return result;
}

function renderBookmarks() {
  renderBookmarkCategories();

  const items =
    getFilteredBookmarks();

  bookmarkList.innerHTML =
    "";

  if (
    bookmarks.length ===
    0
  ) {
    bookmarkEmpty.classList.remove(
      "hidden"
    );

    return;
  }

  bookmarkEmpty.classList.toggle(
    "hidden",
    items.length !==
      0
  );

  if (
    items.length ===
    0
  ) {
    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "empty-state";

    empty.textContent =
      "Tidak ada bookmark yang cocok.";

    bookmarkList.appendChild(
      empty
    );

    return;
  }

  items.forEach(
    (item) => {
      const article =
        document.createElement(
          "article"
        );

      article.className =
        "item-card";

      article.innerHTML = `
        <div class="item-card-header">

          <div>

            <div class="item-title">
              ${escapeHtml(
                item.title
              )}
            </div>

            <a
              class="bookmark-url"
              href="${escapeHtml(
                item.url
              )}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${escapeHtml(
                item.url
              )}
            </a>

            <span class="badge badge-category">
              ${escapeHtml(
                item.category
              )}
            </span>

            ${
              item.note
                ? `
                  <p class="bookmark-note">
                    ${escapeHtml(
                      item.note
                    )}
                  </p>
                `
                : ""
            }

          </div>

          <div class="item-actions">

            <button
              type="button"
              class="btn btn-secondary btn-small"
              data-bookmark-edit="${escapeHtml(
                item.id
              )}"
            >
              Ubah
            </button>

            <button
              type="button"
              class="btn btn-danger btn-small"
              data-bookmark-delete="${escapeHtml(
                item.id
              )}"
            >
              Hapus
            </button>

          </div>

        </div>
      `;

      bookmarkList.appendChild(
        article
      );
    }
  );
}

bookmarkForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    if (
      !validateBookmark()
    ) {
      return;
    }

    const data = {
      title:
        bookmarkTitleInput.value.trim(),

      url:
        bookmarkUrlInput.value.trim(),

      category:
        bookmarkCategoryInput.value.trim(),

      note:
        bookmarkNoteInput.value.trim()
    };

    if (
      editingBookmarkId
    ) {
      const index =
        bookmarks.findIndex(
          (item) =>
            item.id ===
            editingBookmarkId
        );

      if (
        index !== -1
      ) {
        bookmarks[index] = {
          ...bookmarks[index],
          ...data
        };
      }
    } else {
      bookmarks.push({
        id: createId(
          "bookmark"
        ),
        ...data,
        createdAt:
          Date.now()
      });
    }

    saveJSON(
      BOOKMARK_KEY,
      bookmarks
    );

    renderBookmarks();

    resetBookmarkForm();

    closeModal(
      bookmarkModal
    );
  }
);

$("#add-bookmark-btn")
  .addEventListener(
    "click",
    openBookmarkCreate
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

bookmarkList.addEventListener(
  "click",
  (event) => {
    const editButton =
      event.target.closest(
        "[data-bookmark-edit]"
      );

    const deleteButton =
      event.target.closest(
        "[data-bookmark-delete]"
      );

    if (
      editButton
    ) {
      openBookmarkEdit(
        editButton.dataset
          .bookmarkEdit
      );

      return;
    }

    if (
      deleteButton
    ) {
      openDeleteConfirmation(
        "bookmark",
        deleteButton.dataset
          .bookmarkDelete
      );
    }
  }
);

/* =========================================================
   DELETE CONFIRMATION
========================================================= */

const deleteModal =
  $("#delete-modal");

const deleteMessage =
  $("#delete-message");

const deleteConfirmButton =
  $("#delete-confirm-btn");

function openDeleteConfirmation(
  type,
  id
) {
  const collection =
    type === "expense"
      ? expenses
      : bookmarks;

  const item =
    collection.find(
      (entry) =>
        entry.id === id
    );

  if (!item) {
    return;
  }

  deleteTarget = {
    type,
    id
  };

  deleteMessage.textContent =
    `Yakin ingin menghapus "${item.title}"?`;

  openModal(
    deleteModal
  );
}

deleteConfirmButton.addEventListener(
  "click",
  () => {
    if (!deleteTarget) {
      return;
    }

    if (
      deleteTarget.type ===
      "expense"
    ) {
      expenses =
        expenses.filter(
          (item) =>
            item.id !==
            deleteTarget.id
        );

      saveJSON(
        EXPENSE_KEY,
        expenses
      );

      renderExpenses();
    }

    if (
      deleteTarget.type ===
      "bookmark"
    ) {
      bookmarks =
        bookmarks.filter(
          (item) =>
            item.id !==
            deleteTarget.id
        );

      saveJSON(
        BOOKMARK_KEY,
        bookmarks
      );

      renderBookmarks();
    }

    deleteTarget =
      null;

    closeModal(
      deleteModal
    );
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
      "Apa fungsi HTML dalam pengembangan web?",

    options: [
      "Menyusun struktur halaman",
      "Mengatur database",
      "Mengompresi gambar",
      "Menjalankan server"
    ],

    answer: 0
  },

  {
    question:
      "Apa fungsi utama CSS?",

    options: [
      "Menyimpan data",
      "Mengatur tampilan halaman",
      "Membuat database",
      "Mengirim request API"
    ],

    answer: 1
  },

  {
    question:
      "Bahasa yang digunakan untuk membuat halaman web menjadi interaktif adalah...",

    options: [
      "SQL",
      "HTML",
      "JavaScript",
      "CSS"
    ],

    answer: 2
  },

  {
    question:
      "Method DOM yang digunakan untuk mencari elemen berdasarkan id adalah...",

    options: [
      "getElementById()",
      "getClass()",
      "findElement()",
      "selectId()"
    ],

    answer: 0
  },

  {
    question:
      "Manakah yang digunakan untuk menyimpan data di browser?",

    options: [
      "localStorage",
      "console.log",
      "querySelector",
      "addEventListener"
    ],

    answer: 0
  },

  {
    question:
      "Event yang terjadi ketika tombol ditekan adalah...",

    options: [
      "hover",
      "submit",
      "click",
      "load"
    ],

    answer: 2
  }
];

let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

const quizStart =
  $("#quiz-start");

const quizQuestionArea =
  $("#quiz-question-area");

const quizQuestion =
  $("#quiz-question");

const quizProgress =
  $("#quiz-progress");

const quizOptions =
  $("#quiz-options");

const quizFeedback =
  $("#quiz-feedback");

const nextQuestionButton =
  $("#next-question-btn");

const quizResult =
  $("#quiz-result");

const quizResultScore =
  $("#quiz-result-score");

const quizResultMessage =
  $("#quiz-result-message");

const highScoreElement =
  $("#high-score");

function getHighScore() {
  const value =
    Number(
      localStorage.getItem(
        QUIZ_HIGH_SCORE_KEY
      )
    );

  return Number.isFinite(
    value
  )
    ? value
    : 0;
}

function updateHighScore() {
  highScoreElement.textContent =
    String(
      getHighScore()
    );
}

function resetQuizFeedback() {
  quizFeedback.classList.remove(
    "feedback-correct",
    "feedback-wrong"
  );

  quizFeedback.classList.add(
    "hidden"
  );

  quizFeedback.textContent =
    "";
}

function resetQuizUI() {
  quizStart.classList.remove(
    "hidden"
  );

  quizQuestionArea.classList.add(
    "hidden"
  );

  quizResult.classList.add(
    "hidden"
  );

  resetQuizFeedback();

  nextQuestionButton.classList.add(
    "hidden"
  );

  quizOptions.innerHTML =
    "";
}

function startQuiz() {
  quizIndex = 0;
  quizScore = 0;
  quizAnswered =
    false;

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
  const current =
    quizQuestions[
      quizIndex
    ];

  quizAnswered =
    false;

  quizProgress.textContent =
    `Soal ${
      quizIndex + 1
    } dari ${
      quizQuestions.length
    }`;

  quizQuestion.textContent =
    current.question;

  quizOptions.innerHTML =
    "";

  resetQuizFeedback();

  nextQuestionButton.classList.add(
    "hidden"
  );

  current.options.forEach(
    (option, index) => {
      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "quiz-option";

      button.textContent =
        option;

      button.dataset.answerIndex =
        String(index);

      quizOptions.appendChild(
        button
      );
    }
  );
}

function showQuizFeedback(
  selectedIndex
) {
  if (
    quizAnswered
  ) {
    return;
  }

  quizAnswered =
    true;

  const current =
    quizQuestions[
      quizIndex
    ];

  const options =
    $$(".quiz-option");

  options.forEach(
    (button, index) => {
      button.disabled =
        true;

      if (
        index ===
        current.answer
      ) {
        button.classList.add(
          "correct"
        );
      }

      if (
        index ===
          selectedIndex &&
        selectedIndex !==
          current.answer
      ) {
        button.classList.add(
          "wrong"
        );
      }
    }
  );

  resetQuizFeedback();

  quizFeedback.classList.remove(
    "hidden"
  );

  if (
    selectedIndex ===
    current.answer
  ) {
    quizScore += 1;

    quizFeedback.classList.add(
      "feedback-correct"
    );

    quizFeedback.textContent =
      "Benar! Jawaban kamu tepat.";
  } else {
    quizFeedback.classList.add(
      "feedback-wrong"
    );

    quizFeedback.textContent =
      `Kurang tepat. Jawaban yang benar adalah "${current.options[current.answer]}".`;
  }

  nextQuestionButton.classList.remove(
    "hidden"
  );
}

function finishQuiz() {
  quizQuestionArea.classList.add(
    "hidden"
  );

  quizResult.classList.remove(
    "hidden"
  );

  quizResultScore.textContent =
    `${quizScore} / ${quizQuestions.length}`;

  const previousHighScore =
    getHighScore();

  if (
    quizScore >
    previousHighScore
  ) {
    localStorage.setItem(
      QUIZ_HIGH_SCORE_KEY,
      String(quizScore)
    );

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
      "Kuis selesai. Coba lagi untuk meningkatkan skor.";
  }

  updateHighScore();
}

quizOptions.addEventListener(
  "click",
  (event) => {
    const button =
      event.target.closest(
        ".quiz-option"
      );

    if (!button) {
      return;
    }

    showQuizFeedback(
      Number(
        button.dataset
          .answerIndex
      )
    );
  }
);

nextQuestionButton.addEventListener(
  "click",
  () => {
    if (
      !quizAnswered
    ) {
      return;
    }

    quizIndex += 1;

    if (
      quizIndex >=
      quizQuestions.length
    ) {
      finishQuiz();
      return;
    }

    renderQuizQuestion();
  }
);

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

/* =========================================================
   INITIALIZATION
========================================================= */

addValidationStyles();

if (expenseDateInput) {
  expenseDateInput.value =
    todayISO();
}

renderExpenses();

renderBookmarks();

updateHighScore();

resetQuizUI();