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

    const ccEmails = cc ? cc.split(',').map((e: string) => e.trim()).filter((e: string) => e) : [];

    // Call Resend API directly via fetch
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`
      },
      body: JSON.stringify({
        from: 'HeadshotStudioPro <support@headshotstudiopro.com>',
        to: ['headshotstudiopro@gmail.com'],
        cc: ccEmails,
        subject: `New Feedback: [${category || 'General'}] from ${name}`,
        html: `
          <h2>New Feedback Received (Cloudflare Universal)</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Category:</strong> ${category || 'General'}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      })
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      return new Response(JSON.stringify({ error: "Failed to send email", details: errorData.message }), {
        status: response.status,
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
