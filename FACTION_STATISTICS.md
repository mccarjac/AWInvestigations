# Faction Statistics and Relationships

This document explains the new faction statistics and relationship features added to Junktown Intelligence.

## Overview

The enhanced factions feature provides:

1. **Faction Statistics** - Detailed analysis of each faction's strengths and capabilities
2. **Faction Relationships** - Alliances and rivalries between factions
3. **Combined Force Analysis** - Calculate combined strength when factions work together

## Features

### Faction Statistics Screen

Access via the drawer menu: **Faction Statistics**

#### What it shows:

- **Perk Tag Analysis**: Visual breakdown of combat and skill capabilities
  - Each tag (Agility, Strength, Medical, etc.) shows total occurrences from member perks
  - Color-coded bars make it easy to identify faction specializations
- **Common Perks**: Top 5 most frequent perks among faction members
  - Helps identify standard training/equipment
  - Shows percentage of members with each perk

- **Common Distinctions**: Top 5 most frequent distinctions
  - Reveals special characteristics of faction members
  - Useful for understanding faction culture

- **Species Distribution**: Breakdown of member species
  - Shows faction diversity
  - Important for planning that considers species abilities

- **Relationships**: Allied and enemy factions
  - Quick overview of faction diplomacy
  - Clickable to navigate to related factions

- **Combined Force Analysis**:
  - Shows total strength when allied factions work together
  - Includes combined member count
  - Shows merged perk tag capabilities
  - Displays strength multiplier (combined vs direct forces)

### Faction Relationships

#### Adding Relationships

1. Navigate to **Factions** in the drawer menu
2. Select a faction or create a new one
3. Tap **Edit** (pencil icon) to enter edit mode
4. Scroll to **Faction Relationships** section
5. Tap **+ Add Relationship**
6. Select a faction and relationship type:
   - **Ally**: Close partnership, combined forces considered
   - **Friend**: Positive relationship
   - **Neutral**: No special relationship
   - **Hostile**: Antagonistic relationship
   - **Enemy**: Active conflict

#### Viewing Relationships

On the Faction Details screen, relationships are displayed with:

- Color-coded badges (green for allies, red for enemies, etc.)
- Tap any relationship to navigate to that faction
- Shows in both Faction Details and Statistics screens

#### Managing Relationships

- **Edit**: Tap the edit button on faction details, modify relationships
- **Remove**: When editing, tap the × button on any relationship
- Relationships are one-directional (Faction A allied with B doesn't mean B is allied with A)

## Use Cases

### Campaign Planning

**Scenario**: Planning an assault on an enemy stronghold

1. Go to **Faction Statistics**
2. Check enemy faction's perk tags - identify their strengths (e.g., high Defense, Medical)
3. Check your allied factions in the Combined Force Analysis
4. Compare combined perk tags to identify if you have tactical advantages
5. Review common perks to anticipate specific threats

### Faction Management

**Scenario**: Deciding which faction to ally with

1. Review each potential ally's statistics
2. Compare their perk tag strengths to yours
3. Check if their specializations complement yours
4. Look at their existing allies and enemies
5. Consider how combined forces would compare to known threats

### Character Recruitment

**Scenario**: Recruiting characters for your faction

1. Check your faction's current statistics
2. Identify weak perk tags (low counts)
3. Look at common perks - consider what's missing
4. Recruit characters with perks that fill gaps
5. Monitor statistics to see improvement

## Data Model

### FactionRelationship Interface

```typescript
interface FactionRelationship {
  factionName: string;
  relationshipType: RelationshipStanding;
  description?: string;
}
```

### FactionStats Interface

```typescript
interface FactionStats {
  factionName: string;
  totalMembers: number;
  presentMembers: number;
  perkTagCounts: Record<PerkTag, number>;
  topPerkTags: Array<{ tag: PerkTag; count: number; percentage: number }>;
  commonPerks: Array<{ name: string; count: number; percentage: number }>;
  commonDistinctions: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  speciesDistribution: Record<string, number>;
  relationships: FactionRelationship[];
  alliedFactions: string[];
  enemyFactions: string[];
}
```

## Implementation Details

### Perk Tag Calculation

- Iterates through all faction members (only Ally/Friend standing count as members)
- For each member, examines their perks
- Counts occurrences of each perk tag across all perks
- Tags can appear multiple times if a member has multiple perks with the same tag

### Combined Force Analysis

When factions have allied relationships:

1. Calculates base stats for the main faction
2. Finds all allied factions (Ally/Friend relationship types)
3. For each allied faction:
   - Adds their member count to combined total
   - Merges their perk tag counts into combined totals
4. Calculates strength multiplier (combined/direct ratio)

**Note**: Combined analysis only includes direct allies, not allies of allies (no recursive expansion)

### Storage

- Faction relationships stored in `AsyncStorage` under `gameCharacterManager_factions`
- Each faction maintains its own list of relationships
- Relationships are persisted when creating or updating factions
- Backward compatible - old factions get empty relationships array

## Tips

### Performance

- Statistics are calculated on-demand when viewing the screen
- Large factions (50+ members) may take a moment to calculate
- Retired factions and characters are excluded from calculations

### Best Practices

1. **Keep relationships updated** - Remove obsolete alliances/conflicts
2. **Use consistent relationship types** - Ally for combat partnerships, Friend for diplomatic ties
3. **Review regularly** - Faction capabilities change as members join/leave
4. **Plan strategically** - Combined force analysis helps with coalition building

### Troubleshooting

**Q: Why don't I see any statistics?**

- Ensure factions have members (characters with Ally/Friend standing)
- Check that characters aren't all retired
- Verify faction isn't marked as retired

**Q: Combined analysis shows no difference?**

- Faction may have no allied relationships defined
- Allied factions may have no members
- Check relationship types (must be Ally or Friend)

**Q: Perk tags seem wrong?**

- Verify character perks are assigned correctly
- Check that perk definitions include proper tags
- Remember: tags are cumulative across all member perks

## Future Enhancements

Potential future additions:

- Historical tracking of faction strength over time
- Conflict simulation based on statistics
- Automatic suggestion of complementary allies
- Export statistics to CSV for external analysis
- Faction power rankings across all factions
- Recursive ally analysis (allies of allies)
- Weighted analysis based on character presence status
