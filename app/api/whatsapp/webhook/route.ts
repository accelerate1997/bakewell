import { NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "bakewell_wa_verify_2026";

/**
 * GET handler for Meta Webhook Verification Handshake
 * Meta sends hub.mode, hub.verify_token, hub.challenge
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Check if mode and token are present in query params
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[WhatsApp Webhook] Handshake verified successfully with Meta!");
      // Respond with the challenge token from the request
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    } else {
      console.warn(
        `[WhatsApp Webhook] Verification failed. Token mismatch. Received: "${token}", Expected: "${VERIFY_TOKEN}"`
      );
      return new Response("Forbidden", { status: 403 });
    }
  } catch (error) {
    console.error("[WhatsApp Webhook GET Error]:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * POST handler for Meta Webhook Events (Delivery statuses, incoming messages)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Meta WhatsApp Cloud API payloads contain 'object: whatsapp_business_account'
    if (body.object === "whatsapp_business_account") {
      if (body.entry && body.entry.length > 0) {
        for (const entry of body.entry) {
          const changes = entry.changes || [];
          for (const change of changes) {
            const value = change.value;
            if (value) {
              // Status updates (sent, delivered, read, failed)
              if (value.statuses && value.statuses.length > 0) {
                for (const status of value.statuses) {
                  console.log(
                    `[WhatsApp Status] Message ID: ${status.id}, Status: ${status.status}, Recipient: ${status.recipient_id}`
                  );
                }
              }

              // Incoming user messages (if customer replies on WhatsApp)
              if (value.messages && value.messages.length > 0) {
                for (const msg of value.messages) {
                  console.log(
                    `[WhatsApp Incoming Message] From: ${msg.from}, Type: ${msg.type}, Text: ${msg.text?.body || "media/interactive"}`
                  );
                }
              }
            }
          }
        }
      }

      // Return 200 OK to acknowledge receipt of event to Meta
      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Not a WhatsApp API event" }, { status: 404 });
    }
  } catch (error) {
    console.error("[WhatsApp Webhook POST Error]:", error);
    // Always return 200 to prevent Meta from spamming retries on parse issues
    return NextResponse.json({ status: "ERROR_LOGGED" }, { status: 200 });
  }
}
