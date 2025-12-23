# Discord Integration

Junktown Intelligence now supports Discord integration, allowing you to import and monitor Discord channels to track conversations linked to characters.

## Overview

The Discord integration provides the following features:

- **Discord Bot Configuration**: Connect to a Discord server and channel using a bot token
- **Message Import**: Automatically fetch and store Discord messages
- **User-Character Mapping**: Link Discord users to characters in your game
- **Image Support**: Download and store images sent in Discord messages
- **Auto-Sync**: Optionally sync messages automatically when the app has internet access
- **Export/Import**: Discord logs are included in data export/import operations

## Setup Instructions

### 1. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give your application a name
4. Go to the "Bot" section
5. Click "Add Bot"
6. Copy the bot token (you'll need this later)

### 2. Configure Bot Permissions

Your bot needs the following permissions:

- Read Messages/View Channels
- Read Message History

### 3. Invite Bot to Your Server

1. Go to the "OAuth2" section in the Developer Portal
2. Select "bot" under scopes
3. Select the permissions mentioned above
4. Copy the generated URL and paste it in your browser
5. Select your server and authorize the bot

### 4. Get IDs

Enable Developer Mode in Discord:

- User Settings → Advanced → Enable Developer Mode

Then you can right-click to copy IDs:

- Right-click your server → Copy ID (Server/Guild ID - optional)
- Right-click the channel → Copy ID (Channel ID - required)
- Right-click users → Copy ID (User ID - for mapping to characters)

## Using the Discord Integration

### Configure Discord Connection

1. Open the app and navigate to "Discord Setup" from the drawer menu
2. Enter your bot token
3. Enter the channel ID you want to monitor
4. Optionally enter the guild/server ID
5. Enable the "Enable Discord Integration" toggle
6. Enable "Auto-sync when online" if you want automatic syncing
7. Click "Test Connection" to verify your setup
8. Click "Save Configuration" to save your settings

### Map Discord Users to Characters

1. Navigate to "Discord User Mapping" from the drawer menu
2. For each Discord user you want to track:
   - Enter their Discord User ID
   - Enter their Discord username (for display purposes)
   - Select the character they represent
   - Click "Add Mapping"
3. Users without mappings will still have their messages stored, but won't be linked to characters

### Sync Messages

There are two ways to sync Discord messages:

**Manual Sync:**

1. Go to "Discord Setup"
2. Click "Sync Messages Now"
3. Wait for the sync to complete

**Auto-Sync:**

- If enabled, the app will periodically check for new messages when it has internet access
- The sync happens automatically in the background

## Viewing Discord Messages

Discord messages are stored in the app and can be:

1. **Viewed by Character**: Navigate to a character's detail screen to see their Discord messages
2. **Exported**: Discord logs are included when you export your game data
3. **Imported**: Discord logs are imported when you import game data

## Data Storage

Discord data is stored locally on your device and includes:

- **Configuration**: Bot token, channel ID, sync settings
- **User Mappings**: Discord user to character associations
- **Messages**: Message content, timestamps, author information
- **Images**: Downloaded Discord images are stored locally

## Export/Import

When you export your game data:

- All Discord configuration (except the bot token for security) is included
- All user mappings are included
- All messages are included
- Discord images are packaged in the export

When you import game data:

- Discord data is merged with your existing data
- Duplicate messages are automatically filtered
- User mappings are updated

## Security Considerations

- **Bot Token**: Your Discord bot token is stored securely on your device
- **Token Export**: Bot tokens are included in exports but should be kept private
- **Permissions**: The bot only needs read permissions and cannot send messages or modify your server
- **Data Privacy**: All Discord data is stored locally on your device

## Troubleshooting

### "Connection Failed" Error

- Verify your bot token is correct
- Check that the bot is invited to your server
- Ensure the bot has read permissions for the channel
- Verify the channel ID is correct

### Messages Not Syncing

- Check that Discord integration is enabled
- Verify you have internet access
- Ensure the bot has access to the channel
- Check the last sync timestamp in Discord Setup

### User Mappings Not Working

- Verify the Discord User ID is correct (enable Developer Mode in Discord)
- Check that the user has sent messages in the monitored channel
- User mappings only apply to messages synced after the mapping is created

### Images Not Downloading

- Check your internet connection
- Verify the app has permission to write to storage
- Some Discord image URLs may expire - sync frequently for best results

## Limitations

- The bot can only read messages from channels it has access to
- Large message histories may take time to sync initially
- Discord image links may expire, so download them promptly
- The bot cannot read deleted messages
- Rate limits apply to Discord API calls (handled automatically)

## API Usage

The integration uses Discord's REST API v10:

- Messages are fetched in batches of 100
- Pagination is used to fetch message history
- Images are downloaded and stored locally
- API rate limits are respected

## Future Enhancements

Planned features for future releases:

- View Discord messages in character detail screens
- Search and filter Discord messages
- Background sync notifications
- Multi-channel support
- Discord webhook integration for posting updates

## Support

For issues or questions:

- Check the troubleshooting section above
- Review Discord's bot documentation: https://discord.com/developers/docs
- Open an issue on the GitHub repository

## Technical Details

### Data Models

**DiscordConfig**

- `botToken`: Discord bot authentication token
- `guildId`: Discord server/guild ID (optional)
- `channelId`: Discord channel ID to monitor
- `enabled`: Whether Discord integration is active
- `autoSync`: Whether to automatically sync messages
- `lastSync`: Timestamp of last successful sync

**DiscordUserMapping**

- `discordUserId`: Discord user's unique ID
- `discordUsername`: Discord username for display
- `characterId`: Linked game character ID
- `createdAt`: When the mapping was created
- `updatedAt`: When the mapping was last updated

**DiscordMessage**

- `id`: Discord message ID
- `channelId`: Channel where message was sent
- `authorId`: Discord user ID of author
- `authorUsername`: Discord username of author
- `content`: Message text content
- `timestamp`: When the message was sent
- `characterId`: Linked character ID (if mapped)
- `imageUris`: Local URIs of downloaded images
- `attachments`: Original attachment metadata
- `createdAt`: When the message was stored locally

### Storage

All Discord data is stored using AsyncStorage with the following keys:

- `gameCharacterManager_discord_config`: Discord configuration
- `gameCharacterManager_discord_mappings`: User to character mappings
- `gameCharacterManager_discord_messages`: All Discord messages

### API Integration

The Discord API integration (`src/utils/discordApi.ts`) provides:

- Bot token verification
- Channel access verification
- Message fetching with pagination
- Image downloading and storage
- Automatic sync coordination
- Connection testing

### UI Components

Two main screens are provided:

**Discord Configuration Screen** (`src/screens/discord/DiscordConfigScreen.tsx`)

- Configure bot token and channel ID
- Test connection
- Trigger manual sync
- View sync status and last sync time
- Enable/disable auto-sync

**Discord User Mapping Screen** (`src/screens/discord/DiscordUserMappingScreen.tsx`)

- Add new user to character mappings
- View existing mappings
- Delete mappings
- See character associations
