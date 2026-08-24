document.querySelector("button").addEventListener("click", function () {

  const price = Number(document.getElementById("price").value);

  const d1ma12 = Number(document.getElementById("d1ma12").value);
  const d1atr = Number(document.getElementById("d1atr").value);
  const d1sd = Number(document.getElementById("d1sd").value);

  const w1ma12 = Number(document.getElementById("w1ma12").value);
  const w1atr = Number(document.getElementById("w1atr").value);
  const w1sd = Number(document.getElementById("w1sd").value);

  if (!price || !d1ma12 || !d1atr || !d1sd ||
      !w1ma12 || !w1atr || !w1sd) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  const d1Zones = [
    ["D1 +1 ATR", d1ma12 + d1atr],
    ["D1 +0.75 ATR", d1ma12 + d1atr * 0.75],
    ["D1 +0.50 ATR", d1ma12 + d1atr * 0.50],
    ["D1 +0.25 ATR", d1ma12 + d1atr * 0.25],
    ["D1 MA12", d1ma12],
    ["D1 -0.25 ATR", d1ma12 - d1atr * 0.25],
    ["D1 -0.50 ATR", d1ma12 - d1atr * 0.50],
    ["D1 -0.75 ATR", d1ma12 - d1atr * 0.75],
    ["D1 -1 ATR", d1ma12 - d1atr],

    ["D1 +1 SD", d1ma12 + d1sd],
    ["D1 +2 SD", d1ma12 + d1sd * 2],
    ["D1 -1 SD", d1ma12 - d1sd],
    ["D1 -2 SD", d1ma12 - d1sd * 2]
  ];

  const w1Zones = [
    ["W1 +1 ATR", w1ma12 + w1atr],
    ["W1 +0.75 ATR", w1ma12 + w1atr * 0.75],
    ["W1 +0.50 ATR", w1ma12 + w1atr * 0.50],
    ["W1 +0.25 ATR", w1ma12 + w1atr * 0.25],
    ["W1 MA12", w1ma12],
    ["W1 -0.25 ATR", w1ma12 - w1atr * 0.25],
    ["W1 -0.50 ATR", w1ma12 - w1atr * 0.50],
    ["W1 -0.75 ATR", w1ma12 - w1atr * 0.75],
    ["W1 -1 ATR", w1ma12 - w1atr],

    ["W1 +1 SD", w1ma12 + w1sd],
    ["W1 +2 SD", w1ma12 + w1sd * 2],
    ["W1 -1 SD", w1ma12 - w1sd],
    ["W1 -2 SD", w1ma12 - w1sd * 2]
  ];

  const allZones = [...d1Zones, ...w1Zones];

  allZones.sort((a, b) =>
    Math.abs(a[1] - price) - Math.abs(b[1] - price)
  );

  let html = `
    <h2>ผลการวิเคราะห์</h2>
    <p>ราคาปัจจุบัน: <strong>${price.toFixed(2)}</strong></p>
  `;

  allZones.slice(0, 10).forEach((zone, index) => {

    const distance = Math.abs(zone[1] - price);
    const direction = zone[1] > price
      ? "⬆️ ด้านบน"
      : "⬇️ ด้านล่าง";

    html += `
      <div style="
        padding:10px;
        margin:6px 0;
        border:1px solid #ccc;
        border-radius:8px;
      ">
        <strong>#${index + 1} ${zone[0]}</strong><br>
        ราคา: <strong>${zone[1].toFixed(2)}</strong><br>
        ${direction} | ห่าง ${distance.toFixed(2)}
      </div>
    `;
  });

  document.body.insertAdjacentHTML("beforeend", html);

});
