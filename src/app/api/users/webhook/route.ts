import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { db } from "@/db/db";
import { usersTable } from "@/db/schema";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created") {
      await db.insert(usersTable).values({
        clerkId: evt.data.id,
        name: `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`.trim(),
        imageUrl: evt.data.image_url,
      });
    }

    if (evt.type === "user.updated") {
      await db
        .update(usersTable)
        .set({
          name: `${evt.data.first_name ?? ""} ${
            evt.data.last_name ?? ""
          }`.trim(),
          imageUrl: evt.data.image_url,
        })
        .where(eq(usersTable.clerkId, evt.data.id));
    }

    if (evt.type === "user.deleted") {
      const userId = evt.data.id;

      if (!userId) {
        return new Response("Missing user ID", { status: 400 });
      }

      await db.delete(usersTable).where(eq(usersTable.clerkId, userId));
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 400 });
  }
}
