// ======================================================
// GOLD ZONE ANALYZER PRO
// ANALYSIS HISTORY
// ======================================================

const GOLD_HISTORY_KEY =
  "gold_zone_analysis_history_v1";

const GOLD_HISTORY_LIMIT = 200;


// ======================================================
// GET HISTORY
// ======================================================

function getGoldHistory() {

  try {

    const raw =
      localStorage.getItem(
        GOLD_HISTORY_KEY
      );

    if (!raw)
      return [];

    const data =
      JSON.parse(raw);

    return Array.isArray(data)
      ? data
      : [];

  }
  catch (error) {

    console.error(
      "History load error:",
      error
    );

    return [];

  }

}


// ======================================================
// SAVE HISTORY
// ======================================================

function saveGoldHistory(
  history
) {

  localStorage.setItem(
    GOLD_HISTORY_KEY,
    JSON.stringify(
      history.slice(
        0,
        GOLD_HISTORY_LIMIT
      )
    )
  );

}


// ======================================================
// ADD HISTORY
// ======================================================

function addGoldAnalysisHistory(
  snapshot
) {

  const history =
    getGoldHistory();

  const record = {

    id:
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .slice(2, 8),

    createdAt:
      new Date().toISOString(),

    ...snapshot

  };


  history.unshift(
    record
  );


  saveGoldHistory(
    history
  );


  renderGoldHistory();

  return record;

}


// ======================================================
// DELETE ONE
// ======================================================

function deleteGoldAnalysisHistory(
  id
) {

  const history =
    getGoldHistory()
      .filter(
        item =>
          item.id !== id
      );


  saveGoldHistory(
    history
  );


  renderGoldHistory();

}


// ======================================================
// CLEAR ALL
// ======================================================

function clearGoldAnalysisHistory() {

  if (
    !confirm(
      "ต้องการล้างประวัติการวิเคราะห์ทั้งหมดใช่ไหม?"
    )
  ) {

    return;

  }


  localStorage.removeItem(
    GOLD_HISTORY_KEY
  );


  renderGoldHistory();

}


// ======================================================
// EXPORT JSON
// ======================================================

function exportGoldAnalysisHistory() {

  const history =
    getGoldHistory();


  if (!history.length) {

    alert(
      "ยังไม่มีประวัติการวิเคราะห์"
    );

    return;

  }


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


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;


  link.download =
    "gold-zone-analysis-history.json";


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url
  );

}


// ======================================================
// ESCAPE
// ======================================================

function historyEscape(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


// ======================================================
// RENDER HISTORY
// ======================================================

function renderGoldHistory() {

  const output =
    document.getElementById(
      "historyResults"
    );


  if (!output)
    return;


  const history =
    getGoldHistory();


  if (!history.length) {

    output.innerHTML = `

      <div class="nearest-info">

        📭 ยังไม่มีประวัติการวิเคราะห์

      </div>

    `;

    return;

  }


  output.innerHTML =
    history
      .map(
        item => {

          const date =
            new Date(
              item.createdAt
            )
            .toLocaleString(
              "th-TH"
            );


          const zones =
            Array.isArray(
              item.zones
            )
              ? item.zones
              : [];


          return `

            <div class="history-card">

              <div class="history-head">

                <div>

                  📊
                  <strong>
                    ${historyEscape(date)}
                  </strong>

                </div>

                <button
                  type="button"
                  class="history-delete"
                  onclick="
                    deleteGoldAnalysisHistory(
                      '${historyEscape(item.id)}'
                    )
                  "
                >
                  ลบ
                </button>

              </div>


              <div class="history-grid">

                <div>
                  ราคา
                  <strong>
                    ${
                      Number.isFinite(
                        Number(item.price)
                      )
                        ? Number(item.price).toFixed(2)
                        : "-"
                    }
                  </strong>
                </div>


                <div>
                  D1 MA12
                  <strong>
                    ${historyEscape(item.d1ma12)}
                  </strong>
                </div>


                <div>
                  D1 ATR14
                  <strong>
                    ${historyEscape(item.d1atr)}
                  </strong>
                </div>


                <div>
                  D1 SD20
                  <strong>
                    ${historyEscape(item.d1sd)}
                  </strong>
                </div>


                <div>
                  Market
                  <strong>
                    ${historyEscape(item.marketPosition)}
                  </strong>
                </div>


                <div>
                  Volatility
                  <strong>
                    ${historyEscape(item.volatility)}
                  </strong>
                </div>

              </div>


              ${
                zones.length
                  ? `

                    <div class="history-zones">

                      ${zones
                        .slice(0, 8)
                        .map(
                          zone => `

                            <span>

                              ${historyEscape(
                                zone.name
                              )}

                              :
                              ${Number(
                                zone.price
                              ).toFixed(2)}

                            </span>

                          `
                        )
                        .join("")}

                    </div>

                  `
                  : ""
              }

            </div>

          `;

        }
      )
      .join("");

}


// ======================================================
// CAPTURE CURRENT ANALYSIS
// ======================================================

function captureCurrentAnalysis() {

  const price =
    document.getElementById(
      "price"
    )?.value;


  const d1ma12 =
    document.getElementById(
      "d1ma12"
    )?.value;


  const d1atr =
    document.getElementById(
      "d1atr"
    )?.value;


  const d1sd =
    document.getElementById(
      "d1sd"
    )?.value;


  const d1ma247 =
    document.getElementById(
      "d1ma247"
    )?.value;


  const w1ma12 =
    document.getElementById(
      "w1ma12"
    )?.value;


  const w1atr =
    document.getElementById(
      "w1atr"
    )?.value;


  const w1sd =
    document.getElementById(
      "w1sd"
    )?.value;


  const featureCards =
    document.querySelectorAll(
      "#results .feature-card"
    );


  let volatility =
    "-";


  let marketPosition =
    "-";


  if (
    featureCards.length >= 2
  ) {

    volatility =
      featureCards[0]
        .querySelector(
          ".feature-value"
        )
        ?.textContent
        ?.trim() ||
      "-";


    marketPosition =
      featureCards[1]
        .querySelector(
          ".feature-value"
        )
        ?.textContent
        ?.trim() ||
      "-";

  }


  const zoneElements =
    document.querySelectorAll(
      "#results .zone"
    );


  const zones =
    Array.from(
      zoneElements
    )
      .map(
        zone => {

          const name =
            zone.querySelector(
              ".zone-name"
            )
              ?.textContent
              ?.replace(
                "⭐",
                ""
              )
              ?.trim();


          const priceText =
            zone.querySelector(
              ".zone-price"
            )
              ?.textContent
              ?.trim();


          const strengthText =
            zone.querySelector(
              ".strength-score"
            )
              ?.textContent
              ?.trim();


          const price =
            parseFloat(
              priceText
            );


          const strengthMatch =
            strengthText
              ?.match(
                /(\d+)\/100/
              );


          return {

            name:
              name || "-",

            price:
              Number.isFinite(price)
                ? price
                : null,

            strength:
              strengthMatch
                ? Number(
                    strengthMatch[1]
                  )
                : null

          };

        }
      )
      .filter(
        zone =>
          zone.name !== "-" ||
          zone.price !== null
      );


  if (
    !price ||
    !zones.length
  ) {

    return null;

  }


  return {

    price,

    d1ma12,

    d1atr,

    d1sd,

    d1ma247,

    w1ma12,

    w1atr,

    w1sd,

    volatility,

    marketPosition,

    zones

  };

}


// ======================================================
// AUTO SAVE AFTER ANALYSIS
// ======================================================

function setupHistoryAutoSave() {

  const analyzeButton =
    document.querySelector(
      ".analyze-btn"
    );


  if (!analyzeButton)
    return;


  analyzeButton.addEventListener(
    "click",
    function() {

      // รอให้ script.js
      // สร้างผลวิเคราะห์เสร็จก่อน

      setTimeout(
        function() {

          const snapshot =
            captureCurrentAnalysis();


          if (!snapshot)
            return;


          addGoldAnalysisHistory(
            snapshot
          );


        },
        500
      );

    }
  );

}


// ======================================================
// PUBLIC API
// ======================================================

window.GoldAnalysisHistory = {

  get:
    getGoldHistory,

  add:
    addGoldAnalysisHistory,

  remove:
    deleteGoldAnalysisHistory,

  clear:
    clearGoldAnalysisHistory,

  export:
    exportGoldAnalysisHistory,

  render:
    renderGoldHistory

};


// ======================================================
// INIT
// ======================================================

setupHistoryAutoSave();

renderGoldHistory();
