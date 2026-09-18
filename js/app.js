// ============================================================
// Expense & Budget Visualizer — app.js
// Single-file Vanilla JS application (ES Module)
// No framework, no bundler, no backend (Req 6.3, 6.4)
// ============================================================

// === STORAGE ===
// StorageManager: handles all localStorage read/write operations.
// Keys: STORAGE_KEY_TRANSACTIONS, STORAGE_KEY_THEME, STORAGE_KEY_THRESHOLD
// Functions: isAvailable(), save(key, data), load(key)

const STORAGE_KEY_TRANSACTIONS = 'ebv_transactions';
const STORAGE_KEY_THEME        = 'ebv_theme';
const STORAGE_KEY_THRESHOLD    = 'ebv_threshold';

/** Custom error for corrupt/unparseable storage data (Req 2.6) */
class StorageParseError extends Error {
  constructor(key) {
    super(`Data di storage key "${key}" tidak dapat diurai (corrupt atau format tidak valid).`);
    this.name = 'StorageParseError';
    this.key  = key;
  }
}

const StorageManager = {
  /**
   * Detect whether localStorage is available in this browser/context.
   * Uses a test setItem/removeItem round-trip so it also covers
   * browsers that expose the API but throw on access (e.g. private mode).
   * @returns {boolean}
   */
  isAvailable() {
    try {
      const testKey = '__ebv_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (_e) {
      return false;
    }
  },

  /**
   * Serialize `data` to JSON and persist it under `key`.
   * Throws a plain Error (re-thrown from DOMException) so callers
   * can display: "Data tidak dapat disimpan secara persisten." (Req 2.4)
   * @param {string} key
   * @param {*} data
   */
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      // DOMException covers QuotaExceededError and SecurityError
      const message = 'Data tidak dapat disimpan secara persisten.';
      const wrapped = new Error(message);
      wrapped.original = err;
      throw wrapped;
    }
  },

  /**
   * Read and JSON-parse the value stored under `key`.
   * Returns `null` when the key is absent.
   * Throws `StorageParseError` (after removing the corrupt key) when
   * the stored value cannot be parsed, so callers can display:
   * "Data sebelumnya tidak dapat dimuat." (Req 2.6)
   * @param {string} key
   * @returns {*|null}
   */
  load(key) {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch (_e) {
      // Remove the corrupt entry so it doesn't block future loads
      try { localStorage.removeItem(key); } catch (_) { /* ignore */ }
      throw new StorageParseError(key);
    }
  },
};


// === VALIDATOR ===
// Validator: pure validation functions with no side effects.
// Functions: validateNamaItem(value), validateJumlah(value),
//            validateKategori(value), validateThreshold(value),
//            validateTransactionData(data)

const VALID_CATEGORIES = ['Makanan', 'Transportasi', 'Hiburan'];
const JUMLAH_MIN = 1;
const JUMLAH_MAX = 999_999_999;
const THRESHOLD_MIN = 0;
const THRESHOLD_MAX = 999_999_999;
const NAMA_ITEM_MAX_LENGTH = 100;

const Validator = {
  /**
   * Validate `namaItem` field.
   * Rules (Req 1.2, 1.3):
   *  - Required: must not be empty or whitespace-only after trim
   *  - Maximum 100 characters (trimmed)
   * @param {string} value
   * @returns {{ valid: boolean, error: string }}
   */
  validateNamaItem(value) {
    const trimmed = (typeof value === 'string') ? value.trim() : '';
    if (trimmed.length === 0) {
      return { valid: false, error: 'Nama item wajib diisi.' };
    }
    if (trimmed.length > NAMA_ITEM_MAX_LENGTH) {
      return { valid: false, error: `Nama item maksimal ${NAMA_ITEM_MAX_LENGTH} karakter.` };
    }
    return { valid: true, error: '' };
  },

  /**
   * Validate `jumlah` field.
   * Rules (Req 1.4):
   *  - Required: must not be empty
   *  - Must be a positive integer in the range [1, 999.999.999]
   *  - Non-numeric strings are rejected
   * @param {string|number} value
   * @returns {{ valid: boolean, error: string }}
   */
  validateJumlah(value) {
    const errorMsg = `Jumlah harus berupa angka antara Rp 1 dan Rp 999.999.999.`;

    if (value === '' || value === null || value === undefined) {
      return { valid: false, error: 'Jumlah wajib diisi.' };
    }

    // Reject strings that aren't purely numeric (no signs, no decimals)
    if (typeof value === 'string') {
      if (!/^\d+$/.test(value.trim())) {
        return { valid: false, error: errorMsg };
      }
    }

    const num = Number(value);

    // Reject NaN, Infinity, floats (non-integer), and out-of-range values
    if (
      !Number.isFinite(num) ||
      !Number.isInteger(num) ||
      num < JUMLAH_MIN ||
      num > JUMLAH_MAX
    ) {
      return { valid: false, error: errorMsg };
    }

    return { valid: true, error: '' };
  },

  /**
   * Validate `kategori` field.
   * Rules (Req 1.2, 1.3):
   *  - Required: must not be empty
   *  - Must be one of ['Makanan', 'Transportasi', 'Hiburan']
   * @param {string} value
   * @returns {{ valid: boolean, error: string }}
   */
  validateKategori(value) {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      return { valid: false, error: 'Kategori wajib dipilih.' };
    }
    if (!VALID_CATEGORIES.includes(value)) {
      return { valid: false, error: 'Kategori tidak valid. Pilih Makanan, Transportasi, atau Hiburan.' };
    }
    return { valid: true, error: '' };
  },

  /**
   * Validate `threshold` input.
   * Rules (Req 9.3):
   *  - Must be a non-negative integer in the range [0, 999.999.999]
   *  - Non-numeric strings are rejected
   * @param {string|number} value
   * @returns {{ valid: boolean, error: string }}
   */
  validateThreshold(value) {
    const errorMsg = `Nilai batas harus berupa angka antara Rp 0 dan Rp 999.999.999.`;

    if (value === '' || value === null || value === undefined) {
      return { valid: false, error: errorMsg };
    }

    // Reject non-numeric strings
    if (typeof value === 'string') {
      if (!/^\d+$/.test(value.trim())) {
        return { valid: false, error: errorMsg };
      }
    }

    const num = Number(value);

    if (
      !Number.isFinite(num) ||
      !Number.isInteger(num) ||
      num < THRESHOLD_MIN ||
      num > THRESHOLD_MAX
    ) {
      return { valid: false, error: errorMsg };
    }

    return { valid: true, error: '' };
  },

  /**
   * Validate all fields of a transaction input object.
   * Returns a combined result with per-field errors.
   * @param {{ namaItem: string, jumlah: string|number, kategori: string }} data
   * @returns {{ valid: boolean, errors: { namaItem?: string, jumlah?: string, kategori?: string } }}
   */
  validateTransactionData(data) {
    const errors = {};

    const namaResult = Validator.validateNamaItem(data.namaItem);
    if (!namaResult.valid) errors.namaItem = namaResult.error;

    const jumlahResult = Validator.validateJumlah(data.jumlah);
    if (!jumlahResult.valid) errors.jumlah = jumlahResult.error;

    const kategoriResult = Validator.validateKategori(data.kategori);
    if (!kategoriResult.valid) errors.kategori = kategoriResult.error;

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  },
};


// === FORMATTER ===
// Formatter: number-to-Rupiah formatting utilities.
// Functions: toRupiah(amount)

const Formatter = {
  /**
   * Format an integer `amount` as an Indonesian Rupiah string.
   *
   * Rules (Req 3.1, 4.4):
   *  - Output MUST start with "Rp " (space after Rp)
   *  - Dot "." as thousands separator
   *  - No decimal places, no comma
   *
   * Examples:
   *   toRupiah(0)         → "Rp 0"
   *   toRupiah(150000)    → "Rp 150.000"
   *   toRupiah(999999999) → "Rp 999.999.999"
   *
   * Primary implementation uses Intl.NumberFormat with locale id-ID
   * (which natively uses dot as thousands separator).
   * Falls back to manual string replacement when Intl is unavailable.
   *
   * @param {number} amount - Non-negative integer
   * @returns {string}
   */
  toRupiah(amount) {
    const n = Math.floor(amount); // guard against floats

    if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
      // id-ID locale uses dot as thousands separator, comma as decimal — but
      // maximumFractionDigits: 0 removes the decimal part entirely.
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'decimal',
        maximumFractionDigits: 0,
      }).format(n);
      return `Rp ${formatted}`;
    }

    // Fallback: manual dot-separated formatting
    const str = String(n);
    const withDots = str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp ${withDots}`;
  },
};


// === STATE ===
// StateManager: in-memory single source of truth for transactions.
// Functions: getTransactions(), addTransaction(data), deleteTransaction(id),
//            getTotal(), getByCategory(), getByMonth(),
//            loadFromStorage(), persistToStorage()
// Utilities: generateId()

/**
 * Generate a unique ID for a transaction.
 * Uses timestamp + random suffix — sufficient for single-user client-side use.
 * @returns {string}
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const StateManager = (() => {
  /** @type {import('./app.js').Transaction[]} */
  let _transactions = [];

  return {
    /**
     * Return a shallow copy of the internal transactions array.
     * Prevents callers from directly mutating the state.
     * @returns {Transaction[]}
     */
    getTransactions() {
      return [..._transactions];
    },

    /**
     * Create a new Transaction from input data, append it to the list,
     * persist to storage, and return the created transaction.
     * @param {{ namaItem: string, jumlah: number, kategori: string }} data
     * @returns {Transaction}
     */
    addTransaction(data) {
      /** @type {Transaction} */
      const transaction = {
        id:       generateId(),
        namaItem: data.namaItem,
        jumlah:   Number(data.jumlah),
        kategori: data.kategori,
        tanggal:  new Date().toISOString(),
      };
      _transactions.push(transaction);
      StateManager.persistToStorage(); // may throw — caller shows notification
      return transaction;
    },

    /**
     * Remove the transaction with the given `id` from the list and persist.
     * If `id` does not exist, the list is unchanged (no error thrown).
     * @param {string} id
     */
    deleteTransaction(id) {
      _transactions = _transactions.filter(t => t.id !== id);
      StateManager.persistToStorage(); // may throw — caller shows notification
    },

    /**
     * Return the sum of all `jumlah` values.
     * Returns 0 for an empty list (Req 4.5).
     * @returns {number}
     */
    getTotal() {
      return _transactions.reduce((sum, t) => sum + t.jumlah, 0);
    },

    /**
     * Return a plain object mapping each kategori to its total jumlah.
     * Only includes categories with a total > 0 (Req 5.1).
     * @returns {{ [kategori: string]: number }}
     */
    getByCategory() {
      /** @type {{ [key: string]: number }} */
      const result = {};
      for (const t of _transactions) {
        result[t.kategori] = (result[t.kategori] || 0) + t.jumlah;
      }
      // Exclude zero-total entries (shouldn't occur with positive jumlah, but be explicit)
      for (const key of Object.keys(result)) {
        if (result[key] <= 0) delete result[key];
      }
      return result;
    },

    /**
     * Return a plain object mapping `YYYY-MM` keys to total jumlah,
     * including only months that have at least one transaction,
     * sorted newest-first (descending key order) (Req 7.1, 7.3).
     * @returns {{ [yearMonth: string]: number }}
     */
    getByMonth() {
      /** @type {{ [key: string]: number }} */
      const raw = {};
      for (const t of _transactions) {
        const key = t.tanggal.slice(0, 7); // "YYYY-MM"
        raw[key] = (raw[key] || 0) + t.jumlah;
      }
      // Sort entries newest-first (descending string compare works for YYYY-MM)
      const sortedEntries = Object.entries(raw).sort((a, b) => b[0].localeCompare(a[0]));
      return Object.fromEntries(sortedEntries);
    },

    /**
     * Load transactions from Local Storage into memory.
     * - If no data found, initialises with an empty array.
     * - If data is not an array, falls back to empty array.
     * - Re-throws `StorageParseError` so the INIT caller can notify the user
     *   ("Data sebelumnya tidak dapat dimuat." — Req 2.6).
     */
    loadFromStorage() {
      // StorageParseError is intentionally not caught here — propagate to caller
      const data = StorageManager.load(STORAGE_KEY_TRANSACTIONS);
      if (data === null) {
        _transactions = [];
      } else if (Array.isArray(data)) {
        _transactions = data;
      } else {
        // Unexpected format — treat as empty (defensive fallback)
        _transactions = [];
      }
    },

    /**
     * Persist the current transactions array to Local Storage.
     * Re-throws any error from `StorageManager.save` so the caller
     * (addTransaction / deleteTransaction) can show a notification
     * ("Data tidak dapat disimpan secara persisten." — Req 2.4).
     */
    persistToStorage() {
      // Errors from save() are intentionally not caught here — propagate to caller
      StorageManager.save(STORAGE_KEY_TRANSACTIONS, _transactions);
    },
  };
})();


// === UI ===
// UI Renderer: DOM manipulation functions to sync UI with state.
// Functions: renderTransactionList(transactions), renderEmptyState(),
//            renderTotalSaldo(total), renderChart(byCategory),
//            renderMonthlySummary(byMonth),
//            showNotification(message, type, duration),
//            showFieldError(fieldId, message), clearFieldErrors()

/**
 * Update the Total Saldo display element with the formatted total.
 *
 * - Displays the accumulated sum of all transaction jumlah (Req 4.1)
 * - Formatted as "Rp X.XXX" with dot thousands separators (Req 4.4)
 * - Shows "Rp 0" when there are no transactions (Req 4.5)
 *
 * @param {number} total - Non-negative integer representing total expenditure
 */
function renderTotalSaldo(total) {
  const el = document.getElementById('total-saldo');
  if (!el) return;
  el.textContent = Formatter.toRupiah(total);
}

/**
 * Render the empty-state placeholder inside the transaction list container.
 * Displayed when there are no transactions (Req 3.5).
 */
function renderEmptyState() {
  const container = document.getElementById('transaction-list-container');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state" role="status">
      <span class="empty-state-icon" aria-hidden="true">📭</span>
      Belum ada transaksi. Tambahkan pengeluaran pertama Anda!
    </div>
  `;
}

/**
 * Render the full list of transactions into the scrollable container (Req 3.1, 3.2).
 * Each row shows namaItem, jumlah (formatted as Rupiah), kategori, and a delete button.
 * Falls back to `renderEmptyState()` when the array is empty (Req 3.5).
 *
 * @param {Array<{ id: string, namaItem: string, jumlah: number, kategori: string, tanggal: string }>} transactions
 */
function renderTransactionList(transactions) {
  const container = document.getElementById('transaction-list-container');
  if (!container) return;

  if (!transactions || transactions.length === 0) {
    renderEmptyState();
    return;
  }

  // Build all item HTML in one pass to minimise reflows (Req 3.4 / 6.5)
  const itemsHTML = transactions.map(t => {
    // Escape user-supplied text to prevent XSS
    const safeName = escapeHTML(t.namaItem);
    const safeKategori = escapeHTML(t.kategori);
    const formattedAmount = Formatter.toRupiah(t.jumlah);

    // Threshold highlight (Req 9.1, 9.4) — a threshold of 0 means the
    // feature is disabled, so no row is ever marked in that case.
    const threshold = getCurrentThreshold();
    const isOverThreshold = threshold > 0 && t.jumlah > threshold;
    const rowClass = isOverThreshold ? 'transaction-item over-threshold' : 'transaction-item';

    return `
      <div class="${rowClass}" role="listitem" data-id="${t.id}">
        <div class="transaction-info">
          <div class="transaction-name" title="${safeName}">${safeName}</div>
          <div class="transaction-meta">
            <span class="transaction-amount">${formattedAmount}</span>
            <span class="transaction-kategori">${safeKategori}</span>
          </div>
        </div>
        <div class="transaction-delete">
          <button
            class="btn btn-danger"
            data-id="${t.id}"
            aria-label="Hapus transaksi ${safeName}"
            title="Hapus transaksi"
          >Hapus</button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = itemsHTML;
}

/**
 * Escape a string for safe insertion as HTML text content.
 * Prevents XSS when displaying user-entered values.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Display a toast notification in the bottom-right corner of the screen.
 *
 * The toast slides in via CSS animation, stays for `duration` ms, then slides
 * out before being removed from the DOM.  Each toast is appended to
 * `#toast-container` (defined in index.html with aria-live="polite").
 *
 * Requirements: 2.4 (storage write error, visible ≥ 3 s), 2.6 (corrupt data)
 *
 * @param {string} message   - Human-readable text shown inside the toast.
 * @param {'success'|'error'} [type='success'] - Visual style variant.
 * @param {number} [duration=3000] - Milliseconds the toast stays visible.
 */
function showNotification(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return; // guard: container missing in test environments

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  // Keep role="status" so screen readers announce it even without aria-live on
  // the individual toast (the container already has aria-live="polite").
  toast.setAttribute('role', 'status');

  container.appendChild(toast);

  // Auto-dismiss: apply exit animation then remove from DOM
  const dismiss = () => {
    // Add exit class to trigger CSS slide-out animation
    toast.classList.add('toast-exit');

    // Wait for the animation to finish (~250 ms as defined in style.css)
    toast.addEventListener('animationend', () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, { once: true });
  };

  // Schedule dismissal after `duration` ms
  const timerId = setTimeout(dismiss, duration);

  // Allow clicking the toast to dismiss it early
  toast.addEventListener('click', () => {
    clearTimeout(timerId);
    dismiss();
  }, { once: true });
}

/**
 * Display an inline error message below the form field identified by `fieldId`.
 *
 * Looks for a sibling `<span id="error-{fieldId}">` element (already present in
 * index.html for each form group) and populates it with `message`.  Also marks
 * the input/select itself with the `.is-invalid` CSS class.
 *
 * Requirements: 1.3 (field-specific error under the problematic field),
 *               1.4 (error for invalid jumlah)
 *
 * @param {string} fieldId - The `id` attribute of the input/select element.
 * @param {string} message - The error text to display.
 */
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`error-${fieldId}`);

  if (field) {
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
  }

  if (errorEl) {
    errorEl.textContent = message;
  }
}

/**
 * Remove all inline error messages and invalid styling from the transaction form.
 *
 * Iterates over every `.field-error` span inside `#form-transaksi` and clears
 * its text content; also strips the `.is-invalid` class and `aria-invalid`
 * attribute from each associated input/select.
 *
 * Called before re-validating on submit, and after a successful submission.
 *
 * Requirements: 1.3, 1.4
 */
function clearFieldErrors() {
  const form = document.getElementById('form-transaksi');
  if (!form) return;

  // Clear every error span in the form
  const errorSpans = form.querySelectorAll('.field-error');
  errorSpans.forEach(span => {
    span.textContent = '';
  });

  // Strip invalid state from every input/select in the form
  const inputs = form.querySelectorAll('.form-input');
  inputs.forEach(input => {
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
  });
}


// Module-level reference to the active Chart.js instance.
// Kept here so renderChart can destroy the old chart before creating a new one.
let _chartInstance = null;

/** Fixed color palette per category — order-independent (Req 5.2) */
const CATEGORY_COLORS = {
  'Makanan':      '#FF6384',
  'Transportasi': '#36A2EB',
  'Hiburan':      '#FFCE56',
};

/**
 * Render or update the pie chart that shows spending distribution per category.
 *
 * Behaviour:
 *  - Empty `byCategory`: destroys any existing Chart instance, hides the canvas,
 *    shows the `#chart-placeholder` element (Req 5.5).
 *  - `window.Chart` not available (CDN failed to load): shows fallback text inside
 *    `#chart-container` (Req 5.6).
 *  - Valid data: hides placeholder, shows canvas, destroys old instance if exists,
 *    creates a fresh Chart.js pie chart (Req 5.1–5.4).
 *
 * @param {{ [kategori: string]: number }} byCategory - Map from category name to
 *   total expenditure. Only categories with total > 0 are expected (see getByCategory).
 */
function renderChart(byCategory) {
  const canvas      = document.getElementById('chart-pengeluaran');
  const placeholder = document.getElementById('chart-placeholder');
  const container   = document.getElementById('chart-container');

  if (!canvas || !placeholder || !container) return;

  // --- Guard: Chart.js CDN not loaded (Req 5.6) ---
  if (typeof window.Chart === 'undefined') {
    // Destroy stale instance reference if any
    _chartInstance = null;
    // Hide canvas, hide normal placeholder, show fallback text
    canvas.hidden = true;
    placeholder.hidden = true;
    // Check if a fallback paragraph already exists to avoid duplicates
    let fallback = container.querySelector('.chart-cdn-fallback');
    if (!fallback) {
      fallback = document.createElement('p');
      fallback.className = 'chart-placeholder chart-cdn-fallback';
      fallback.textContent = 'Grafik tidak dapat ditampilkan (library Chart.js tidak termuat).';
      container.appendChild(fallback);
    }
    return;
  }

  // Remove any CDN-fallback message that may have been shown earlier
  const existingFallback = container.querySelector('.chart-cdn-fallback');
  if (existingFallback) existingFallback.remove();

  const labels = Object.keys(byCategory);
  const isEmpty = labels.length === 0;

  // --- Empty data: destroy chart and show placeholder (Req 5.5) ---
  if (isEmpty) {
    if (_chartInstance) {
      _chartInstance.destroy();
      _chartInstance = null;
    }
    canvas.hidden = true;
    placeholder.hidden = false;
    return;
  }

  // --- Valid data: show canvas, hide placeholder ---
  canvas.hidden = false;
  placeholder.hidden = true;

  // Destroy the previous chart instance before creating a new one.
  // Skipping this causes Chart.js to warn about "Canvas is already in use".
  if (_chartInstance) {
    _chartInstance.destroy();
    _chartInstance = null;
  }

  // Build color arrays that follow the fixed palette regardless of key order (Req 5.2)
  const data   = labels.map(label => byCategory[label]);
  const colors = labels.map(label => CATEGORY_COLORS[label] || '#AAAAAA');

  _chartInstance = new window.Chart(canvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor:  colors,
        hoverBackgroundColor: colors,
        borderWidth: 2,
        borderColor: '#ffffff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 13 },
            padding: 16,
          },
        },
        tooltip: {
          // Req 5.4: tooltip shows category name + total as "Rp X.XXX"
          callbacks: {
            label(context) {
              const kategori = context.label || '';
              const total    = context.parsed;
              return ` ${kategori}: ${Formatter.toRupiah(total)}`;
            },
          },
        },
      },
    },
  });
}

/**
 * Render the monthly summary section with per-month totals.
 *
 * Displays a list of months that have at least one transaction, sorted
 * newest to oldest (descending).  Each row shows a localised month label
 * (e.g. "September 2024") and the total formatted as Rupiah.
 *
 * Activates the `#section-monthly` card (adds class "active") so it becomes
 * visible when there is data; hides it again when the list is empty.
 *
 * Requirements: 7.1, 7.2, 7.3
 *
 * @param {{ [yearMonth: string]: number }} byMonth - Object returned by
 *   `StateManager.getByMonth()`.  Keys are "YYYY-MM" strings, values are
 *   total jumlah for that month.  Already sorted newest-first by the state
 *   layer, but we sort defensively here too.
 */
function renderMonthlySummary(byMonth) {
  const section   = document.getElementById('section-monthly');
  const container = document.getElementById('monthly-summary-container');

  if (!section || !container) return;

  const entries = Object.entries(byMonth || {}).filter(([, total]) => total > 0);

  // Hide the card when there is nothing to show
  if (entries.length === 0) {
    section.classList.remove('active');
    container.innerHTML = '';
    return;
  }

  // Sort newest-first (defensive — StateManager already does this)
  entries.sort((a, b) => b[0].localeCompare(a[0]));

  // Activate the optional card so it becomes visible
  section.classList.add('active');

  /**
   * Format a "YYYY-MM" key into a readable Indonesian month label.
   * Prefers Intl.DateTimeFormat; falls back to a manual month-name array.
   * @param {string} yearMonth - e.g. "2024-09"
   * @returns {string} - e.g. "September 2024"
   */
  function formatMonthLabel(yearMonth) {
    // Parse components — using day "02" avoids timezone-related month shifts
    const [year, month] = yearMonth.split('-');
    const date = new Date(`${year}-${month}-02T00:00:00.000Z`);

    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year:  'numeric',
        timeZone: 'UTC',
      }).format(date);
    }

    // Fallback: manual Indonesian month names
    const MONTHS_ID = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return `${MONTHS_ID[Number(month) - 1]} ${year}`;
  }

  const itemsHTML = entries.map(([yearMonth, total]) => {
    const label  = escapeHTML(formatMonthLabel(yearMonth));
    const amount = Formatter.toRupiah(total);
    return `
      <div class="monthly-item" role="listitem">
        <span class="monthly-label">${label}</span>
        <span class="monthly-amount">${amount}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = itemsHTML;
}

/**
 * Re-render all UI components from current state.
 * Called after every state mutation (add/delete transaction).
 *
 * Requirements: 2.3, 5.3, 6.1
 */
function renderAll() {
  const transactions = StateManager.getTransactions();
  renderTransactionList(transactions);
  renderTotalSaldo(StateManager.getTotal());
  renderChart(StateManager.getByCategory());
  renderMonthlySummary(StateManager.getByMonth());
}


// === THEME (optional, Task 12) ===
// ThemeManager: dark/light mode management.
// Functions: apply(theme), toggle(), getPreferred()

const ThemeManager = {
  /**
   * Apply a theme to the document by toggling the `dark-mode` class on
   * <body> and updating the toggle button's icon/label to reflect state.
   *
   * Requirements: 8.1 (default 'terang'), 8.2 (< 150ms color-scheme switch —
   * handled by the CSS `transition` declared on `body` / themed elements in
   * style.css, this function only flips the class synchronously).
   *
   * @param {'terang'|'gelap'} theme
   */
  apply(theme) {
    const isDark = theme === 'gelap';
    document.body.classList.toggle('dark-mode', isDark);

    const btn = document.getElementById('btn-theme-toggle');
    if (btn) {
      btn.textContent = isDark ? '☀️' : '🌙';
      btn.setAttribute('aria-pressed', String(isDark));
      btn.setAttribute('title', isDark ? 'Beralih ke tema terang' : 'Beralih ke tema gelap');
    }
  },

  /**
   * Toggle between 'terang' and 'gelap', apply it immediately, and persist
   * the new preference to Local Storage (Req 8.1, 8.3).
   * @returns {'terang'|'gelap'} the newly-applied theme
   */
  toggle() {
    const next = document.body.classList.contains('dark-mode') ? 'terang' : 'gelap';
    ThemeManager.apply(next);
    try {
      StorageManager.save(STORAGE_KEY_THEME, next);
    } catch (_err) {
      // Storage write failed — theme still applied for this session,
      // just won't survive a refresh (Req 2.4 notification).
      showNotification('Data tidak dapat disimpan secara persisten.', 'error', 4000);
    }
    return next;
  },

  /**
   * Read the last-saved theme preference from Local Storage.
   * Defaults to 'terang' for new users or when no valid value is stored
   * (Req 8.1, 8.3).
   * @returns {'terang'|'gelap'}
   */
  getPreferred() {
    try {
      const stored = StorageManager.load(STORAGE_KEY_THEME);
      if (stored === 'terang' || stored === 'gelap') return stored;
    } catch (_err) {
      // Corrupt theme key — ignore and fall back to default below.
    }
    return 'terang';
  },
};


// === THRESHOLD (optional, Task 13) ===
// Threshold highlight: marks transaction rows exceeding a set limit.
// State: currentThreshold (number, default 0 = disabled)

/** @type {number} 0 means the highlight feature is off (no threshold set). */
let currentThreshold = 0;

/**
 * @returns {number} the currently active threshold value.
 */
function getCurrentThreshold() {
  return currentThreshold;
}

/**
 * Update the in-memory threshold and persist it to Local Storage.
 * Requirements: 9.2 (Rp 0–999.999.999 range — validated by the caller
 * before this is invoked), 2.4 (notify on storage write failure).
 * @param {number} value
 */
function setCurrentThreshold(value) {
  currentThreshold = value;
  try {
    StorageManager.save(STORAGE_KEY_THRESHOLD, value);
  } catch (_err) {
    showNotification('Data tidak dapat disimpan secara persisten.', 'error', 4000);
  }
}

/**
 * Load a previously-saved threshold from Local Storage into memory.
 * Falls back to 0 (disabled) when nothing is stored, the stored value is
 * corrupt, or it fails `Validator.validateThreshold`.
 */
function loadThresholdFromStorage() {
  try {
    const stored = StorageManager.load(STORAGE_KEY_THRESHOLD);
    const result = Validator.validateThreshold(stored);
    currentThreshold = result.valid ? Number(stored) : 0;
  } catch (_err) {
    // StorageParseError (corrupt key) — start disabled, no crash.
    currentThreshold = 0;
  }
}


// === INIT ===
// Application bootstrap: load data from storage, render initial UI,
// wire up form submit and delete event listeners.
// Runs on DOMContentLoaded.

document.addEventListener('DOMContentLoaded', () => {

  // --- Load persisted data from localStorage (Req 2.3) ---
  try {
    StateManager.loadFromStorage();
  } catch (err) {
    if (err.name === 'StorageParseError') {
      // Corrupt data — start fresh, notify user (Req 2.6)
      showNotification('Data sebelumnya tidak dapat dimuat. Memulai dengan daftar kosong.', 'error', 4000);
    }
  }

  // --- Task 12: Apply persisted theme preference (Req 8.1, 8.3) ---
  ThemeManager.apply(ThemeManager.getPreferred());

  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      ThemeManager.toggle();
    });
  }

  // --- Task 13: Load persisted threshold and activate the section (Req 9.2) ---
  loadThresholdFromStorage();

  const thresholdSection = document.getElementById('section-threshold');
  if (thresholdSection) thresholdSection.classList.add('active');

  const thresholdInput = document.getElementById('input-threshold');
  if (thresholdInput) {
    // Reflect the persisted value in the field (blank when disabled/0)
    thresholdInput.value = currentThreshold > 0 ? String(currentThreshold) : '';

    thresholdInput.addEventListener('input', () => {
      const rawValue = thresholdInput.value;

      // Clear previous error state before re-validating
      thresholdInput.classList.remove('is-invalid');
      thresholdInput.removeAttribute('aria-invalid');
      const errorEl = document.getElementById('error-threshold');
      if (errorEl) errorEl.textContent = '';

      // An emptied field means "no limit" — disable highlighting (Req 9.2)
      if (rawValue.trim() === '') {
        setCurrentThreshold(0);
        renderTransactionList(StateManager.getTransactions());
        return;
      }

      const result = Validator.validateThreshold(rawValue);
      if (!result.valid) {
        // Invalid: show error, keep the previously-applied threshold (Req 9.3)
        showFieldError('input-threshold', result.error);
        return;
      }

      // Valid: apply and re-render highlights within < 300ms (Req 9.4)
      setCurrentThreshold(Number(rawValue));
      renderTransactionList(StateManager.getTransactions());
    });
  }

  // --- Initial render ---
  renderAll();

  // --- 7.1: Form submit event listener (Req 1.1–1.5) ---
  const form = document.getElementById('form-transaksi');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      // Gather form values
      const namaItem = document.getElementById('input-namaItem').value;
      const jumlah   = document.getElementById('input-jumlah').value;
      const kategori = document.getElementById('input-kategori').value;

      // Clear previous errors before re-validating
      clearFieldErrors();

      // Validate all fields (Req 1.2, 1.3, 1.4)
      const result = Validator.validateTransactionData({ namaItem, jumlah, kategori });

      if (!result.valid) {
        // Show per-field errors under each problematic field (Req 1.3, 1.4)
        if (result.errors.namaItem) showFieldError('input-namaItem', result.errors.namaItem);
        if (result.errors.jumlah)   showFieldError('input-jumlah',   result.errors.jumlah);
        if (result.errors.kategori) showFieldError('input-kategori', result.errors.kategori);
        return;
      }

      // Valid — persist transaction (Req 2.1)
      try {
        StateManager.addTransaction({ namaItem: namaItem.trim(), jumlah: Number(jumlah), kategori });
      } catch (err) {
        // localStorage write failure (Req 2.4)
        showNotification('Data tidak dapat disimpan secara persisten.', 'error', 4000);
        return;
      }

      // Success: reset form, return focus to namaItem, update UI, notify (Req 1.5)
      form.reset();
      clearFieldErrors();
      document.getElementById('input-namaItem').focus();
      renderAll();
      showNotification('Transaksi berhasil ditambahkan!', 'success', 3000);
    });
  }

  // --- 7.2: Delete button via event delegation (Req 3.3, 3.4) ---
  const listContainer = document.getElementById('transaction-list-container');
  if (listContainer) {
    listContainer.addEventListener('click', (event) => {
      // Walk up the DOM from the click target to find a [data-id] button
      const btn = event.target.closest('button[data-id]');
      if (!btn) return;

      const id = btn.getAttribute('data-id');
      if (!id) return;

      // Confirmation dialog before deletion (Req 3.3)
      const confirmed = window.confirm('Hapus transaksi ini?');
      if (!confirmed) return;

      // Delete and re-render within 100ms (Req 3.4)
      try {
        StateManager.deleteTransaction(id);
      } catch (err) {
        // localStorage write failure (Req 2.4)
        showNotification('Data tidak dapat disimpan secara persisten.', 'error', 4000);
      }
      renderAll();
    });
  }

  // --- Global error handlers — prevent UI crash (Req 6.1) ---
  window.onerror = (msg, src, line, col, err) => {
    console.error('[EBV] Uncaught error:', msg, err);
    return false; // don't suppress default browser behavior
  };
  window.onunhandledrejection = (event) => {
    console.error('[EBV] Unhandled promise rejection:', event.reason);
  };

});