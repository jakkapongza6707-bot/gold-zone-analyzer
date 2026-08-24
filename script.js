// ================================
// GOLD ZONE ANALYZER
// Auto Save System
// ================================

const inputIds = [
  "price",
  "d1ma12",
  "d1atr",
  "d1sd",
  "d1ma247",
  "w1ma12",
  "w1atr",
  "w1sd"
];


// ================================
// LOAD SAVED DATA
// ================================

inputIds.forEach(function (id) {

  const input = document.getElementById(id);

  if (!input) return;

  const savedValue = localStorage.getItem("gold_" + id);

  if (savedValue !== null) {
    input.value = savedValue;
  }

});


// ================================
// AUTO SAVE WHEN TYPING
// ================================

inputIds.forEach(function (id) {

  const input = document.getElementById(id);

  if (!input) return;

  input.addEventListener("input", function () {

    localStorage.setItem(
      "gold_" + id,
      input.value
    );

  });

});


// ================================
// ANALYZE BUTTON
// ================================

document.querySelector("button").addEventListener("click", function () {

  const price = Number(
    document.getElementById("price").value
  );

  const d1ma12 = Number(
    document.getElementById("d1ma12").value
  );

  const d1atr = Number(
    document.getElementById("d1atr").value
  );

  const d1sd = Number(
    document.getElementById("d1sd").value
  );

  const w1ma12 = Number(
    document.getElementById("w1ma12").value
  );

  const w1atr = Number(
    document.getElementById("w1atr").value
  );

  const w1sd = Number(
    document.getElementById("w1sd").value
  );


  // ================================
  // CHECK DATA
  // ================================

  if (
    !price ||
    !d1ma12 ||
    !d1atr ||
    !d1sd ||
    !w1ma12 ||
    !w1atr ||
    !w1sd
  ) {

    alert("กรุณากรอกข้อมูลให้ครบ");

    return;
  }


  // ================================
  // D1 ZONES
  // ================================

  const d1Zones = [

    ["D1 +1 ATR", d1ma12 + d1atr],

    ["D1 +0.75 ATR",
      d1ma12 + d1atr * 0.75
    ],

    ["D1 +0.50 ATR",
      d1ma12 + d1atr * 0.50
    ],

    ["D1 +0.25 ATR",
      d1ma12 + d1atr * 0.25
    ],

    ["D1 MA12", d1ma12],

    ["D1 -0.25 ATR",
      d1ma12 - d1atr * 0.25
    ],

    ["D1 -0.50 ATR",
      d1ma12 - d1atr * 0.50
    ],

    ["D1 -0.75 ATR",
      d1ma12 - d1atr * 0.75
    ],

    ["D1 -1 ATR",
      d1ma12 - d1atr
    ],

    ["D1 +1 SD",
      d1ma12 + d1sd
    ],

    ["D1 +2 SD",
      d1ma12 + d1sd * 2
    ],

    ["D1 -1 SD",
      d1ma12 - d1sd
    ],

    ["D1 -2 SD",
      d1ma12 - d1sd * 2
    ]

  ];


  // ================================
  // W1 ZONES
  // ================================

  const w1Zones = [

    ["W1 +1 ATR",
      w1ma12 + w1atr
    ],

    ["W1 +0.75 ATR",
      w1ma12 + w1atr * 0.75
    ],

    ["W1 +0.50 ATR",
      w1ma12 + w1atr * 0.50
    ],

    ["W1 +0.25 ATR",
      w1ma12 + w1atr * 0.25
    ],

    ["W1 MA12", w1ma12],

    ["W1 -0.25 ATR",
      w1ma12 - w1atr * 0.25
    ],

    ["W1 -0.50 ATR",
      w1ma12 - w1atr * 0.50
    ],

    ["W1 -0.75 ATR",
      w1ma12 - w1atr * 0.75
    ],

    ["W1 -1 ATR",
      w1ma12 - w1atr
    ],

    ["W1 +1 SD",
      w1ma12 + w1sd
    ],

    ["W1 +2 SD",
      w1ma12 + w1sd * 2
    ],

    ["W1 -1 SD",
      w1ma12 - w1sd
    ],

    ["W1 -2 SD",
      w1ma12 - w1sd * 2
    ]

  ];


  // ================================
  // COMBINE ZONES
  // ================================

  const allZones = [
    ...d1Zones,
    ...w1Zones
  ];


  // ================================
  // SORT BY DISTANCE
  // ================================

  allZones.sort(function (a, b) {

    return (
      Math.abs(a[1] - price) -
      Math.abs(b[1] - price)
    );

  });


  // ================================
  // BUILD RESULT
  // ================================

  let html = `

    <div class="panel results">

      <div class="result-header">

        <div class="panel-title">
          🎯 Analysis Result
        </div>

        <div class="result-count">
          TOP 10 ZONES
        </div>

      </div>

      <div style="
        padding:12px;
        margin-bottom:14px;
        background:#111;
        border-radius:10px;
        text-align:center;
      ">

        <div style="
          color:#888;
          font-size:12px;
        ">
          ANALYZED PRICE
        </div>

        <div style="
          color:#f2c94c;
          font-size:25px;
          font-weight:800;
        ">
          ${price.toFixed(2)}
        </div>

      </div>

  `;


  // ================================
  // DISPLAY TOP 10
  // ================================

  allZones
    .slice(0, 10)
    .forEach(function (zone, index) {

      const distance =
        Math.abs(zone[1] - price);

      const isAbove =
        zone[1] > price;

      const direction =
        isAbove
          ? "⬆️ ด้านบน"
          : "⬇️ ด้านล่าง";

      const zoneClass =
        isAbove
          ? "above"
          : "below";

      const directionClass =
        isAbove
          ? "direction-above"
          : "direction-below";


      html += `

        <div class="zone ${zoneClass}">

          <div class="zone-main">

            <div class="zone-name">
              #${index + 1} ${zone[0]}
            </div>

            <div class="zone-price">
              ${zone[1].toFixed(2)}
            </div>

          </div>

          <div class="zone-distance">

            <div class="${directionClass}">
              ${direction}
            </div>

            <div>
              ห่าง ${distance.toFixed(2)}
            </div>

          </div>

        </div>

      `;

    });


  html += `</div>`;


  // ================================
  // SHOW RESULT
  // ================================

  document.getElementById("results").innerHTML =
    html;


  document.getElementById("results")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

});
