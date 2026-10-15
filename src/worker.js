// 2Point Media – Cloudflare Worker
// Liefert die Webseite aus (Ordner /public) und nimmt Anfragen aus dem Formular entgegen (/api/lead).
//
// Einstellungen in Cloudflare (Worker → Einstellungen → Variablen und Geheimnisse):
//   RESEND_API_KEY  (Geheimnis)  Schlüssel von resend.com – damit kommt jede Anfrage als E-Mail zu dir
//   LEAD_TO         z. B. info@2pointmedia.ch – Empfänger
//   LEAD_FROM       z. B. "2Point Media Webseite <anfrage@2pointmedia.ch>" – Absender (Domain bei Resend bestätigen)
//   LEAD_WEBHOOK    (optional) Adresse, an die jede Anfrage zusätzlich geschickt wird (z. B. dein Lead-Backend, Make, Zapier)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Alte Onepage-Adresse weiterleiten
    if (url.pathname === '/kontaktanfrage') {
      return Response.redirect(url.origin + '/#analyse', 301);
    }

    if (url.pathname === '/api/lead') {
      if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
      return handleLead(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleLead(request, env) {
  let d;
  try {
    d = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid' }, 400);
  }

  // Spam-Falle: echte Menschen füllen dieses unsichtbare Feld nie aus
  if (d.website) return json({ ok: true });

  const clean = (v, max = 200) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, max);
  const lead = {
    ziel: clean(d.ziel),
    branche: clean(d.branche),
    groesse: clean(d.groesse),
    name: clean(d.name),
    firma: clean(d.firma),
    telefon: clean(d.telefon, 40),
    email: clean(d.email, 120),
    ort: clean(d.ort),
    quelle: clean(d.quelle, 300),
    seite: clean(d.seite, 300),
    zeit: new Date().toLocaleString('de-CH', { timeZone: 'Europe/Zurich' }),
  };

  if (!lead.name || !lead.firma || !lead.telefon || !/^\S+@\S+\.\S+$/.test(lead.email)) {
    return json({ ok: false, error: 'missing' }, 422);
  }

  const tasks = [];

  if (env.RESEND_API_KEY) {
    const rows = [
      ['Will', lead.ziel], ['Branche', lead.branche], ['Grösse', lead.groesse],
      ['Name', lead.name], ['Betrieb', lead.firma], ['Telefon', lead.telefon],
      ['E-Mail', lead.email], ['Ort', lead.ort], ['Herkunft', lead.quelle], ['Zeit', lead.zeit],
    ];
    const html = `<h2 style="font-family:Arial">Neue Anfrage: ${lead.firma}</h2>
      <table style="font-family:Arial;font-size:15px;border-collapse:collapse">
      ${rows.map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#888">${k}</td><td style="padding:6px 0"><b>${v || '–'}</b></td></tr>`).join('')}
      </table>
      <p style="font-family:Arial"><a href="tel:${lead.telefon.replace(/\s/g, '')}">Jetzt anrufen</a></p>`;

    tasks.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.LEAD_FROM || '2Point Media <onboarding@resend.dev>',
        to: [env.LEAD_TO || 'info@2pointmedia.ch'],
        reply_to: lead.email,
        subject: `🔥 Neue Analyse-Anfrage: ${lead.firma} (${lead.ziel || 'k.A.'})`,
        html,
      }),
    }));
  }

  if (env.LEAD_WEBHOOK) {
    tasks.push(fetch(env.LEAD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: '2pointmedia.ch', ...lead }),
    }));
  }

  if (!tasks.length) {
    // Noch nichts eingerichtet: der Besucher bekommt dann die E-Mail-Variante im Browser
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  const results = await Promise.allSettled(tasks);
  const anyOk = results.some(r => r.status === 'fulfilled' && r.value.ok);
  return anyOk ? json({ ok: true }) : json({ ok: false, error: 'delivery' }, 502);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
