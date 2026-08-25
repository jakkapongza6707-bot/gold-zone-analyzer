// ======================================================
// GOLD ZONE ANALYZER PRO
// ANALYSIS HISTORY V3
// ======================================================

const HISTORY_KEY = "gold_zone_analysis_history";

// ======================================================
// NORMALIZE
// ======================================================

function normalizeHistoryValue(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const number = Number(value);

  if (Number.isFinite(number)) {
    return number.toFixed(8);
  }

  return String(value).trim();
}


// ======================================================
// CREATE UNIQUE ANALYSIS KEY
// ======================================================

function createAnalysisKey(data) {

  return [

    normalizeHistoryValue(data?.price),

    normalizeHistoryValue(data?.d1ma12),
    normalizeHistoryValue(data?.d1atr),
    normalizeHistoryValue(data?.d1sd),
    normalizeHistoryValue(data?.d1ma247),

    normalizeHistoryValue(data?.w1ma12),
    normalizeHistoryValue(data?.w1atr),
    normalizeHistoryValue(data?.w1sd)

  ].join("|");

}


// ======================================================
// REMOVE OLD DUPLICATES
// ======================================================

function dedupeHistory(history) {

  if (!Array.isArray(history)) {
    return [];
  }

  const seen = new Set();
  const result = [];

  for (const item of history) {

    if (!item) {
      continue;
    }

    const key =
      item.analysisKey ||
      createAnalysisKey(item);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    if (!item.analysisKey) {
      item.analysisKey = key;
    }

    result.push(item);
  }

  return result;
}


// ======================================================
// GET HISTORY
// ======================================================

function getAnalysisHistory() {

  try {

    const saved =
      localStorage.getItem(
        HISTORY_KEY
      );

    if (!saved) {
      return [];
    }

    const history =
      JSON.parse(saved);

    if (!Array.isArray(history)) {
      return [];
    }

    const cleaned =
      dedupeHistory(history);

    // ถ้ามีรายการซ้ำ
    // ล้างให้เหลือรายการเดียว
    if (
      cleaned.length !==
      history.length
    ) {

      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(
          cleaned.slice(0, 500)
        )
      );

      console.log(
        "🧹 DUPLICATE HISTORY CLEANED"
      );
    }

    return cleaned;

  } catch (error) {

    console.error(
      "History Load Error:",
      error
    );

    return [];
  }
}


// ======================================================
// SAVE HISTORY
// ======================================================

function saveAnalysisHistory(history) {

  try {

    const cleaned =
      dedupeHistory(history)
        .slice(0, 500);

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(cleaned)
    );

    return true;

  } catch (error) {

    console.error(
      "History Save Error:",
      error
    );

    return false;
  }
}


// ======================================================
// MEMORY LOCK
// ======================================================

let lastAnalysisKey = null;

let lastAnalysisSavedAt = 0;


// ======================================================
// ADD ANALYSIS HISTORY
// ======================================================

function addAnalysisHistory(data) {

  if (!data) {

    return {

      success: false,
      duplicate: false

    };

  }


  const analysisKey =
    createAnalysisKey(data);

  const now =
    Date.now();


  // ====================================================
  // กันการกด Analyze รัว ๆ
  // ====================================================

  if (

    lastAnalysisKey ===
      analysisKey &&

    now -
      lastAnalysisSavedAt <
      3000

  ) {

    console.log(
      "⏭️ DUPLICATE ANALYSIS — MEMORY LOCK"
    );

    return {

      success: false,
      duplicate: true,
      item: null

    };

  }


  // ====================================================
  // โหลดประวัติเดิม
  // ====================================================

  const history =
    getAnalysisHistory();


  // ====================================================
  // ตรวจว่ามีข้อมูลชุดนี้แล้วหรือยัง
  // ====================================================

  const duplicate =
    history.find(item => {

      const oldKey =
        item.analysisKey ||
        createAnalysisKey(item);

      return (
        oldKey ===
        analysisKey
      );

    });


  if (duplicate) {

    lastAnalysisKey =
      analysisKey;

    lastAnalysisSavedAt =
      now;

    console.log(
      "⏭️ DUPLICATE ANALYSIS — NOT SAVED"
    );

    return {

      success: false,
      duplicate: true,
      item: duplicate

    };

  }


  // ====================================================
  // CREATE RECORD
  // ====================================================

  const record = {

    id:
      `${now}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    analysisKey,

    createdAt:
      new Date().toISOString(),

    price:
      data.price ?? null,

    d1ma12:
      data.d1ma12 ?? null,

    d1atr:
      data.d1atr ?? null,

    d1sd:
      data.d1sd ?? null,

    d1ma247:
      data.d1ma247 ?? null,

    w1ma12:
      data.w1ma12 ?? null,

    w1atr:
      data.w1atr ?? null,

    w1sd:
      data.w1sd ?? null,

    mode:
      data.mode ?? null,

    volatility:
      data.volatility ?? null,

    marketPosition:
      data.marketPosition ?? null

  };


  // ====================================================
  // SAVE
  // ====================================================

  history.unshift(record);

  saveAnalysisHistory(
    history
  );


  lastAnalysisKey =
    analysisKey;

  lastAnalysisSavedAt =
    now;


  console.log(
    "✅ NEW ANALYSIS HISTORY SAVED",
    record
  );


  renderAnalysisHistory();


  return {

    success: true,
    duplicate: false,
    item: record

  };

}


// ======================================================
// DELETE ONE
// ======================================================

function deleteAnalysisHistory(id) {

  const history =
    getAnalysisHistory();

  const newHistory =
    history.filter(
      item =>
        String(item.id) !==
        String(id)
    );

  saveAnalysisHistory(
    newHistory
  );

  renderAnalysisHistory();

}


// ======================================================
// CLEAR ALL
// ======================================================

function clearAnalysisHistory() {

  if (
    !confirm(
      "ต้องการลบประวัติการวิเคราะห์ทั้งหมดใช่ไหม?"
    )
  ) {

    return;
  }

  localStorage.removeItem(
    HISTORY_KEY
  );

  lastAnalysisKey =
    null;

  lastAnalysisSavedAt =
    0;

  renderAnalysisHistory();

  alert(
    "ลบประวัติทั้งหมดเรียบร้อยแล้ว 🧹"
  );

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatHistoryDate(date) {

  if (!date) {
    return "-";
  }

  const d =
    new Date(date);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {

    return date;
  }

  return d.toLocaleString(
    "th-TH",
    {

      year: "numeric",

      month: "2-digit",

      day: "2-digit",

      hour: "2-digit",

      minute: "2-digit"

    }
  );

}


// ======================================================
// RENDER HISTORY
// ======================================================

function renderAnalysisHistory() {

  const container =

    document.getElementById(
      "analysisHistory"
    ) ||

    document.getElementById(
      "historyResults"
    );


  if (!container) {
    return;
  }


  const history =
    getAnalysisHistory();


  if (!history.length) {

    container.innerHTML = `

      <div class="nearest-info">

        📭 ยังไม่มีประวัติการวิเคราะห์

      </div>

    `;

    return;
  }


  container.innerHTML = `

    <div
      class="history-header"
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
      "
    >

      <div>

        <h3 style="margin:0">

          🕘 Analysis History

        </h3>

        <div class="nearest-info">

          ${history.length} รายการ

        </div>

      </div>


      <button
        type="button"
        onclick="clearAnalysisHistory()"
        class="clear-history-btn"
      >

        🧹 ล้างทั้งหมด

      </button>

    </div>


    <div class="history-list">

      ${history.map(item => `

        <div class="history-card">

          <div
            class="history-top"
            style="
              display:flex;
              justify-content:space-between;
              gap:10px;
            "
          >

            <div>

              <strong>

                💰

                ${
                  Number.isFinite(
                    Number(item.price)
                  )

                  ?

                  Number(
                    item.price
                  ).toFixed(2)

                  :

                  "-"
                }

              </strong>

            </div>


            <div class="nearest-info">

              ${
                formatHistoryDate(
                  item.createdAt
                )
              }

            </div>

          </div>


          <div class="history-grid">


            <div>

              D1 MA12

              <strong>

                ${item.d1ma12 ?? "-"}

              </strong>

            </div>


            <div>

              D1 ATR14

              <strong>

                ${item.d1atr ?? "-"}

              </strong>

            </div>


            <div>

              D1 SD20

              <strong>

                ${item.d1sd ?? "-"}

              </strong>

            </div>


            <div>

              D1 MA247

              <strong>

                ${item.d1ma247 ?? "-"}

              </strong>

            </div>


            <div>

              W1 MA12

              <strong>

                ${item.w1ma12 ?? "-"}

              </strong>

            </div>


            <div>

              W1 ATR14

              <strong>

                ${item.w1atr ?? "-"}

              </strong>

            </div>


            <div>

              W1 SD20

              <strong>

                ${item.w1sd ?? "-"}

              </strong>

            </div>


          </div>


          ${
            item.mode

            ?

            `

              <div class="nearest-info">

                Mode:

                <strong>

                  ${item.mode}

                </strong>

              </div>

            `

            :

            ""
          }


          ${
            item.volatility

            ?

            `

              <div class="nearest-info">

                Volatility:

                ${item.volatility}

              </div>

            `

            :

            ""
          }


          ${
            item.marketPosition

            ?

            `

              <div class="nearest-info">

                Market Position:

                ${item.marketPosition}

              </div>

            `

            :

            ""
          }


          <button

            type="button"

            onclick="
              deleteAnalysisHistory(
                '${item.id}'
              )
            "

            class="delete-history-btn"

          >

            🗑️ ลบรายการนี้

          </button>


        </div>

      `).join("")}

    </div>

  `;

}


// ======================================================
// PUBLIC API
// ======================================================

window.GoldZoneHistory = {

  get:
    getAnalysisHistory,

  add:
    addAnalysisHistory,

  delete:
    deleteAnalysisHistory,

  clear:
    clearAnalysisHistory,

  render:
    renderAnalysisHistory

};


// ======================================================
// COMPATIBILITY
// ======================================================

window.clearAnalysisHistory =
  clearAnalysisHistory;

window.deleteAnalysisHistory =
  deleteAnalysisHistory;

window.clearGoldAnalysisHistory =
  clearAnalysisHistory;


// ======================================================
// EXPORT
// ======================================================

window.exportGoldAnalysisHistory =
  function() {

    const history =
      getAnalysisHistory();

    const blob =
      new Blob(

        [
          JSON.stringify(
            history,
            null,
            2
          )
        ],

        {
          type:
            "application/json"
        }

      );


    const url =
      URL.createObjectURL(
        blob
      );


    const a =
      document.createElement(
        "a"
      );

    a.href =
      url;

    a.download =
      `gold-analysis-history-${Date.now()}.json`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(
      url
    );

  };


// ======================================================
// INITIAL RENDER
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    renderAnalysisHistory();

  }
);


console.log(
  "✅ Gold Zone Analysis History V3 loaded"
);
