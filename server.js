import express from "express";
const app = express();
app.use(express.json());

app.post("/order", async (req, res) => {
  const order = req.body;
  await fetch("https://discord.com/api/webhooks/1430969431462248570/kt8Yc_OlqpRmSur9lSgb_SbhmZNo0FT_7aLfer1Wds1XXAjEwtBMSgOIjnqmubbOifLl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: order.content }),
  });
  res.json({ success: true });
});

app.listen(3000);
