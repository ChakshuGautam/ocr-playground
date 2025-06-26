import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = (await headerPayload).get("svix-id");
  const svix_timestamp = (await headerPayload).get("svix-timestamp");
  const svix_signature = (await headerPayload).get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    // You can sync user data to your backend here if needed
    console.log('User created:', { id, email_addresses, first_name, last_name });
    
    // Example: Send user data to your backend
    try {
      await fetch(`${process.env.BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_user_id: id,
          email: email_addresses[0]?.email_address,
          first_name,
          last_name,
        }),
      });
    } catch (error) {
      console.error('Error syncing user to backend:', error);
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    console.log('User updated:', { id, email_addresses, first_name, last_name });
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    console.log('User deleted:', { id });
    
    // You can clean up user data from your backend here
    try {
      await fetch(`${process.env.BACKEND_URL}/api/users/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting user from backend:', error);
    }
  }

  return NextResponse.json({ success: true });
} 