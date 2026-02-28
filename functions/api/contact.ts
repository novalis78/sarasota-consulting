interface Env {
  RESEND_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    // Check if API key is configured
    if (!context.env.RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers }
      );
    }

    const formData = await context.request.formData();
    const name = formData.get("name")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const business = formData.get("business")?.toString() || "";
    const message = formData.get("message")?.toString() || "";

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        { status: 400, headers }
      );
    }

    const resendPayload = {
      from: "Sarasota Consulting <info@sarasotaconsulting.com>",
      to: ["info@sarasotaconsulting.com"],
      reply_to: email,
      subject: `New inquiry from ${name}${business ? ` (${business})` : ""}`,
      html: `
        <h2>New Automation Audit Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Business:</strong> ${business || "Not provided"}</p>
        <p><strong>Message:</strong></p>
        <p>${message || "No message provided"}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Sent from sarasotaconsulting.com contact form</p>
      `,
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(resendPayload),
    });

    const resBody = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Resend API error", status: res.status, details: resBody }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: (resBody as Record<string, unknown>).id }),
      { status: 200, headers }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: msg }),
      { status: 500, headers }
    );
  }
};
