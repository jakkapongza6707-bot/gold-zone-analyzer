// ======================================================
// GOLD ZONE ANALYZER PRO
// ANALYSIS HISTORY V4
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
// CREATE ANALYSIS KEY
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
// DEDUPE HISTORY
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
// ADD HISTORY
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


  // ----------------------------------------------------
  // กันการกด Analyze รัว ๆ
  // ----------------------------------------------------

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


  const history =
    getAnalysisHistory();


  // ----------------------------------------------------
  // ตรวจข้อมูลซ้ำ
  // ----------------------------------------------------

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


  // ----------------------------------------------------
  // สร้างรายการใหม่
  // ----------------------------------------------------

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


  history.unshift(record);

  saveAnalysisHistory(history);


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
// 🔄 FILL HISTORY DATA BACK INTO FORM
// ======================================================

function refillAnalysisHistory(id) {

  const history =
    getAnalysisHistory();


  const item =
    history.find(
      record =>
        String(record.id) ===
        String(id)
    );


  if (!item) {

    alert(
      "ไม่พบข้อมูลประวัติรายการนี้"
    );

    return;

  }


  // ----------------------------------------------------
  // Helper
  // ----------------------------------------------------

  function setValue(
    id,
    value
  ) {

    const element =
      document.getElementById(id);

    if (!element) {
      return;
    }

    if (
      value === null ||
      value === undefined
    ) {

      element.value = "";

      return;

    }

    element.value =
      value;

  }


  // ----------------------------------------------------
  // PRICE
  // ----------------------------------------------------

  setValue(
    "price",
    item.price
  );


  // ----------------------------------------------------
  // D1
  // ----------------------------------------------------

  setValue(
    "d1ma12",
    item.d1ma12
  );

  setValue(
    "d1atr",
    item.d1atr
  );

  setValue(
    "d1sd",
    item.d1sd
  );

  setValue(
    "d1ma247",
    item.d1ma247
  );


  // ----------------------------------------------------
  // W1
  // ----------------------------------------------------

  setValue(
    "w1ma12",
    item.w1ma12
  );

  setValue(
    "w1atr",
    item.w1atr
  );

  setValue(
    "w1sd",
    item.w1sd
  );


  // ----------------------------------------------------
  // ถ้ามีช่อง Mode
  // ----------------------------------------------------

  setValue(
    "mode",
    item.mode
  );


  // ----------------------------------------------------
  // ถ้ามีช่อง Volatility
  // ----------------------------------------------------

  setValue(
    "volatility",
    item.volatility
  );


  // ----------------------------------------------------
  // ถ้ามีช่อง Market Position
  // ----------------------------------------------------

  setValue(
    "marketPosition",
    item.marketPosition
  );


  // ----------------------------------------------------
  // Scroll กลับไปด้านบน
  // ----------------------------------------------------

  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });


  // ----------------------------------------------------
  // แจ้งเตือน
  // ----------------------------------------------------

  console.log(
    "🔄 HISTORY DATA REFILLED",
    item
  );


  // ใช้ alert สั้น ๆ
  // เพื่อให้รู้ว่ากรอกกลับแล้ว

  setTimeout(
    function() {

      alert(
        "🔄 กรอกข้อมูลจากประวัติเรียบร้อยแล้ว\n\nตรวจสอบข้อมูลก่อนกด Analyze"
      );

    },
    350
  );

}


// ======================================================
// DELETE
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

        onclick="
          clearAnalysisHistory()
        "

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


          <!-- =====================================
               🔄 REFILL BUTTON
          ====================================== -->

          <button

            type="button"

            onclick="
              refillAnalysisHistory(
                '${item.id}'
              )
            "

            class="refill-history-btn"

            style="
              width:100%;
              margin-top:12px;
              padding:12px;
              border:none;
              border-radius:10px;
              background:#2563eb;
              color:white;
              font-size:15px;
              font-weight:bold;
              cursor:pointer;
            "

          >

            🔄 กรอกข้อมูลชุดนี้อีกครั้ง

          </button>


          <!-- =====================================
               DELETE
          ====================================== -->

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
    renderAnalysisHistory,

  refill:
    refillAnalysisHistory

};


// ======================================================
// GLOBAL FUNCTIONS
// ======================================================

window.clearAnalysisHistory =
  clearAnalysisHistory;

window.deleteAnalysisHistory =
  deleteAnalysisHistory;

window.refillAnalysisHistory =
  refillAnalysisHistory;

window.clearGoldAnalysisHistory =
  clearAnalysisHistory;


// ======================================================
// EXPORT HISTORY
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


    document.body.appendChild(
      a
    );


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
  "✅ Gold Zone Analysis History V4 loaded"
);
