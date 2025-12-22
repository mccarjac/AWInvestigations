# Discord Messages Viewer

The Discord Messages Viewer provides a comprehensive interface for viewing and managing all synced Discord messages, with the ability to link messages to characters in your game.

## Features

### Message List

The main screen displays all Discord messages with the following information:

- **Discord Username** - The Discord user who sent the message
- **Discord User ID** - The unique Discord identifier (for mapping purposes)
- **Extracted Character Name** - If the message starts with `>[Name]`, that name is shown
- **Message Content** - Preview of the message text
- **Images** - Indicator if the message has attached images
- **Timestamp** - When the message was sent
- **Character Tag** - Shows which character the message is linked to (if any)

### Filtering Options

Three filter buttons at the top allow you to:

1. **All** - View all messages (default)
2. **Untagged** - Show only messages not yet linked to a character
3. **Tagged** - Show only messages already linked to characters

Each filter button displays the count of messages in that category.

### Visual Indicators

- **Untagged Messages**: Have an orange left border and "UNTAGGED" badge
- **Tagged Messages**: Show a green badge with the linked character's name
- **Extracted Names**: Displayed in a blue highlighted box with `>[Name]` format

### Character Linking

Click any message to open the linking modal, which shows:

1. **Discord User Information**
   - Username
   - User ID (for reference)

2. **Extracted Character Name** (if present)
   - Shows the name extracted from `>[Name]` format

3. **Message Preview**
   - Full message content
   - Up to 3 lines visible

4. **Images** (if present)
   - Horizontal scrollable thumbnails
   - All attached images displayed

5. **Character Selection**
   - Dropdown picker with all characters
   - Required field - must select a character to save

### Saving Character Mappings

When you save a character mapping:

1. The message is immediately updated with the character link
2. If there's an extracted character name, it's saved as an alias
3. Future messages with the same name from this user are auto-mapped
4. The list refreshes to show the updated status

## Usage Workflow

### Finding Untagged Messages

1. Open "Discord Messages" from the drawer menu
2. Click the "Untagged" filter button
3. See all messages that need character assignment
4. Each message shows the Discord user ID for reference

### Linking a Message to a Character

1. Click on any untagged message
2. Review the Discord user ID and username
3. Check if there's an extracted character name
4. Select the appropriate character from the dropdown
5. Click "Save"
6. The message is now tagged and will appear in the "Tagged" filter

### Finding Character Conversations

1. Use the "Tagged" filter to see all linked messages
2. Green badges show which character each message belongs to
3. Messages are sorted by timestamp (newest first)
4. Click any message to view full details or change the character link

## Tips

- **Use Discord User IDs** to identify who you're mapping
- **Extracted names** (>[Name]) provide hints for character selection
- **Save early, save often** - Once mapped, aliases make future messages auto-link
- **Check images** - Thumbnails in the modal help identify the conversation context
- **Filter counts** - Use the badge numbers to track your progress

## Integration with Other Features

### Character Name Mapping Screen

- Shows only messages with extracted `>[Name]` that need mapping
- Groups by unique extracted name
- Bulk mapping interface

### Discord Messages Screen

- Shows ALL messages, extracted name or not
- Individual message linking
- Full message details and context

Both screens work together:
- Use Character Name Mapping for bulk operations on extracted names
- Use Discord Messages for individual message review and linking

## Example Workflow

1. **Sync Messages** - Use Discord Setup to sync channel messages
2. **Review Untagged** - Open Discord Messages, filter to "Untagged"
3. **Link Messages** - Click each message, select character, save
4. **Verify** - Switch to "Tagged" filter to confirm all mappings
5. **Auto-Match** - Future syncs will auto-link messages using stored aliases

## Troubleshooting

**Q: I don't see any messages**
- A: Sync messages first using the Discord Setup screen
- Check that you've configured and connected to Discord

**Q: All messages show as "Untagged"**
- A: This is normal for first sync
- Start linking messages using the modal
- Future messages will auto-link based on your mappings

**Q: Character name extraction isn't working**
- A: Messages must start with exactly `>[Name]` format
- Example: `>[Marcus] Hello there!`
- Spaces around brackets are okay: `> [Marcus] Hello`

**Q: How do I see Discord user IDs?**
- A: They're shown under each username in gray text
- Format: `ID: 123456789012345678`
- Use these IDs for creating user mappings

**Q: Can I change a character mapping?**
- A: Yes! Click the message again and select a different character
- The alias will be updated automatically

## Data Privacy

- All Discord messages are stored locally on your device
- Discord user IDs are visible only to you
- Message content is stored as-is from Discord
- Images are downloaded and stored locally
- No data is sent to external servers
