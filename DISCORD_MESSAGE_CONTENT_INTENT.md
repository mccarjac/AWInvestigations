# Discord Message Content Intent Fix

## Problem

If you're seeing `(empty)` for all message content when syncing Discord messages, even though messages have text in Discord, this is due to a missing **MESSAGE CONTENT Intent** permission.

## Root Cause

As of 2022, Discord requires bots to explicitly request the `MESSAGE_CONTENT` privileged intent to read message content. Without this intent enabled, the Discord API returns messages with:

- `content: ""` (empty string)
- No message text
- Attachments and embeds still work

## How to Fix

### Step 1: Go to Discord Developer Portal

1. Visit https://discord.com/developers/applications
2. Log in with your Discord account
3. Click on your bot application

### Step 2: Enable MESSAGE_CONTENT Intent

1. Click on the **"Bot"** tab in the left sidebar
2. Scroll down to the **"Privileged Gateway Intents"** section
3. Find **"MESSAGE CONTENT INTENT"**
4. Toggle it **ON** (enable it)
5. Click **"Save Changes"**

![Discord Bot Intents](https://i.imgur.com/example.png)

### Step 3: Verify Bot Has Access

After enabling the intent:

1. The bot may need to be re-invited to your server (if it was already invited)
2. Or just wait a few minutes for Discord to propagate the change
3. Try syncing messages again in the app

### Step 4: Re-sync Messages

1. In the app, go to **Discord Setup** screen
2. Click **"Sync Messages Now"**
3. Check the console logs - you should now see actual message content instead of "(empty)"

## Verification

After enabling MESSAGE_CONTENT intent, the console logs should show:

```
[Discord API] Fetched 100 messages from Discord API
[Discord API] Sample message content: >>Marcus Hello everyone, how are you today?
[Discord API] Content field type: string | Is undefined: false | Is empty string: false
```

Instead of:

```
[Discord API] Fetched 100 messages from Discord API
[Discord API] Sample message content: (empty)
[Discord API] Content field type: string | Is undefined: false | Is empty string: true
```

## Additional Notes

### Why This Happens

Discord introduced privileged intents for privacy and security reasons. Bots must explicitly request permission to:

- Read message content (MESSAGE_CONTENT intent)
- See server member lists (SERVER_MEMBERS intent)
- Track member presence (PRESENCE_UPDATE intent)

### Alternative: Use Verified Bots

If your bot serves more than 100 servers, you'll need to:

1. Verify your bot with Discord
2. Provide justification for needing MESSAGE_CONTENT intent
3. Wait for Discord approval

For personal/small server use, the toggle is immediately available.

### What Works Without MESSAGE_CONTENT Intent

Even without the intent, bots can still:

- See message metadata (ID, timestamp, author)
- See attachments and embeds
- Respond to commands
- See messages mentioned with `@bot`

But they **cannot** see the actual text content of messages.

## Troubleshooting

**Q: I enabled the intent but still see empty content**

- Wait 5-10 minutes for Discord to propagate the change
- Try kicking and re-inviting the bot to your server
- Verify the bot token is correct

**Q: The toggle is grayed out**

- Your bot serves 100+ servers and needs verification
- Or your account doesn't have permission to edit the bot

**Q: I don't see the Privileged Gateway Intents section**

- Make sure you're in the "Bot" tab, not "General Information"
- Check that you have permission to edit the bot application

## More Information

- [Discord Developer Docs - Gateway Intents](https://discord.com/developers/docs/topics/gateway#gateway-intents)
- [Discord Developer Docs - Privileged Intents](https://discord.com/developers/docs/topics/gateway#privileged-intents)
- [Discord Developer Portal](https://discord.com/developers/applications)

## Summary

**TL;DR**: Go to Discord Developer Portal → Your Bot → Bot tab → Enable "MESSAGE CONTENT INTENT" → Save → Re-sync messages in app.
