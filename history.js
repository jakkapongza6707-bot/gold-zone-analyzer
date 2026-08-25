// ======================================================
// GOLD ZONE ANALYZER PRO
// ANALYSIS HISTORY
// ======================================================
//
// ระบบประวัติการวิเคราะห์
//
// ป้องกัน:
// - กด Analyze ซ้ำด้วยข้อมูลเดิม
// - บันทึกประวัติซ้ำโดยไม่จำเป็น
//
// Storage:
// localStorage
//
// ======================================================

const HISTORY_KEY = "gold_zone_analysis_history";


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

    return Array.isArray(history)
      ? history
      : [];

  }
  catch (error) {

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

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history)
    );

    return true;

  }
  catch (error) {

    console.error(
      "History Save Error:",
      error
    );

    return false;

  }

}


// ======================================================
// CREATE UNIQUE ANALYSIS KEY
// ======================================================
//
// ใช้ข้อมูลสำคัญของการวิเคราะห์
// เพื่อเช็กว่าข้อมูลนี้เคยบันทึกแล้วหรือยัง
//
// ถ้าค่าเหมือนกันทั้งหมด
// จะถือว่าเป็น Analysis เดิม
//
// ======================================================

function createAnalysisKey(data) {

  return [

    data.price,

    data.d1ma12,
    data.d1atr,
    data.d1sd,
    data.d1ma247,

    data.w1ma12,
    data.w1atr,
    data.w1sd

  ]
    .map(value =>
      value ?? ""
    )
    .join("|");

}


// ======================================================
// ADD ANALYSIS HISTORY
// ======================================================

function addAnalysisHistory(data) {

  const history =
    getAnalysisHistory();


  const analysisKey =
    createAnalysisKey(data);


  // --------------------------------------------------
  // CHECK DUPLICATE
  // --------------------------------------------------

  const duplicate =
    history.find(
      item =>
        item.analysisKey ===
        analysisKey
    );


  if (duplicate) {

    console.log(
      "⏭️ Analysis already exists:",
      analysisKey
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


  // --------------------------------------------------
  // CREATE NEW RECORD
  // --------------------------------------------------

  const record = {

    id:
      Date.now().toString(),

    analysisKey,

    createdAt:
      new Date().toISOString(),

    ...data

  };


  history.unshift(
    record
  );


  // --------------------------------------------------
  // จำกัดประวัติสูงสุด 500 รายการ
  // --------------------------------------------------

  const limitedHistory =
    history.slice(
      0,
      500
    );


  saveAnalysisHistory(
    limitedHistory
  );


  console.log(
    "✅ Analysis history saved:",
    record
  );


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

function deleteAnalysisHistory(id) {

  const history =
    getAnalysisHistory();


  const newHistory =
    history.filter(
      item =>
        item.id !==
        id
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

                      💰 ${Number(
                        item.price
                      ).toFixed(2)}

                    </strong>

                  </div>


                  <div class="nearest-info">

                    ${formatHistoryDate(
                      item.createdAt
                    )}

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
                  onclick="deleteAnalysisHistory('${item.id}')"
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
// DUPLICATE MESSAGE
// ======================================================

function showDuplicateHistoryMessage() {

  console.log(
    "⏭️ ไม่บันทึก เพราะเป็นข้อมูลการวิเคราะห์เดิม"
  );

}


// ======================================================
// AUTO LOAD
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    renderAnalysisHistory();

  }
);


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


console.log(
  "✅ Gold Zone Analysis History loaded"
);
