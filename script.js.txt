document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const category = document.getElementById("category").value;
  const details = document.getElementById("details").value;
  const delivery = document.getElementById("delivery").value;
  const address = document.getElementById("address").value;
  const datetime = document.getElementById("datetime").value;

  const content = `📦 **Nuovo Ordine Lux Emerals**
👤 Cliente: ${name}
📂 Categoria: ${category}
📝 Dettagli: ${details}
🚚 Consegna: ${delivery}
🏠 Civico: ${address || "Ritiro a mano"}
⏰ Consegna per: ${datetime}`;

  await fetch("https://discord.com/api/webhooks/1430969431462248570/kt8Yc_OlqpRmSur9lSgb_SbhmZNo0FT_7aLfer1Wds1XXAjEwtBMSgOIjnqmubbOifLl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  alert("✅ Ordine inviato con successo!");
  e.target.reset();
});
