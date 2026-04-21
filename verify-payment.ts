import { Resend } from "resend";

export async function onRequest(context: any) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const { name, email, phone, cc, category, message } = body;

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Name, email, and message are required" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    const resendKey = env.RESEND_API_KEY;
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Email service not configured." }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }

    const resend = new Resend(resendKey);
    const ccEmails = cc ? cc.split(',').map((e: string) => e.trim()).filter((e: string) => e) : [];

    const { data, error } = await resend.emails.send({
      from: 'HeadshotStudioPro <support@headshotstudiopro.com>',
      to: ['headshotstudiopro@gmail.com'],
      cc: ccEmails,
      subject: `New Feedback: [${category || 'General'}] from ${name}`,
      html: `
        <h2>New Feedback Received (Cloudflare)</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Category:</strong> ${category || 'General'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    if (error) {
      return new Response(JSON.stringify({ error: "Failed to send email", details: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ status: "success", message: "Feedback sent successfully" }), {
      headers: { "content-type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
