export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const { nome, tavolo, items, totale } = req.body;

    // 👉 Inserisci qui il tuo Webhook Discord
    const webhookUrl = "https://discord.com/api/webhooks/IL_TUO_WEBHOOK";

    const messaggio = {
      content: `🍽️ **Nuovo ordine ricevuto!**
👤 Cliente: ${nome}
🪑 Tavolo: ${tavolo}
🛍️ Ordine: ${items.join(', ')}
💰 Totale: ${totale} $`,
    };

    // Invia a Discord
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messaggio),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Errore durante l'invio ordine:", err);
    return res.status(500).json({ error: "Errore durante l'invio ordine" });
  }
}
