function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2)} NOK`;
}

async function sendEmail(apiKey, payload, idempotencyKey) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Resend kunne ikke sende e-posten.");
  }

  return data;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "o.alsadyy@gmail.com";
    const fromEmail =
      process.env.EMAIL_FROM || "Tobakksbutikk <onboarding@resend.dev>";

    if (!apiKey) {
      return res.status(500).json({ error: "RESEND_API_KEY mangler i Vercel." });
    }

    const {
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      address,
      postalCode,
      city,
      total,
      items
    } = req.body || {};

    if (!orderId || !customerName || !customerEmail || !Array.isArray(items)) {
      return res.status(400).json({ error: "Ufullstendige ordredata." });
    }

    const safeItems = items.slice(0, 100).map(item => ({
      name: escapeHtml(item.name),
      quantity: Math.max(1, Number(item.quantity || 1)),
      price: Number(item.price || 0)
    }));

    const rows = safeItems.map(item => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #ddd">${item.name}</td>
        <td style="padding:10px;border-bottom:1px solid #ddd;text-align:center">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right">${formatMoney(item.price)}</td>
        <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right">${formatMoney(item.price * item.quantity)}</td>
      </tr>
    `).join("");

    const orderNumber = escapeHtml(String(orderId).slice(0, 8));
    const safeCustomerName = escapeHtml(customerName);
    const safeCustomerEmail = escapeHtml(customerEmail);
    const safeCustomerPhone = escapeHtml(customerPhone);
    const safeAddress = escapeHtml(address);
    const safePostalCode = escapeHtml(postalCode);
    const safeCity = escapeHtml(city);

    const adminHtml = `
      <div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#111">
        <h1>Ny bestilling ${orderNumber}</h1>
        <p><strong>Kunde:</strong> ${safeCustomerName}</p>
        <p><strong>E-post:</strong> ${safeCustomerEmail}</p>
        <p><strong>Telefon:</strong> ${safeCustomerPhone}</p>
        <p><strong>Adresse:</strong> ${safeAddress}, ${safePostalCode} ${safeCity}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:24px">
          <thead>
            <tr>
              <th style="padding:10px;text-align:left;border-bottom:2px solid #111">Produkt</th>
              <th style="padding:10px;border-bottom:2px solid #111">Antall</th>
              <th style="padding:10px;text-align:right;border-bottom:2px solid #111">Pris</th>
              <th style="padding:10px;text-align:right;border-bottom:2px solid #111">Sum</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <h2 style="text-align:right">Total: ${formatMoney(total)}</h2>
        <p>Åpne ordrepanelet for å behandle bestillingen.</p>
      </div>
    `;

    const adminResult = await sendEmail(
      apiKey,
      {
        from: fromEmail,
        to: [adminEmail],
        reply_to: customerEmail,
        subject: `Ny bestilling ${orderNumber} – ${safeCustomerName}`,
        html: adminHtml
      },
      `admin-order-${orderId}`
    );

    let customerResult = null;
    let customerSkipped = false;

    // Resend's test sender can only deliver to the email connected to the
    // Resend account. Customer confirmations therefore require a verified domain.
    if (fromEmail.includes("onboarding@resend.dev")) {
      customerSkipped = true;
    } else {
      const customerHtml = `
        <div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#111">
          <h1>Takk for bestillingen, ${safeCustomerName}</h1>
          <p>Vi har mottatt bestillingen din med ordrenummer <strong>${orderNumber}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:24px">
            <thead>
              <tr>
                <th style="padding:10px;text-align:left;border-bottom:2px solid #111">Produkt</th>
                <th style="padding:10px;border-bottom:2px solid #111">Antall</th>
                <th style="padding:10px;text-align:right;border-bottom:2px solid #111">Sum</th>
              </tr>
            </thead>
            <tbody>
              ${safeItems.map(item => `
                <tr>
                  <td style="padding:10px;border-bottom:1px solid #ddd">${item.name}</td>
                  <td style="padding:10px;border-bottom:1px solid #ddd;text-align:center">${item.quantity}</td>
                  <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right">${formatMoney(item.price * item.quantity)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <h2 style="text-align:right">Total: ${formatMoney(total)}</h2>
          <p>Vi kontakter deg når bestillingen behandles.</p>
          <p>Med vennlig hilsen<br><strong>Tobakksbutikk</strong></p>
        </div>
      `;

      customerResult = await sendEmail(
        apiKey,
        {
          from: fromEmail,
          to: [customerEmail],
          subject: `Ordrebekreftelse ${orderNumber} – Tobakksbutikk`,
          html: customerHtml
        },
        `customer-order-${orderId}`
      );
    }

    return res.status(200).json({
      ok: true,
      adminEmailId: adminResult?.id,
      customerEmailId: customerResult?.id || null,
      customerSkipped
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error?.message || "Kunne ikke sende e-post."
    });
  }
}
