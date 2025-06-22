# Clerk Authentication Setup Guide

This guide will help you set up Clerk authentication for your OCR Playground application.

## 1. Create a Clerk Account

1. Go to [clerk.com](https://clerk.com) and sign up for a free account
2. Create a new application
3. Choose "Next.js" as your framework

## 2. Configure Environment Variables

Update your `www/.env.local` file with your Clerk credentials:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Clerk Webhook (optional - for user sync)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 3. Configure Clerk Dashboard

### 3.1 Authentication Settings
1. In your Clerk dashboard, go to "Authentication" → "Email, Phone, Username"
2. Enable the authentication methods you want (email, phone, etc.)
3. Configure your sign-in and sign-up pages

### 3.2 User Management
1. Go to "Users" to see registered users
2. You can manually create users or let them sign up automatically

### 3.3 Webhooks (Optional)
1. Go to "Webhooks" in your Clerk dashboard
2. Create a new webhook endpoint: `https://your-domain.com/api/webhook/clerk`
3. Select the events you want to listen to:
   - `user.created`
   - `user.updated` 
   - `user.deleted`
4. Copy the webhook secret to your environment variables

## 4. Database Migration

Run the database migration to add user_id columns:

```bash
cd src
python migrate_add_user_id.py
```

## 5. Update Backend API (Optional)

If you want to sync user data with your backend, you can create a users endpoint:

```python
# In your FastAPI backend
@app.post("/api/users")
async def create_user(user_data: dict):
    # Create user record in your database
    pass

@app.delete("/api/users/{clerk_user_id}")
async def delete_user(clerk_user_id: str):
    # Delete user record from your database
    pass
```

## 6. Test the Setup

1. Start your development server:
   ```bash
   cd www
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. You should see the landing page with sign-in/sign-up buttons
4. Try creating an account and signing in
5. Verify that you're redirected to the dashboard after authentication

## 7. Protected Routes

The following routes are now protected and require authentication:
- `/dashboard`
- `/datasets`
- `/evaluation-runs`
- `/prompts`
- `/create-test`
- `/evaluation-report`
- `/ground-truth`

Public routes:
- `/` (landing page)
- `/sign-in`
- `/sign-up`

## 8. User Data Isolation

All database operations now include user_id filtering:
- Users can only see their own datasets, evaluations, and prompts
- API endpoints automatically filter data by the authenticated user
- New resources are automatically associated with the current user

## 9. Troubleshooting

### Common Issues:

1. **"Unauthorized" errors**: Make sure your environment variables are set correctly
2. **Database errors**: Run the migration script to add user_id columns
3. **Webhook errors**: Check that your webhook URL is accessible and the secret is correct
4. **Redirect loops**: Verify your Clerk URL configuration

### Debug Mode:

Add this to your `.env.local` for debugging:
```env
NEXT_PUBLIC_CLERK_DEBUG=true
```

## 10. Production Deployment

For production:

1. Update environment variables with production Clerk keys
2. Set up proper webhook URLs
3. Configure CORS settings if needed
4. Set up proper SSL certificates for webhooks

## 11. Security Considerations

- Never commit your Clerk secrets to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor webhook events for suspicious activity
- Implement rate limiting on your API endpoints

## 12. Next Steps

After setting up authentication, you can:

1. Add user roles and permissions
2. Implement team/workspace functionality
3. Add user profile management
4. Set up email notifications
5. Add social login providers (Google, GitHub, etc.) 