const SUPABASE_URL = "https://ctolckvhfojrchzjaqyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_l5UISnbptCI8T6HwE7di2w_0e7ZGyqR";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ======================================================
// GOLD ZONE ANALYZER PRO V3.1
// Strength + Confluence + Nearest S/R
// ======================================================


// ======================================================
// Utility
// ======================================================

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function formatPrice(value) {
  return Number(value).toFixed(2);
}


// ======================================================
// โหลดข้อมูลเก่า
// ======================================================

async function loadSavedData() {

  const { data, error } = await supabaseClient
    .from("gold_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("โหลดข้อมูลไม่สำเร็จ:", error);
    return;
  }

  if (!data) {
    console.log("ยังไม่มีข้อมูลที่บันทึกไว้");
    return;
  }

  document.getElementById("price").value = data.price ?? "";

  document.getElementById("d1ma12").value = data.d1ma12 ?? "";
  document.getElementById("d1atr").value = data.d1atr ?? "";
  document.getElementById("d1sd").value = data.d1sd ?? "";
  document.getElementById("d1ma247").value = data.d1ma247 ?? "";

  document.getElementById("w1ma12").value = data.w1ma12 ?? "";
  document.getElementById("w1atr").value = data.w1atr ?? "";
  document.getElementById("w1sd").value = data.w1sd ?? "";

  console.log("โหลดข้อมูลเก่าเรียบร้อย");
}


// ======================================================
// สร้าง Zone
// ======================================================

function buildD1Zones(ma12, atr, sd) {

  return [

    {
      name: "D1 +1 ATR",
      price: ma12 + atr,
      type: "D1",
      category: "ATR",
      level: 1
    },

    {
      name: "D1 +0.75 ATR",
      price: ma12 + atr * 0.75,
      type: "D1",
      category: "ATR",
      level: 0.75
    },

    {
      name: "D1 +0.50 ATR",
      price: ma12 + atr * 0.50,
      type: "D1",
      category: "ATR",
      level: 0.50
    },

    {
      name: "D1 +0.25 ATR",
      price: ma12 + atr * 0.25,
      type: "D1",
      category: "ATR",
      level: 0.25
    },

    {
      name: "D1 MA12",
      price: ma12,
      type: "D1",
      category: "MA",
      level: 0
    },

    {
      name: "D1 -0.25 ATR",
      price: ma12 - atr * 0.25,
      type: "D1",
      category: "ATR",
      level: -0.25
    },

    {
      name: "D1 -0.50 ATR",
      price: ma12 - atr * 0.50,
      type: "D1",
      category: "ATR",
      level: -0.50
    },

    {
      name: "D1 -0.75 ATR",
      price: ma12 - atr * 0.75,
      type: "D1",
      category: "ATR",
      level: -0.75
    },

    {
      name: "D1 -1 ATR",
      price: ma12 - atr,
      type: "D1",
      category: "ATR",
      level: -1
    },

    {
      name: "D1 +1 SD",
      price: ma12 + sd,
      type: "D1",
      category: "SD",
      level: 1
    },

    {
      name: "D1 +2 SD",
      price: ma12 + sd * 2,
      type: "D1",
      category: "SD",
      level: 2
    },

    {
      name: "D1 -1 SD",
      price: ma12 - sd,
      type: "D1",
      category: "SD",
      level: -1
    },

    {
      name: "D1 -2 SD",
      price: ma12 - sd * 2,
      type: "D1",
      category: "SD",
      level: -2
    }

  ];
}


function buildW1Zones(ma12, atr, sd) {

  return [

    {
      name: "W1 +1 ATR",
      price: ma12 + atr,
      type: "W1",
      category: "ATR",
      level: 1
    },

    {
      name: "W1 +0.75 ATR",
      price: ma12 + atr * 0.75,
      type: "W1",
      category: "ATR",
      level: 0.75
    },

    {
      name: "W1 +0.50 ATR",
      price: ma12 + atr * 0.50,
      type: "W1",
      category: "ATR",
      level: 0.50
    },

    {
      name: "W1 +0.25 ATR",
      price: ma12 + atr * 0.25,
      type: "W1",
      category: "ATR",
      level: 0.25
    },

    {
      name: "W1 MA12",
      price: ma12,
      type: "W1",
      category: "MA",
      level: 0
    },

    {
      name: "W1 -0.25 ATR",
      price: ma12 - atr * 0.25,
      type: "W1",
      category: "ATR",
      level: -0.25
    },

    {
      name: "W1 -0.50 ATR",
      price: ma12 - atr * 0.50,
      type: "W1",
      category: "ATR",
      level: -0.50
    },

    {
      name: "W1 -0.75 ATR",
      price: ma12 - atr * 0.75,
      type: "W1",
      category: "ATR",
      level: -0.75
    },

    {
      name: "W1 -1 ATR",
      price: ma12 - atr,
      type: "W1",
      category: "ATR",
      level: -1
    },

    {
      name: "W1 +1 SD",
      price: ma12 + sd,
      type: "W1",
      category: "SD",
      level: 1
    },

    {
      name: "W1 +2 SD",
      price: ma12 + sd * 2,
      type: "W1",
      category: "SD",
      level: 2
    },

    {
      name: "W1 -1 SD",
      price: ma12 - sd,
      type: "W1",
      category: "SD",
      level: -1
    },

    {
      name: "W1 -2 SD",
      price: ma12 - sd * 2,
      type: "W1",
      category: "SD",
      level: -2
    }

  ];
}


// ======================================================
// Strength Framework V3.1
// ======================================================
//
// คะแนนประกอบ:
//
// Timeframe       = สูงสุด 20
// Zone Structure  = สูงสุด 20
// Proximity       = สูงสุด 25
// Confluence      = สูงสุด 35
//
// รวม = 100
//
// หมายเหตุ:
// เป็น rule-based score รุ่นแรก
// ยังไม่ใช่ statistical probability
// ต้องนำไป Backtest ภายหลัง
// ======================================================

function getBaseTimeframeScore(zone) {

  if (zone.type === "W1") {
    return 20;
  }

  return 14;
}


function getStructureScore(zone) {

  // MA12 = reference level สำคัญ
  if (zone.category === "MA") {
    return 20;
  }

  // ATR zones
  if (zone.category === "ATR") {

    const absLevel = Math.abs(zone.level);

    if (absLevel === 0.25) return 12;
    if (absLevel === 0.50) return 16;
    if (absLevel === 0.75) return 14;
    if (absLevel === 1) return 18;

  }

  // SD zones
  if (zone.category === "SD") {

    const absLevel = Math.abs(zone.level);

    if (absLevel === 1) return 15;
    if (absLevel === 2) return 18;

  }

  return 10;
}


function getProximityScore(zone) {

  // distance จะถูก normalize ด้วย ATR
  // เพื่อไม่ให้ใช้ระยะ $ แบบตายตัว
  const normalizedDistance =
    zone.distance / zone.atrReference;

  if (normalizedDistance <= 0.25) return 25;
  if (normalizedDistance <= 0.50) return 22;
  if (normalizedDistance <= 0.75) return 18;
  if (normalizedDistance <= 1.00) return 14;
  if (normalizedDistance <= 1.50) return 8;

  return 3;
}


// ======================================================
// Confluence Engine
// ======================================================

function detectConfluence(zones, d1atr, w1atr) {

  const threshold =
    0.25 * Math.min(d1atr, w1atr);

  zones.forEach(zone => {

    zone.confluence = null;
    zone.confluenceDistance = null;

  });


  for (let i = 0; i < zones.length; i++) {

    for (let j = i + 1; j < zones.length; j++) {

      const a = zones[i];
      const b = zones[j];

      // ต้องเป็นคนละ TF
      if (a.type === b.type) {
        continue;
      }

      const distance =
        Math.abs(a.price - b.price);

      if (distance <= threshold) {

        a.confluence = b;
        a.confluenceDistance = distance;

        b.confluence = a;
        b.confluenceDistance = distance;

      }

    }

  }

  return threshold;
}


// ======================================================
// Strength Calculation
// ======================================================

function calculateStrength(zone) {

  const timeframeScore =
    getBaseTimeframeScore(zone);

  const structureScore =
    getStructureScore(zone);

  const proximityScore =
    getProximityScore(zone);

  const confluenceScore =
    zone.confluence
      ? 35
      : 0;

  const rawScore =
    timeframeScore +
    structureScore +
    proximityScore +
    confluenceScore;

  zone.score =
    clamp(
      Math.round(rawScore),
      0,
      100
    );


  if (zone.score >= 80) {

    zone.strengthLabel =
      "Strong";

    zone.strengthIcon =
      "🔥";

  } else if (zone.score >= 60) {

    zone.strengthLabel =
      "Moderate";

    zone.strengthIcon =
      "🟡";

  } else if (zone.score >= 40) {

    zone.strengthLabel =
      "Weak";

    zone.strengthIcon =
      "🟠";

  } else {

    zone.strengthLabel =
      "Low";

    zone.strengthIcon =
      "⚪";

  }


  zone.scoreBreakdown = {

    timeframe: timeframeScore,
    structure: structureScore,
    proximity: proximityScore,
    confluence: confluenceScore

  };


  return zone;
}


// ======================================================
// WHY THIS ZONE?
// ======================================================

function buildZoneReasons(zone) {

  const reasons = [];


  if (zone.type === "W1") {

    reasons.push(
      "W1 higher-timeframe reference"
    );

  } else {

    reasons.push(
      "D1 daily reference"
    );

  }


  if (zone.category === "MA") {

    reasons.push(
      `${zone.type} MA12 reference`
    );

  }


  if (zone.category === "ATR") {

    reasons.push(
      `${zone.type} ATR ${Math.abs(zone.level)} level`
    );

  }


  if (zone.category === "SD") {

    reasons.push(
      `${zone.type} Standard Deviation ${Math.abs(zone.level)}`
    );

  }


  if (zone.distance <= zone.atrReference * 0.50) {

    reasons.push(
      "อยู่ใกล้ราคาปัจจุบัน"
    );

  }


  if (zone.confluence) {

    reasons.push(
      `${zone.type} + ${zone.confluence.type} Confluence`
    );

  }


  return reasons;
}


// ======================================================
// Analyze Button
// ======================================================

document
  .querySelector(".analyze-btn")
  .addEventListener("click", async function () {


    const price =
      Number(
        document.getElementById("price").value
      );


    // ==================================================
    // D1
    // ==================================================

    const d1ma12Value =
      document.getElementById("d1ma12").value.trim();

    const d1atrValue =
      document.getElementById("d1atr").value.trim();

    const d1sdValue =
      document.getElementById("d1sd").value.trim();

    const d1ma247Value =
      document.getElementById("d1ma247").value.trim();


    const d1HasAny =
      d1ma12Value !== "" ||
      d1atrValue !== "" ||
      d1sdValue !== "" ||
      d1ma247Value !== "";


    const d1Complete =
      d1ma12Value !== "" &&
      d1atrValue !== "" &&
      d1sdValue !== "";


    // ==================================================
    // W1
    // ==================================================

    const w1ma12Value =
      document.getElementById("w1ma12").value.trim();

    const w1atrValue =
      document.getElementById("w1atr").value.trim();

    const w1sdValue =
      document.getElementById("w1sd").value.trim();


    const w1HasAny =
      w1ma12Value !== "" ||
      w1atrValue !== "" ||
      w1sdValue !== "";


    const w1Complete =
      w1ma12Value !== "" &&
      w1atrValue !== "" &&
      w1sdValue !== "";


    // ==================================================
    // Validation
    // ==================================================

    if (!price) {

      alert("กรุณากรอกราคาทอง");

      return;
    }


    if (!d1HasAny && !w1HasAny) {

      alert(
        "กรุณากรอกข้อมูล D1 หรือ W1 อย่างน้อย 1 ชุด"
      );

      return;
    }


    if (d1HasAny && !d1Complete) {

      alert(
        "ข้อมูล D1 ยังไม่ครบ\n\n" +
        "ต้องมี MA12 + ATR14 + SD20"
      );

      return;
    }


    if (w1HasAny && !w1Complete) {

      alert(
        "ข้อมูล W1 ยังไม่ครบ\n\n" +
        "ต้องมี MA12 + ATR14 + SD20"
      );

      return;
    }


    // ==================================================
    // Convert
    // ==================================================

    const d1ma12 =
      d1Complete
        ? Number(d1ma12Value)
        : null;

    const d1atr =
      d1Complete
        ? Number(d1atrValue)
        : null;

    const d1sd =
      d1Complete
        ? Number(d1sdValue)
        : null;

    const d1ma247 =
      d1ma247Value !== ""
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


    // ==================================================
    // Save
    // ==================================================

    const { error: saveError } =
      await supabaseClient
        .from("gold_settings")
        .upsert({

          id: 1,

          price: price,

          d1ma12: d1ma12,

          d1atr: d1atr,

          d1sd: d1sd,

          d1ma247: d1ma247,

          w1ma12: w1ma12,

          w1atr: w1atr,

          w1sd: w1sd

        });


    if (saveError) {

      console.error(
        "บันทึกไม่สำเร็จ:",
        saveError
      );

      alert(
        "บันทึกไม่สำเร็จ\n\n" +
        "ข้อความ: " +
        (saveError.message || "") +
        "\n" +
        "รหัส: " +
        (saveError.code || "") +
        "\n" +
        "รายละเอียด: " +
        (saveError.details || "") +
        "\n" +
        "Hint: " +
        (saveError.hint || "")
      );

      return;
    }


    // ==================================================
    // Generate Zones
    // ==================================================

    let d1Zones = [];

    let w1Zones = [];


    if (d1Complete) {

      d1Zones =
        buildD1Zones(
          d1ma12,
          d1atr,
          d1sd
        );

    }


    if (w1Complete) {

      w1Zones =
        buildW1Zones(
          w1ma12,
          w1atr,
          w1sd
        );

    }


    const allZones = [
      ...d1Zones,
      ...w1Zones
    ];


    // ==================================================
    // เพิ่มข้อมูลอ้างอิง
    // ==================================================

    allZones.forEach(zone => {

      zone.distance =
        Math.abs(
          zone.price - price
        );

      zone.above =
        zone.price > price;

      zone.atrReference =
        zone.type === "D1"
          ? d1atr
          : w1atr;

    });


    // ==================================================
    // Confluence
    // ==================================================

    let confluenceThreshold = null;


    if (d1Complete && w1Complete) {

      confluenceThreshold =
        detectConfluence(
          allZones,
          d1atr,
          w1atr
        );

    }


    // ==================================================
    // Strength
    // ==================================================

    allZones.forEach(zone => {

      calculateStrength(zone);

      zone.reasons =
        buildZoneReasons(zone);

    });


    // ==================================================
    // เรียงตามระยะห่าง
    // ==================================================

    allZones.sort(
      (a, b) =>
        a.distance - b.distance
    );


    // ==================================================
    // Nearest Support / Resistance
    // ==================================================

    const supports =
      allZones
        .filter(zone =>
          zone.price < price
        )
        .sort(
          (a, b) =>
            a.distance - b.distance
        );


    const resistances =
      allZones
        .filter(zone =>
          zone.price > price
        )
        .sort(
          (a, b) =>
            a.distance - b.distance
        );


    const nearestSupport =
      supports[0] || null;

    const nearestResistance =
      resistances[0] || null;


    // ==================================================
    // Mode
    // ==================================================

    let mode = "";

    if (d1Complete && w1Complete) {

      mode = "D1 + W1";

    } else if (d1Complete) {

      mode = "D1 Only";

    } else {

      mode = "W1 Only";

    }


    // ==================================================
    // Results
    // ==================================================

    const results =
      document.getElementById("results");

    results.innerHTML = "";


    // ==================================================
    // Header
    // ==================================================

    const header =
      document.createElement("div");

    header.className =
      "result-header";


    header.innerHTML = `

      <div>

        <h2 style="
          margin:0;
          font-size:22px;
        ">
          🎯 Gold Zones Pro
        </h2>

        <div style="
          color:#888;
          font-size:12px;
          margin-top:5px;
        ">
          ราคาอ้างอิง ${formatPrice(price)}
        </div>

      </div>

      <div class="result-count">
        ${mode}
      </div>

    `;


    results.appendChild(header);


    // ==================================================
    // Nearest S/R Panel
    // ==================================================

    const srPanel =
      document.createElement("div");

    srPanel.style.cssText = `
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      margin-bottom:16px;
    `;


    function createSRCard(zone, title, icon) {

      if (!zone) {

        return `
          <div style="
            padding:14px;
            border-radius:13px;
            background:#151515;
            border:1px solid #292929;
          ">
            <div style="color:#888;font-size:12px;">
              ${icon} ${title}
            </div>
            <div style="
              margin-top:8px;
              color:#555;
              font-size:13px;
            ">
              ไม่มี Zone
            </div>
          </div>
        `;

      }


      return `
        <div style="
          padding:14px;
          border-radius:13px;
          background:#151515;
          border:1px solid #292929;
        ">

          <div style="
            color:#aaa;
            font-size:12px;
          ">
            ${icon} ${title}
          </div>

          <div style="
            color:#f2c94c;
            font-size:21px;
            font-weight:800;
            margin-top:5px;
          ">
            ${formatPrice(zone.price)}
          </div>

          <div style="
            color:#888;
            font-size:11px;
            margin-top:3px;
          ">
            ${zone.name}
          </div>

          <div style="
            color:#aaa;
            font-size:11px;
            margin-top:6px;
          ">
            ห่าง ${formatPrice(zone.distance)}
          </div>

          <div style="
            margin-top:7px;
            font-weight:700;
            font-size:12px;
          ">
            ${zone.strengthIcon}
            ${zone.score}/100
            ${zone.strengthLabel}
          </div>

        </div>
      `;

    }


    srPanel.innerHTML =

      createSRCard(
        nearestSupport,
        "Nearest Support",
        "🟢"
      ) +

      createSRCard(
        nearestResistance,
        "Nearest Resistance",
        "🔴"
      );


    results.appendChild(srPanel);


    // ==================================================
    // Confluence Summary
    // ==================================================

    if (d1Complete && w1Complete) {

      const confluenceZones =
        allZones.filter(
          zone => zone.confluence
        );


      if (confluenceZones.length > 0) {

        const uniqueConfluences = [];

        confluenceZones.forEach(zone => {

          const partner =
            zone.confluence;

          const alreadyExists =
            uniqueConfluences.some(pair =>
              (
                pair.a === zone &&
                pair.b === partner
              ) ||
              (
                pair.a === partner &&
                pair.b === zone
              )
            );

          if (!alreadyExists) {

            uniqueConfluences.push({
              a: zone,
              b: partner
            });

          }

        });


        uniqueConfluences.forEach(pair => {

          const a = pair.a;
          const b = pair.b;

          const minPrice =
            Math.min(
              a.price,
              b.price
            );

          const maxPrice =
            Math.max(
              a.price,
              b.price
            );


          const confluenceCard =
            document.createElement("div");


          confluenceCard.style.cssText = `
            margin-bottom:12px;
            padding:15px;
            border-radius:14px;
            background:
              linear-gradient(
                135deg,
                rgba(214,169,40,0.10),
                rgba(155,124,255,0.08)
              );
            border:1px solid #5b4a1d;
          `;


          confluenceCard.innerHTML = `

            <div style="
              font-weight:800;
              font-size:14px;
            ">
              🔥 CONFLUENCE ZONE
            </div>

            <div style="
              color:#f2c94c;
              font-size:20px;
              font-weight:800;
              margin-top:5px;
            ">
              ${formatPrice(minPrice)}
              —
              ${formatPrice(maxPrice)}
            </div>

            <div style="
              color:#aaa;
              font-size:12px;
              margin-top:5px;
            ">
              ${a.name} + ${b.name}
            </div>

            <div style="
              color:#777;
              font-size:11px;
              margin-top:5px;
            ">
              ระยะห่างระหว่าง Zone:
              ${formatPrice(
                Math.abs(a.price - b.price)
              )}
              <br>
              Threshold:
              ${formatPrice(confluenceThreshold)}
            </div>

          `;


          results.appendChild(
            confluenceCard
          );

        });

      }

    }


    // ==================================================
    // Zone Cards
    // ==================================================

    allZones
      .slice(0, 10)
      .forEach((zone, index) => {

        const card =
          document.createElement("div");


        card.className =
          "zone " +
          (
            zone.above
              ? "above"
              : "below"
          );


        const direction =
          zone.above
            ? "⬆️ ด้านบน"
            : "⬇️ ด้านล่าง";


        const directionClass =
          zone.above
            ? "direction-above"
            : "direction-below";


        const badgeColor =
          zone.type === "D1"
            ? "#d6a928"
            : "#9b7cff";


        const reasons =
          zone.reasons
            .map(
              reason =>
                `<div>• ${reason}</div>`
            )
            .join("");


        const confluenceBadge =
          zone.confluence
            ? `
              <span style="
                display:inline-block;
                margin-left:6px;
                padding:3px 7px;
                border-radius:6px;
                font-size:10px;
                background:#f2c94c22;
                color:#f2c94c;
              ">
                🔗 CONFLUENCE
              </span>
            `
            : "";


        card.innerHTML = `

          <div style="width:100%;">

            <div style="
              display:flex;
              justify-content:space-between;
              align-items:flex-start;
              gap:10px;
            ">

              <div class="zone-main">

                <div class="zone-name">

                  ${index === 0 ? "⭐ " : ""}

                  ${zone.name}

                  <span style="
                    display:inline-block;
                    margin-left:7px;
                    padding:3px 7px;
                    border-radius:6px;
                    font-size:10px;
                    background:${badgeColor}22;
                    color:${badgeColor};
                  ">
                    ${zone.type}
                  </span>

                  ${confluenceBadge}

                </div>

                <div class="zone-price">
                  ${formatPrice(zone.price)}
                </div>

              </div>


              <div style="
                text-align:right;
                white-space:nowrap;
              ">

                <div style="
                  font-size:15px;
                  font-weight:800;
                ">
                  ${zone.strengthIcon}
                  ${zone.score}/100
                </div>

                <div style="
                  color:#999;
                  font-size:10px;
                  margin-top:2px;
                ">
                  ${zone.strengthLabel}
                </div>

              </div>

            </div>


            <div style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              margin-top:8px;
            ">

              <div class="${directionClass}">
                ${direction}
              </div>

              <div style="
                color:#999;
                font-size:11px;
              ">
                ห่าง ${formatPrice(zone.distance)}
              </div>

            </div>


            <div style="
              margin-top:11px;
              padding-top:10px;
              border-top:1px solid #262626;
              color:#999;
              font-size:11px;
              line-height:1.7;
            ">

              <div style="
                color:#ddd;
                font-weight:700;
                margin-bottom:3px;
              ">
                🧐 WHY THIS ZONE?
              </div>

              ${reasons}

            </div>


            <div style="
              margin-top:8px;
              font-size:10px;
              color:#555;
            ">

              Score Breakdown:
              TF ${zone.scoreBreakdown.timeframe}
              +
              Structure ${zone.scoreBreakdown.structure}
              +
              Proximity ${zone.scoreBreakdown.proximity}
              +
              Confluence ${zone.scoreBreakdown.confluence}

            </div>

          </div>

        `;


        results.appendChild(card);

      });


    // ==================================================
    // Status
    // ==================================================

    const status =
      document.createElement("div");


    status.style.cssText = `
      margin-top:12px;
      padding:10px;
      border-radius:10px;
      text-align:center;
      background:#151515;
      border:1px solid #292929;
      color:#777;
      font-size:11px;
    `;


    status.innerHTML =
      "☁️ บันทึกข้อมูลแล้ว • " +
      mode +
      " • V3.1";


    results.appendChild(status);


    // ==================================================
    // Scroll
    // ==================================================

    window.scrollTo({

      top:
        results.offsetTop - 15,

      behavior:
        "smooth"

    });

  });


// ======================================================
// Clear Data
// ======================================================

document
  .getElementById("clearDataBtn")
  .addEventListener(
    "click",
    async function () {


      const confirmClear =
        confirm(
          "ต้องการล้างข้อมูลที่บันทึกไว้ใช่ไหม?"
        );


      if (!confirmClear) {
        return;
      }


      const { error } =
        await supabaseClient
          .from("gold_settings")
          .delete()
          .eq("id", 1);


      if (error) {

        console.error(
          "ล้างข้อมูลไม่สำเร็จ:",
          error
        );

        alert(
          "ล้างข้อมูลไม่สำเร็จ\n\n" +
          error.message
        );

        return;
      }


      document.getElementById("price").value = "";

      document.getElementById("d1ma12").value = "";

      document.getElementById("d1atr").value = "";

      document.getElementById("d1sd").value = "";

      document.getElementById("d1ma247").value = "";

      document.getElementById("w1ma12").value = "";

      document.getElementById("w1atr").value = "";

      document.getElementById("w1sd").value = "";

      document.getElementById("results").innerHTML = "";


      alert(
        "ล้างข้อมูลเรียบร้อยแล้ว 🧹"
      );

    }
  );


// ======================================================
// เริ่มต้น
// ======================================================

loadSavedData();
