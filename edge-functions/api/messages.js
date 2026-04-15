const RATE_KEY_PREFIX = "wedding:rate:";
const STORE_KEY = "wedding:messages";
const RATE_LIMIT_MS = 15000;
const MAX_MESSAGES = 200;

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function pickKV(context) {
  if (!context || !context.env) return null;
  return (
    context.env.WEDDING_KV ||
    context.env.wedding_kv ||
    context.env.my_kv ||
    context.env.MY_KV ||
    null
  );
}

async function readMessages(kv) {
  if (!kv) return [];
  const raw = await kv.get(STORE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-client-ip") ||
    "unknown"
  );
}

function normalizePayload(body) {
  const guestName = String(body.guestName || "").trim().slice(0, 20);
  const impression = String(body.impression || "").trim();
  return { guestName, impression };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendByResend({ apiKey, from, to, subject, text, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to: [to], subject, text, html })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data && data.message ? data.message : "Email provider error";
    throw new Error(detail);
  }

  return data;
}

export default async function handler(request, context) {
  if (request.method === "GET") {
    return json({ ok: true, service: "message-forwarder" }, 200);
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  const { guestName, impression } = normalizePayload(body);
  if (impression.length < 2 || impression.length > 120) {
    return json({ error: "Impression must be 2-120 characters." }, 400);
  }

  const kv = pickKV(context);
  const ip = getClientIp(request);
  const now = Date.now();

  if (kv) {
    const rateKey = RATE_KEY_PREFIX + ip;
    const lastPostAtRaw = await kv.get(rateKey);

    if (lastPostAtRaw) {
      const lastPostAt = Number(lastPostAtRaw);
      if (!Number.isNaN(lastPostAt) && now - lastPostAt < RATE_LIMIT_MS) {
        return json({ error: "提交太频繁，请稍后再试。" }, 429);
      }
    }

    await kv.put(rateKey, String(now));
  }

  const to = (context && context.env && context.env.MAIL_TO) || "nerdfny@163.com";
  const from =
    (context && context.env && context.env.MAIL_FROM) || "Wedding Guestbook <onboarding@resend.dev>";
  const apiKey = context && context.env && context.env.RESEND_API_KEY;

  if (!apiKey) {
    return json(
      {
        error:
          "邮件发送未配置，请在 EdgeOne 环境变量中添加 RESEND_API_KEY，并配置 MAIL_FROM（推荐）/MAIL_TO。"
      },
      500
    );
  }

  const message = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    guestName: guestName || "匿名来宾",
    impression,
    createdAt: new Date().toISOString(),
    ip
  };

  try {
    const safeGuestName = escapeHtml(message.guestName);
    const safeImpression = escapeHtml(message.impression);

    await sendByResend({
      apiKey,
      from,
      to,
      subject: `婚礼留言 - ${message.guestName}`,
      text:
        `姓名: ${message.guestName}\n` +
        `留言: ${message.impression}\n` +
        `时间: ${message.createdAt}\n` +
        `来源IP: ${message.ip}`,
      html:
        `<h2>婚礼新留言</h2>` +
        `<p><strong>姓名：</strong>${safeGuestName}</p>` +
        `<p><strong>留言：</strong>${safeImpression}</p>` +
        `<p><strong>时间：</strong>${message.createdAt}</p>` +
        `<p><strong>来源IP：</strong>${message.ip}</p>`
    });
  } catch (error) {
    return json({ error: `邮件发送失败：${error.message}` }, 502);
  }

  if (kv) {
    const current = await readMessages(kv);
    const next = [message].concat(current).slice(0, MAX_MESSAGES);
    await kv.put(STORE_KEY, JSON.stringify(next));
  }

  return json({ ok: true, message: "留言已发送到新人邮箱。" }, 201);
}
