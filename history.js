// ======================================================
// GOLD ZONE ANALYZER PRO
// ANALYSIS HISTORY V2
// ======================================================
//
// ระบบประวัติการวิเคราะห์
//
// กฎ:
// - ข้อมูลชุดเดียวกัน = บันทึกเพียงครั้งเดียว
// - กด Analyze ซ้ำ = ไม่สร้างรายการใหม่
// - เปลี่ยนราคา = รายการใหม่
// - เปลี่ยนค่า D1/W1 = รายการใหม่
// - ลบรายการได้
// - ล้างทั้งหมดได้
//
// Storage:
// localStorage
//
// ======================================================


const HISTORY_KEY =
  "gold_zone_analysis_history";


// ======================================================
// NORMALIZE VALUE
// ======================================================

function normalizeHistoryValue(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return "";

  }


  const number =
    Number(value);


  if (
    Number.isFinite(number)
  ) {

    return number.toFixed(8);

  }


  return String(value)
    .trim();

}


// ======================================================
// CREATE UNIQUE ANALYSIS KEY
// ======================================================

function createAnalysisKey(data) {

  return [

    normalizeHistoryValue(
      data.price
    ),

    normalizeHistoryValue(
      data.d1ma12
    ),

    normalizeHistoryValue(
      data.d1atr
    ),

    normalizeHistoryValue(
      data.d1sd
    ),

    normalizeHistoryValue(
      data.d1ma247
    ),

    normalizeHistoryValue(
      data.w1ma12
    ),

    normalizeHistoryValue(
      data.w1atr
    ),

    normalizeHistoryValue(
      data.w1sd
    )

  ].join("|");

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


    if (!saved)
      return [];


    const history =
      JSON.parse(saved);


    if (
      !Array.isArray(history)
    ) {

      return [];

    }


    return history;

  }
  catch(error) {

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

function saveAnalysisHistory(
  history
) {

  try {

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history)
    );

    return true;

  }
  catch(error) {

    console.error(
      "History Save Error:",
      error
    );

    return false;

  }

}


// ======================================================
// ADD ANALYSIS HISTORY
// ======================================================

function addAnalysisHistory(
  data
) {

  if (!data)
    return {

      success:
        false,

      duplicate:
        false

    };


  const history =
    getAnalysisHistory();


  const analysisKey =
    createAnalysisKey(
      data
    );


  // ==================================================
  // DUPLICATE CHECK
  // ==================================================

  const duplicate =
    history.find(
      item => {

        // รองรับประวัติเก่าที่ไม่มี key
        const oldKey =
          item.analysisKey ||
          createAnalysisKey(
            item
          );


        return (
          oldKey ===
          analysisKey
        );

      }
    );


  if (duplicate) {

    console.log(
      "⏭️ DUPLICATE ANALYSIS — NOT SAVED"
    );


    return {

      success:
        false,

      duplicate:
        true,

      item:
        duplicate

    };

  }


  // ==================================================
  // CREATE RECORD
  // ==================================================

  const record = {

    id:
      `${Date.now()}_${Math.random()
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


  // ==================================================
  // SAVE
  // ==================================================

  history.unshift(
    record
  );


  saveAnalysisHistory(
    history.slice(
      0,
      500
    )
  );


  console.log(
    "✅ NEW ANALYSIS HISTORY SAVED",
    record
  );


  // ==================================================
  // REFRESH UI
  // ==================================================

  renderAnalysisHistory();


  return {

    success:
      true,

    duplicate:
      false,

    item:
      record

  };

}


// ======================================================
// DELETE HISTORY
// ======================================================

function deleteAnalysisHistory(
  id
) {

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
// CLEAR HISTORY
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


  renderAnalysisHistory();


  alert(
    "ลบประวัติทั้งหมดเรียบร้อยแล้ว 🧹"
  );

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatHistoryDate(
  date
) {

  if (!date)
    return "-";


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

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",

      hour:
        "2-digit",

      minute:
        "2-digit"

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
    );


  if (!container)
    return;


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

    <div class="history-header">

      <div>

        <h3 style="margin:0">

          🕘 Analysis History

        </h3>

        <div class="nearest-info">

          ${history.length}
          รายการ

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

      ${
        history
          .map(
            item => `

              <div class="history-card">

                <div class="history-top">

                  <div>

                    <strong>

                      💰 ${
                        Number.isFinite(
                          Number(item.price)
                        )
                          ? Number(
                              item.price
                            ).toFixed(2)
                          : "-"
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
                    ? `

                      <div class="nearest-info">

                        Mode:
                        <strong>
                          ${item.mode}
                        </strong>

                      </div>

                    `
                    : ""
                }


                ${
                  item.volatility
                    ? `

                      <div class="nearest-info">

                        Volatility:
                        ${item.volatility}

                      </div>

                    `
                    : ""
                }


                ${
                  item.marketPosition
                    ? `

                      <div class="nearest-info">

                        Market Position:
                        ${item.marketPosition}

                      </div>

                    `
                    : ""
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

            `
          )
          .join("")
      }

    </div>

  `;

}


// ======================================================
// EXPORT
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


window.clearAnalysisHistory =
  clearAnalysisHistory;


window.deleteAnalysisHistory =
  deleteAnalysisHistory;


// ======================================================
// AUTO LOAD
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    renderAnalysisHistory();

  }
);


console.log(
  "✅ Gold Zone Analysis History V2 loaded"
);
