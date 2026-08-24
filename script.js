const SUPABASE_URL =
  "https://ctolckvhfojrchzjaqyo.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_l5UISnbptCI8T6HwE7di2w_0e7ZGyqR";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ======================================================
// VOLATILITY
// ======================================================

function calculateVolatilityRegime(atr, sd) {

  if (
    !Number.isFinite(atr) ||
    !Number.isFinite(sd) ||
    atr <= 0 ||
    sd <= 0
  ) {
    return {
      level: "Unknown",
      icon: "⚪",
      ratio: null,
      reason: "ข้อมูล ATR / SD ไม่เพียงพอ"
    };
  }

  const ratio = sd / atr;

  if (ratio >= 2) {
    return {
      level: "Extreme Volatility",
      icon: "🔥",
      ratio,
      reason: "SD สูงมากเมื่อเทียบกับ ATR"
    };
  }

  if (ratio >= 1.5) {
    return {
      level: "High Volatility",
      icon: "🔴",
      ratio,
      reason: "SD สูงเมื่อเทียบกับ ATR"
    };
  }

  if (ratio >= 1) {
    return {
      level: "Normal Volatility",
      icon: "🟡",
      ratio,
      reason: "ความผันผวนอยู่ในระดับปกติ"
    };
  }

  return {
    level: "Low Volatility",
    icon: "🟢",
    ratio,
    reason: "SD ต่ำเมื่อเทียบกับ ATR"
  };
}


// ======================================================
// MARKET POSITION
// ======================================================

function calculateMarketPosition(
  price,
  ma12,
  atr,
  sd
) {

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(ma12) ||
    !Number.isFinite(atr) ||
    !Number.isFinite(sd) ||
    atr <= 0 ||
    sd <= 0
  ) {
    return {
      level: "Unknown",
      icon: "⚪",
      reason: "ข้อมูลไม่เพียงพอ"
    };
  }

  const distance = price - ma12;

  const atrPosition =
    distance / atr;

  const sdPosition =
    distance / sd;

  if (
    atrPosition >= 0.75 ||
    sdPosition >= 1
  ) {
    return {
      level: "Upper Range",
      icon: "🔴",
      reason:
        "ราคาอยู่เหนือ MA12 และเข้าใกล้ Upper Range",
      atrPosition,
      sdPosition
    };
  }

  if (
    atrPosition <= -0.75 ||
    sdPosition <= -1
  ) {
    return {
      level: "Lower Range",
      icon: "🟢",
      reason:
        "ราคาอยู่ต่ำกว่า MA12 และเข้าใกล้ Lower Range",
      atrPosition,
      sdPosition
    };
  }

  return {
    level: "Middle Range",
    icon: "🟡",
    reason:
      "ราคาอยู่บริเวณรอบ MA12",
    atrPosition,
    sdPosition
  };
}


// ======================================================
// MARKET FEATURES
// ======================================================

function calculateMarketFeatures(
  price,
  ma12,
  atr,
  sd
) {

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(ma12) ||
    !Number.isFinite(atr) ||
    !Number.isFinite(sd) ||
    atr <= 0 ||
    sd <= 0
  ) {
    return null;
  }

  const distance = price - ma12;

  return {
    atr,
    sd,
    sdAtrRatio: sd / atr,
    priceDistance: distance,
    absoluteDistance: Math.abs(distance),
    distanceATR: Math.abs(distance) / atr,
    distanceSD: Math.abs(distance) / sd
  };
}


// ======================================================
// STRENGTH
// ======================================================

function getStrengthLabel(score) {

  if (score >= 80) {
    return {
      label: "Strong",
      icon: "🔥"
    };
  }

  if (score >= 60) {
    return {
      label: "Moderate",
      icon: "🟡"
    };
  }

  if (score >= 40) {
    return {
      label: "Weak",
      icon: "🟠"
    };
  }

  return {
    label: "Low",
    icon: "⚪"
  };
}


function calculateStrength(
  zone,
  currentPrice,
  allZones
) {

  let score = 20;

  const reasons = [];

  if (zone.type === "W1") {

    score += 25;

    reasons.push(
      "W1 Zone มีน้ำหนักสูงกว่า D1"
    );

  } else {

    score += 15;

    reasons.push(
      "D1 Zone"
    );
  }


  const distance =
    Math.abs(
      zone.price -
      currentPrice
    );

  const distanceATR =
    distance /
    zone.atr;


  if (distanceATR <= 0.25) {

    score += 20;

    reasons.push(
      "อยู่ใกล้ราคาปัจจุบันมาก"
    );

  } else if (distanceATR <= 0.50) {

    score += 15;

    reasons.push(
      "อยู่ใกล้ราคาปัจจุบัน"
    );

  } else if (distanceATR <= 1) {

    score += 8;

    reasons.push(
      "อยู่ในระยะ 1 ATR"
    );

  } else {

    reasons.push(
      "อยู่ห่างจากราคาปัจจุบัน"
    );
  }


  if (zone.name.includes("MA12")) {

    score += 8;

    reasons.push(
      "เป็น MA12 Reference Zone"
    );
  }


  if (zone.name.includes("ATR")) {

    const match =
      zone.name.match(
        /([+-]?[0-9.]+) ATR/
      );

    if (match) {

      const multiple =
        Math.abs(
          Number(match[1])
        );

      if (
        multiple === 0.5 ||
        multiple === 1
      ) {

        score += 8;

        reasons.push(
          "เป็น ATR Level ที่มีนัยสำคัญ"
        );
      }
    }
  }


  if (zone.name.includes("SD")) {

    const match =
      zone.name.match(
        /([+-]?[0-9.]+) SD/
      );

    if (match) {

      const multiple =
        Math.abs(
          Number(match[1])
        );

      if (multiple >= 1) {

        score += 7;

        reasons.push(
          "อยู่บน Standard Deviation Level"
        );
      }
    }
  }


  const confluence =
    allZones.some(other => {

      if (other === zone)
        return false;

      if (other.type === zone.type)
        return false;

      const referenceATR =
        Math.min(
          zone.atr,
          other.atr
        );

      return (
        Math.abs(
          zone.price -
          other.price
        ) <=
        referenceATR * 0.20
      );
    });


  if (confluence) {

    score += 17;

    zone.hasConfluence = true;

    reasons.push(
      "มี D1 + W1 Confluence"
    );
  }


  score =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(score)
      )
    );


  return {
    score,
    reasons
  };
}


// ======================================================
// ZONE CREATOR
// ======================================================

function createZones(
  ma12,
  atr,
  sd,
  type
) {

  return [

    {
      name: `${type} +1 ATR`,
      price: ma12 + atr,
      type,
      atr,
      sd
    },

    {
      name: `${type} +0.75 ATR`,
      price: ma12 + atr * 0.75,
      type,
      atr,
      sd
    },

    {
      name: `${type} +0.50 ATR`,
      price: ma12 + atr * 0.50,
      type,
      atr,
      sd
    },

    {
      name: `${type} +0.25 ATR`,
      price: ma12 + atr * 0.25,
      type,
      atr,
      sd
    },

    {
      name: `${type} MA12`,
      price: ma12,
      type,
      atr,
      sd
    },

    {
      name: `${type} -0.25 ATR`,
      price: ma12 - atr * 0.25,
      type,
      atr,
      sd
    },

    {
      name: `${type} -0.50 ATR`,
      price: ma12 - atr * 0.50,
      type,
      atr,
      sd
    },

    {
      name: `${type} -0.75 ATR`,
      price: ma12 - atr * 0.75,
      type,
      atr,
      sd
    },

    {
      name: `${type} -1 ATR`,
      price: ma12 - atr,
      type,
      atr,
      sd
    },

    {
      name: `${type} +1 SD`,
      price: ma12 + sd,
      type,
      atr,
      sd
    },

    {
      name: `${type} +2 SD`,
      price: ma12 + sd * 2,
      type,
      atr,
      sd
    },

    {
      name: `${type} -1 SD`,
      price: ma12 - sd,
      type,
      atr,
      sd
    },

    {
      name: `${type} -2 SD`,
      price: ma12 - sd * 2,
      type,
      atr,
      sd
    }

  ];
}


// ======================================================
// LOAD SAVED DATA
// ======================================================

async function loadSavedData() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("gold_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();


  if (error) {

    console.error(
      "โหลดข้อมูลไม่สำเร็จ:",
      error
    );

    return;
  }


  if (!data)
    return;


  const ids = {

    price: data.price,

    d1ma12: data.d1ma12,
    d1atr: data.d1atr,
    d1sd: data.d1sd,
    d1ma247: data.d1ma247,

    w1ma12: data.w1ma12,
    w1atr: data.w1atr,
    w1sd: data.w1sd
  };


  Object.entries(ids)
    .forEach(([id, value]) => {

      const element =
        document.getElementById(id);

      if (element)
        element.value =
          value ?? "";

    });
}


// ======================================================
// ANALYZE
// ======================================================

document
  .querySelector(".analyze-btn")
  .addEventListener(
    "click",
    async function() {

      const price =
        Number(
          document
            .getElementById("price")
            .value
        );


      const d1ma12Value =
        document
          .getElementById("d1ma12")
          .value
          .trim();

      const d1atrValue =
        document
          .getElementById("d1atr")
          .value
          .trim();

      const d1sdValue =
        document
          .getElementById("d1sd")
          .value
          .trim();

      const d1ma247Value =
        document
          .getElementById("d1ma247")
          .value
          .trim();


      const w1ma12Value =
        document
          .getElementById("w1ma12")
          .value
          .trim();

      const w1atrValue =
        document
          .getElementById("w1atr")
          .value
          .trim();

      const w1sdValue =
        document
          .getElementById("w1sd")
          .value
          .trim();


      const d1HasAny =
        d1ma12Value ||
        d1atrValue ||
        d1sdValue ||
        d1ma247Value;


      const w1HasAny =
        w1ma12Value ||
        w1atrValue ||
        w1sdValue;


      const d1Complete =
        d1ma12Value &&
        d1atrValue &&
        d1sdValue;


      const w1Complete =
        w1ma12Value &&
        w1atrValue &&
        w1sdValue;


      if (!price) {

        alert(
          "กรุณากรอกราคาทอง"
        );

        return;
      }


      if (!d1HasAny && !w1HasAny) {

        alert(
          "กรุณากรอก D1 หรือ W1"
        );

        return;
      }


      if (d1HasAny && !d1Complete) {

        alert(
          "ข้อมูล D1 ต้องมี MA12 + ATR14 + SD20"
        );

        return;
      }


      if (w1HasAny && !w1Complete) {

        alert(
          "ข้อมูล W1 ต้องมี MA12 + ATR14 + SD20"
        );

        return;
      }


      const d1ma12 =
        Number(d1ma12Value);

      const d1atr =
        Number(d1atrValue);

      const d1sd =
        Number(d1sdValue);

      const d1ma247 =
        d1ma247Value
          ? Number(d1ma247Value)
          : null;


      const w1ma12 =
        w1Complete
          ? Number(w1ma12Value)
          : null;

      const w1atr =
        w1Complete
          ? Number(w1atrValue)
          : null;

      const w1sd =
        w1Complete
          ? Number(w1sdValue)
          : null;


      await supabaseClient
        .from("gold_settings")
        .upsert({

          id: 1,

          price,

          d1ma12,
          d1atr,
          d1sd,
          d1ma247,

          w1ma12,
          w1atr,
          w1sd

        });


      const d1Zones =
        d1Complete
          ? createZones(
              d1ma12,
              d1atr,
              d1sd,
              "D1"
            )
          : [];


      const w1Zones =
        w1Complete
          ? createZones(
              w1ma12,
              w1atr,
              w1sd,
              "W1"
            )
          : [];


      const allZones = [
        ...d1Zones,
        ...w1Zones
      ];


      allZones.forEach(zone => {

        zone.distance =
          Math.abs(
            zone.price - price
          );

        zone.above =
          zone.price > price;

      });


      allZones.forEach(zone => {

        const result =
          calculateStrength(
            zone,
            price,
            allZones
          );

        zone.strength =
          result.score;

        zone.reasons =
          result.reasons;

        zone.strengthLabel =
          getStrengthLabel(
            zone.strength
          );

      });


      const supports =
        allZones
          .filter(z => z.price < price)
          .sort(
            (a,b) =>
              b.price - a.price
          );


      const resistances =
        allZones
          .filter(z => z.price > price)
          .sort(
            (a,b) =>
              a.price - b.price
          );


      const nearestSupport =
        supports[0] || null;

      const nearestResistance =
        resistances[0] || null;


      const analysisMA12 =
        d1Complete
          ? d1ma12
          : w1ma12;

      const analysisATR =
        d1Complete
          ? d1atr
          : w1atr;

      const analysisSD =
        d1Complete
          ? d1sd
          : w1sd;


      const volatility =
        calculateVolatilityRegime(
          analysisATR,
          analysisSD
        );


      const marketPosition =
        calculateMarketPosition(
          price,
          analysisMA12,
          analysisATR,
          analysisSD
        );


      const marketFeatures =
        calculateMarketFeatures(
          price,
          analysisMA12,
          analysisATR,
          analysisSD
        );


      const results =
        document.getElementById(
          "results"
        );


      results.innerHTML = "";


      const mode =
        d1Complete && w1Complete
          ? "D1 + W1"
          : d1Complete
            ? "D1 Only"
            : "W1 Only";


      const analysis =
        document.createElement("div");


      analysis.className =
        "market-analysis";


      analysis.innerHTML = `

        <div class="panel">

          <div class="panel-title">
            📊 MARKET ANALYSIS
          </div>

          <div class="analysis-grid">

            <div class="feature-card">

              <div class="feature-label">
                VOLATILITY REGIME
              </div>

              <div class="feature-value">
                ${volatility.icon}
                ${volatility.level}
              </div>

              <div class="nearest-info">
                ${volatility.reason}
                <br>
                ${
                  volatility.ratio !== null
                    ? "SD / ATR = " +
                      volatility.ratio.toFixed(2)
                    : ""
                }
              </div>

            </div>


            <div class="feature-card">

              <div class="feature-label">
                MARKET POSITION
              </div>

              <div class="feature-value">
                ${marketPosition.icon}
                ${marketPosition.level}
              </div>

              <div class="nearest-info">
                ${marketPosition.reason}
              </div>

            </div>

          </div>


          <div class="feature-card"
               style="margin-top:10px">

            <div class="feature-label">
              📐 MARKET FEATURES
            </div>

            ${
              marketFeatures
                ? `

                  <div class="analysis-grid"
                       style="margin-top:10px">

                    <div>
                      ATR
                      <strong>
                        ${marketFeatures.atr.toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      SD
                      <strong>
                        ${marketFeatures.sd.toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      SD / ATR
                      <strong>
                        ${marketFeatures.sdAtrRatio.toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      Distance / ATR
                      <strong>
                        ${marketFeatures.distanceATR.toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      Distance / SD
                      <strong>
                        ${marketFeatures.distanceSD.toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      Price − MA12
                      <strong>
                        ${marketFeatures.priceDistance.toFixed(2)}
                      </strong>
                    </div>

                  </div>

                `
                : `
                  <div class="nearest-info">
                    ข้อมูลไม่เพียงพอ
                  </div>
                `
            }

          </div>

        </div>
      `;


      results.appendChild(analysis);


      const header =
        document.createElement("div");

      header.className =
        "result-header";


      header.innerHTML = `

        <div>

          <h2 style="margin:0">
            🎯 Gold Zones
          </h2>

          <div class="nearest-info">
            ราคาอ้างอิง
            ${price.toFixed(2)}
          </div>

        </div>

        <div class="nearest-info">
          ${mode}
        </div>

      `;


      results.appendChild(header);


      const nearest =
        document.createElement("div");

      nearest.className =
        "nearest-panel";


      nearest.innerHTML = `

        <div class="nearest-card">

          <div class="nearest-label">
            🟢 NEAREST SUPPORT
          </div>

          ${
            nearestSupport
              ? `

                <div class="nearest-price">
                  ${nearestSupport.price.toFixed(2)}
                </div>

                <div class="nearest-info">

                  ${nearestSupport.name}

                  <br>

                  Distance:
                  ${nearestSupport.distance.toFixed(2)}

                  <br>

                  Strength:
                  ${nearestSupport.strength}/100

                </div>

              `
              : `
                <div class="nearest-info">
                  ไม่พบ Support
                </div>
              `
          }

        </div>


        <div class="nearest-card">

          <div class="nearest-label">
            🔴 NEAREST RESISTANCE
          </div>

          ${
            nearestResistance
              ? `

                <div class="nearest-price">
                  ${nearestResistance.price.toFixed(2)}
                </div>

                <div class="nearest-info">

                  ${nearestResistance.name}

                  <br>

                  Distance:
                  ${nearestResistance.distance.toFixed(2)}

                  <br>

                  Strength:
                  ${nearestResistance.strength}/100

                </div>

              `
              : `
                <div class="nearest-info">
                  ไม่พบ Resistance
                </div>
              `
          }

        </div>

      `;


      results.appendChild(nearest);


      const confluences = [];


      if (
        d1Complete &&
        w1Complete
      ) {

        d1Zones.forEach(d1 => {

          w1Zones.forEach(w1 => {

            const threshold =
              Math.min(
                d1.atr,
                w1.atr
              ) * 0.20;


            const difference =
              Math.abs(
                d1.price -
                w1.price
              );


            if (
              difference <= threshold
            ) {

              confluences.push({
                d1,
                w1
              });

            }

          });

        });

      }


      if (confluences.length) {

        const title =
          document.createElement("h3");

        title.textContent =
          "🔗 Zone Confluence";

        results.appendChild(title);


        confluences
          .slice(0,5)
          .forEach(group => {

            const box =
              document.createElement("div");

            box.className =
              "confluence-box";


            const strength =
              Math.round(
                (
                  group.d1.strength +
                  group.w1.strength
                ) / 2
              );


            box.innerHTML = `

              <div class="confluence-title">
                🔥 D1 + W1 CONFLUENCE
              </div>

              <div class="confluence-price">

                ${Math.min(
                  group.d1.price,
                  group.w1.price
                ).toFixed(2)}

                —

                ${Math.max(
                  group.d1.price,
                  group.w1.price
                ).toFixed(2)}

              </div>

              <div class="nearest-info">

                D1:
                ${group.d1.name}

                <br>

                W1:
                ${group.w1.name}

                <br>

                Combined Strength:
                ${strength}/100

              </div>

            `;


            results.appendChild(box);

          });

      }


      const title =
        document.createElement("h3");

      title.textContent =
        "📍 Zone Analysis";

      results.appendChild(title);


      allZones
        .sort(
          (a,b) =>
            a.distance -
            b.distance
        )
        .slice(0,10)
        .forEach((zone,index) => {

          const card =
            document.createElement("div");

          card.className =
            "zone " +
            (
              zone.above
                ? "above"
                : "below"
            );


          card.innerHTML = `

            <div class="zone-main">

              <div class="zone-name">

                ${
                  index === 0
                    ? "⭐ "
                    : ""
                }

                ${zone.name}

              </div>

              <div class="zone-price">
                ${zone.price.toFixed(2)}
              </div>

              <div class="strength-box">

                <div class="strength-title">
                  ${zone.strengthLabel.icon}
                  Strength
                </div>

                <div class="strength-score">
                  ${zone.strength}/100
                  ${zone.strengthLabel.label}
                </div>

                <div class="strength-bar">

                  <div
                    class="strength-fill"
                    style="width:${zone.strength}%"
                  ></div>

                </div>

                <div class="why-title">
                  WHY THIS ZONE?
                </div>

                <ul class="why-list">

                  ${
                    zone.reasons
                      .slice(0,5)
                      .map(
                        r =>
                          `<li>${r}</li>`
                      )
                      .join("")
                  }

                </ul>

              </div>

            </div>


            <div class="zone-distance">

              ${
                zone.above
                  ? "⬆️ ด้านบน"
                  : "⬇️ ด้านล่าง"
              }

              <br>

              ห่าง
              ${zone.distance.toFixed(2)}

            </div>

          `;


          results.appendChild(card);

        });

    }
  );


// ======================================================
// CSV PARSER
// ======================================================

function parseCSV(text) {

  const lines =
    text
      .replace(/^\uFEFF/, "")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);


  if (lines.length < 2)
    return [];


  const headers =
    lines[0]
      .split(",")
      .map(
        h =>
          h.trim()
            .replace(/^"|"$/g,"")
            .toLowerCase()
      );


  const dateIndex =
    headers.indexOf("date");

  const openIndex =
    headers.indexOf("open");

  const highIndex =
    headers.indexOf("high");

  const lowIndex =
    headers.indexOf("low");

  const closeIndex =
    headers.indexOf("close");


  if (
    dateIndex < 0 ||
    openIndex < 0 ||
    highIndex < 0 ||
    lowIndex < 0 ||
    closeIndex < 0
  ) {

    throw new Error(
      "CSV ต้องมีคอลัมน์ Date, Open, High, Low, Close"
    );
  }


  return lines
    .slice(1)
    .map(line => {

      const parts =
        line.split(",");


      return {

        date:
          parts[dateIndex]
            ?.trim()
            .replace(/^"|"$/g,""),

        open:
          Number(
            parts[openIndex]
              ?.trim()
              .replace(/"/g,"")
          ),

        high:
          Number(
            parts[highIndex]
              ?.trim()
              .replace(/"/g,"")
          ),

        low:
          Number(
            parts[lowIndex]
              ?.trim()
              .replace(/"/g,"")
          ),

        close:
          Number(
            parts[closeIndex]
              ?.trim()
              .replace(/"/g,"")
          )

      };

    })
    .filter(row =>
      row.date &&
      Number.isFinite(row.open) &&
      Number.isFinite(row.high) &&
      Number.isFinite(row.low) &&
      Number.isFinite(row.close)
    );
}


// ======================================================
// BACKTEST ENGINE
// ======================================================

function runBacktest(
  candles,
  ma12,
  atr,
  minStrength,
  riskR,
  rewardR
) {

  if (
    !candles.length ||
    !Number.isFinite(ma12) ||
    !Number.isFinite(atr)
  ) {
    return [];
  }


  const zones =
    createZones(
      ma12,
      atr,
      atr,
      "D1"
    );


  const results = [];


  for (
    let i = 0;
    i < candles.length - 1;
    i++
  ) {

    const candle =
      candles[i];


    let nearest = null;


    for (const zone of zones) {

      const distance =
        Math.abs(
          candle.close -
          zone.price
        );


      if (
        distance <=
        atr * 0.20
      ) {

        if (
          !nearest ||
          distance <
          nearest.distance
        ) {

          nearest = {
            ...zone,
            distance
          };

        }

      }

    }


    if (!nearest)
      continue;


    const fakeZones =
      zones.map(z => ({
        ...z
      }));


    const strength =
      calculateStrength(
        nearest,
        candle.close,
        fakeZones
      );


    if (
      strength.score <
      minStrength
    ) {
      continue;
    }


    const direction =
      nearest.price <
      candle.close
        ? "LONG"
        : "SHORT";


    const risk =
      atr * riskR;

    const reward =
      atr * rewardR;


    const entry =
      candle.close;


    const stop =
      direction === "LONG"
        ? entry - risk
        : entry + risk;


    const target =
      direction === "LONG"
        ? entry + reward
        : entry - reward;


    let outcome = null;


    for (
      let j = i + 1;
      j < candles.length;
      j++
    ) {

      const next =
        candles[j];


      if (
        direction === "LONG"
      ) {

        const hitStop =
          next.low <= stop;

        const hitTarget =
          next.high >= target;


        if (
          hitStop &&
          hitTarget
        ) {

          outcome = {
            result: "LOSS",
            r: -riskR,
            exit: stop
          };

          break;
        }


        if (hitTarget) {

          outcome = {
            result: "WIN",
            r: rewardR,
            exit: target
          };

          break;
        }


        if (hitStop) {

          outcome = {
            result: "LOSS",
            r: -riskR,
            exit: stop
          };

          break;
        }

      } else {

        const hitStop =
          next.high >= stop;

        const hitTarget =
          next.low <= target;


        if (
          hitStop &&
          hitTarget
        ) {

          outcome = {
            result: "LOSS",
            r: -riskR,
            exit: stop
          };

          break;
        }


        if (hitTarget) {

          outcome = {
            result: "WIN",
            r: rewardR,
            exit: target
          };

          break;
        }


        if (hitStop) {

          outcome = {
            result: "LOSS",
            r: -riskR,
            exit: stop
          };

          break;
        }

      }

    }


    if (!outcome)
      continue;


    results.push({

      date: candle.date,

      direction,

      entry,

      stop,

      target,

      zone: nearest.name,

      strength: strength.score,

      result: outcome.result,

      r: outcome.r,

      exit: outcome.exit

    });

  }


  return results;
}


// ======================================================
// BACKTEST STATISTICS
// ======================================================

function calculateBacktestStats(trades) {

  if (!trades.length) {

    return {
      total: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageR: 0,
      expectancy: 0,
      profitFactor: 0,
      maxDrawdown: 0
    };
  }


  const wins =
    trades.filter(
      t => t.result === "WIN"
    );


  const losses =
    trades.filter(
      t => t.result === "LOSS"
    );


  const totalR =
    trades.reduce(
      (sum,t) =>
        sum + t.r,
      0
    );


  const averageR =
    totalR /
    trades.length;


  const winRate =
    wins.length /
    trades.length *
    100;


  const grossProfit =
    wins.reduce(
      (sum,t) =>
        sum + t.r,
      0
    );


  const grossLoss =
    Math.abs(
      losses.reduce(
        (sum,t) =>
          sum + t.r,
        0
      )
    );


  const profitFactor =
    grossLoss > 0
      ? grossProfit /
        grossLoss
      : Infinity;


  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;


  trades.forEach(t => {

    equity += t.r;

    peak =
      Math.max(
        peak,
        equity
      );

    const drawdown =
      peak - equity;

    maxDrawdown =
      Math.max(
        maxDrawdown,
        drawdown
      );

  });


  return {

    total: trades.length,

    wins: wins.length,

    losses: losses.length,

    winRate,

    averageR,

    expectancy: averageR,

    profitFactor,

    maxDrawdown

  };
}


// ======================================================
// BACKTEST FILE INPUT
// ======================================================

const backtestFile =
  document.getElementById(
    "backtestFile"
  );


if (backtestFile) {

  backtestFile.addEventListener(
    "change",
    function() {

      const file =
        this.files?.[0];

      const name =
        document.getElementById(
          "backtestFileName"
        );

      if (name) {

        name.textContent =
          file
            ? `ไฟล์ที่เลือก: ${file.name}`
            : "ยังไม่ได้เลือกไฟล์";

      }

    }
  );

}


// ======================================================
// BACKTEST BUTTON
// ======================================================

const runBacktestBtn =
  document.getElementById(
    "runBacktestBtn"
  );


if (runBacktestBtn) {

  runBacktestBtn.addEventListener(
    "click",
    async function() {

      try {

        const fileInput =
          document.getElementById(
            "backtestFile"
          );


        if (
          !fileInput ||
          !fileInput.files ||
          !fileInput.files.length
        ) {

          alert(
            "กรุณาเลือกไฟล์ CSV ก่อนครับ"
          );

          return;
        }


        const file =
          fileInput.files[0];


        const csv =
          await file.text();


        const candles =
          parseCSV(csv);


        if (!candles.length) {

          alert(
            "ไม่พบข้อมูลแท่งเทียนในไฟล์ CSV"
          );

          return;
        }


        const ma12 =
          Number(
            document
              .getElementById("d1ma12")
              .value
          );


        const atr =
          Number(
            document
              .getElementById("d1atr")
              .value
          );


        const minStrength =
          Number(
            document
              .getElementById("minStrength")
              .value
          );


        const riskR =
          Number(
            document
              .getElementById("riskR")
              .value
          );


        const rewardR =
          Number(
            document
              .getElementById("rewardR")
              .value
          );


        if (
          !Number.isFinite(ma12) ||
          !Number.isFinite(atr) ||
          !Number.isFinite(minStrength) ||
          !Number.isFinite(riskR) ||
          !Number.isFinite(rewardR) ||
          ma12 <= 0 ||
          atr <= 0 ||
          riskR <= 0 ||
          rewardR <= 0
        ) {

          alert(
            "กรุณากรอก D1 MA12, ATR, Minimum Strength, Risk และ Reward ให้ถูกต้อง"
          );

          return;
        }


        const trades =
          runBacktest(
            candles,
            ma12,
            atr,
            minStrength,
            riskR,
            rewardR
          );


        const stats =
          calculateBacktestStats(
            trades
          );


        const output =
          document.getElementById(
            "backtestResults"
          );


        if (!output)
          return;


        output.innerHTML = `

          <div class="panel">

            <div class="panel-title">
              🧪 BACKTEST RESULTS
            </div>

            <div class="nearest-info">
              ข้อมูลทั้งหมด:
              ${candles.length.toLocaleString()}
              candles
              <br>
              Trades:
              ${stats.total}
            </div>


            <div class="stats-grid">

              <div class="stat-card">

                <div class="feature-label">
                  TOTAL TRADES
                </div>

                <div class="feature-value">
                  ${stats.total}
                </div>

              </div>


              <div class="stat-card">

                <div class="feature-label">
                  WIN RATE
                </div>

                <div class="feature-value">
                  ${stats.winRate.toFixed(2)}%
                </div>

              </div>


              <div class="stat-card">

                <div class="feature-label">
                  WINS
                </div>

                <div class="feature-value win">
                  ${stats.wins}
                </div>

              </div>


              <div class="stat-card">

                <div class="feature-label">
                  LOSSES
                </div>

                <div class="feature-value loss">
                  ${stats.losses}
                </div>

              </div>


              <div class="stat-card">

                <div class="feature-label">
                  AVERAGE R
                </div>

                <div class="feature-value">
                  ${stats.averageR.toFixed(2)}R
                </div>

              </div>


              <div class="stat-card">

                <div class="feature-label">
                  EXPECTANCY
                </div>

                <div class="feature-value">
                  ${stats.expectancy.toFixed(2)}R
                </div>

              </div>


              <div class="stat-card">

                <div class="feature-label">
                  PROFIT FACTOR
                </div>

                <div class="feature-value">

                  ${
                    Number.isFinite(
                      stats.profitFactor
                    )
                      ? stats.profitFactor.toFixed(2)
                      : "∞"
                  }

                </div>

              </div>


              <div class="stat-card">

                <div class="feature-label">
                  MAX DRAWDOWN
                </div>

                <div class="feature-value">
                  ${stats.maxDrawdown.toFixed(2)}R
                </div>

              </div>

            </div>


            ${
              trades.length
                ? `

                  <div style="overflow-x:auto">

                    <table class="backtest-table">

                      <thead>

                        <tr>
                          <th>Date</th>
                          <th>Side</th>
                          <th>Entry</th>
                          <th>Zone</th>
                          <th>Strength</th>
                          <th>Result</th>
                          <th>R</th>
                        </tr>

                      </thead>

                      <tbody>

                        ${
                          trades
                            .slice(-100)
                            .map(t => `

                              <tr>

                                <td>
                                  ${t.date}
                                </td>

                                <td>
                                  ${t.direction}
                                </td>

                                <td>
                                  ${t.entry.toFixed(2)}
                                </td>

                                <td>
                                  ${t.zone}
                                </td>

                                <td>
                                  ${t.strength}
                                </td>

                                <td class="${
                                  t.result === "WIN"
                                    ? "win"
                                    : "loss"
                                }">
                                  ${t.result}
                                </td>

                                <td class="${
                                  t.r > 0
                                    ? "win"
                                    : "loss"
                                }">
                                  ${t.r.toFixed(2)}
                                </td>

                              </tr>

                            `)
                            .join("")
                        }

                      </tbody>

                    </table>

                  </div>

                `
                : `

                  <div
                    class="nearest-info"
                    style="margin-top:15px"
                  >

                    ไม่พบ Trade ที่ผ่านเงื่อนไข
                    Strength ที่กำหนด

                  </div>

                `
            }

          </div>

        `;


        output.scrollIntoView({
          behavior: "smooth"
        });


      } catch(error) {

        console.error(
          "Backtest Error:",
          error
        );


        alert(
          "Backtest Error\n\n" +
          error.message
        );

      }

    }
  );

}


// ======================================================
// CLEAR DATA
// ======================================================

const clearDataBtn =
  document.getElementById(
    "clearDataBtn"
  );


if (clearDataBtn) {

  clearDataBtn.addEventListener(
    "click",
    async function() {

      if (
        !confirm(
          "ต้องการล้างข้อมูลที่บันทึกไว้ใช่ไหม?"
        )
      ) {
        return;
      }


      const {
        error
      } =
        await supabaseClient
          .from("gold_settings")
          .delete()
          .eq("id",1);


      if (error) {

        alert(
          "ล้างข้อมูลไม่สำเร็จ\n\n" +
          error.message
        );

        return;
      }


      [
        "price",
        "d1ma12",
        "d1atr",
        "d1sd",
        "d1ma247",
        "w1ma12",
        "w1atr",
        "w1sd"
      ]
      .forEach(id => {

        const el =
          document.getElementById(id);

        if (el)
          el.value = "";

      });


      const results =
        document.getElementById(
          "results"
        );

      if (results)
        results.innerHTML = "";


      const backtestResults =
        document.getElementById(
          "backtestResults"
        );

      if (backtestResults)
        backtestResults.innerHTML = "";


      const fileInput =
        document.getElementById(
          "backtestFile"
        );

      if (fileInput)
        fileInput.value = "";


      const fileName =
        document.getElementById(
          "backtestFileName"
        );

      if (fileName)
        fileName.textContent =
          "ยังไม่ได้เลือกไฟล์";


      alert(
        "ล้างข้อมูลเรียบร้อยแล้ว 🧹"
      );

    }
  );

}


// ======================================================
// INIT
// ======================================================

loadSavedData();
