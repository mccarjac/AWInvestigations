# CSV Import Format

The CSV Import feature allows you to bulk import characters with their perks and distinctions from a CSV file.

## CSV Format

The CSV should follow this structure:

- **First Row (Header)**: Column 1 should be "Name", followed by character names
- **Second Row**: "Frequently Located" or "Location" with location information
- **Third Row**: "Notes" with character notes
- **Fourth Row**: "Species" with species information  
- **Subsequent Rows**: Each row represents a perk or distinction name

### Example CSV Structure:

```csv
Name,Character1,Character2,Character3
Frequently Located,Hospital,Garage,Sanguine Springs
Notes,Security android,Repair specialist,Mutant trader
Species,Human,Android,Mutant
Agile Strikes,TRUE,FALSE,TRUE
Danger Sense,FALSE,TRUE,FALSE
Apathetic,FALSE,TRUE,FALSE
Bad With Pets,TRUE,FALSE,FALSE
```

## Supported Properties

### Required Fields
- **Name**: Character names (from header row)

### Optional Fields (in order)
- **Frequently Located** or **Location**: Character location. Supports:
  - Hospital, Garage, Crafting Hall, Downtown, Sanguine Springs, Grimerust Heights
  - Partial matches work (e.g., "Repair Hall" → Garage, "Sprawl" → Downtown)
  - Unknown locations default to "Unknown"
- **Notes**: Free-text notes about the character
- **Species**: Must match valid species names exactly:
  - Base Species: Android, Drone, Human, Mutant, Nomad, Stray, Unturned, Unknown
  - Prestige Species: Cyborg, Mook, Mutoid, Perfect Mutant, Rad-Titan, Roadkill, Tech-Mutant

### Perks
Use the exact perk names as they appear in the game. Set to `TRUE` or `1` for characters who have the perk, `FALSE` or `0` for those who don't.

### Distinctions
Use the exact distinction names as they appear in the game. Set to `TRUE` or `1` for characters who have the distinction, `FALSE` or `0` for those who don't.

## Import Process

1. Click the "CSV Import" button
2. Select your CSV file
3. The system will:
   - Parse character names from the header row
   - Create new characters for each name
   - Apply species, perks, and distinctions based on TRUE/1 values
   - Generate unique IDs and timestamps for each character

## Notes

- Characters imported via CSV will have default values for fields not specified (empty factions, no notes, etc.)
- The import replaces all existing characters - use with caution
- Make sure perk and distinction names match exactly (case-sensitive)
- Unknown properties (not matching perks/distinctions/species) are ignored
- Invalid species names default to "Unknown"

## Example CSV Content

```csv
Name,Alice,Bob,Charlie
Frequently Located,Hospital,Repair Hall,Sanguine Springs
Notes,Security officer,Maintenance android,Trader from the wastes
Species,Human,Android,Mutant
Agile Strikes,TRUE,FALSE,TRUE
Danger Sense,FALSE,TRUE,FALSE
Duck And Cover,TRUE,TRUE,FALSE
Apathetic,FALSE,TRUE,FALSE
Bite Vulnerability,TRUE,FALSE,FALSE
```

This would create:
- Alice: Human at Hospital with notes "Security officer", has Agile Strikes, Duck And Cover, and Bite Vulnerability
- Bob: Android at Garage with notes "Maintenance android", has Danger Sense, Duck And Cover, and Apathetic distinction  
- Charlie: Mutant at Sanguine Springs with notes "Trader from the wastes", has Agile Strikes