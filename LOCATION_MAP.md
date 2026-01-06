# Location Map Feature

## Overview

The Location Map feature allows users to view and manage locations on an interactive map centered on Noti, Oregon. Users can place locations on the map, view them with markers, and navigate to location details.

## Features

### Interactive Map View
- **LocationMapScreen** displays an interactive map using `react-native-maps`
- Default center: Noti, OR (42.936°N, 122.079°W)
- Map region covers a 5-degree radius (approximately 350 miles in each direction)
- Covers most of Oregon and parts of neighboring states

### Location Markers
- Locations with coordinates appear as markers on the map
- Tapping a marker shows an info card with:
  - Location name
  - Location description (first 2 lines)
  - "View Details" button to navigate to full location details
- Locations without coordinates are not shown on the map

### Coordinate Setting (LocationFormScreen)
- Interactive map picker in the location form
- Tap anywhere on the map to set the location's position
- Visual marker shows the selected position
- "Clear Map Coordinates" button to remove coordinates
- Coordinates are optional - locations can exist without map positions

## Technical Details

### Coordinate System
Locations use a normalized coordinate system (0-1) for storage:
- **x-coordinate**: 0 = west edge, 0.5 = center longitude, 1 = east edge
- **y-coordinate**: 0 = south edge, 0.5 = center latitude, 1 = north edge

This normalized system allows:
- Easy storage and portability
- Independence from specific map projections
- Simple coordinate validation (0 ≤ x,y ≤ 1)

### Coordinate Conversion
The conversion between normalized (0-1) and absolute (lat/lng) coordinates:

```typescript
// Normalized to absolute
const latitude = NOTI_OREGON.latitude + 
  (normalized.y - 0.5) * NOTI_OREGON.latitudeDelta * 2;
const longitude = NOTI_OREGON.longitude + 
  (normalized.x - 0.5) * NOTI_OREGON.longitudeDelta * 2;

// Absolute to normalized
const normalizedX = (longitude - (NOTI_OREGON.longitude - NOTI_OREGON.longitudeDelta)) / 
  (NOTI_OREGON.longitudeDelta * 2);
const normalizedY = (latitude - (NOTI_OREGON.latitude - NOTI_OREGON.latitudeDelta)) / 
  (NOTI_OREGON.latitudeDelta * 2);
```

### Data Model
```typescript
interface GameLocation {
  id: string;
  name: string;
  description: string;
  imageUri?: string;
  imageUris?: string[];
  mapCoordinates?: {
    x: number; // 0-1
    y: number; // 0-1
  };
  createdAt: string;
  updatedAt: string;
}
```

### Storage
- Map coordinates are stored with each location in AsyncStorage
- Export/Import automatically includes coordinates (no special handling needed)
- The `mapCoordinates` field is optional - backwards compatible with existing locations

## Platform Support

### Android (Primary)
- Full support with Google Maps
- Requires Google Maps API key (configured in `app.json`)
- Best user experience for mapping features

### iOS
- Supported with Apple Maps
- No API key required
- Native map experience

### Web
- Limited support (react-native-maps has reduced web functionality)
- May fall back to static map or alternative rendering
- Not recommended for primary map interactions

## Map Configuration

### app.json
```json
{
  "android": {
    "config": {
      "googleMaps": {
        "apiKey": ""
      }
    }
  }
}
```

**Note**: The API key is intentionally left empty in the repository. Users should:
1. Get their own Google Maps API key from Google Cloud Console
2. Add it to `app.json` before building for Android
3. Never commit the API key to version control

## Offline Support

The map requires an internet connection for:
- Initial tile loading
- Map rendering
- Marker display

Offline functionality:
- Location coordinates are stored locally
- Can view/edit locations without internet
- Map display requires connectivity

For fully offline maps, consider:
- Pre-cached map tiles (requires additional implementation)
- Static map images for regions
- Alternative offline mapping solutions

## Usage Examples

### Creating a Location with Coordinates
1. Navigate to Locations → Add Location
2. Enter name and description
3. Scroll to "Map Coordinates (Optional)"
4. Tap on the map where the location should be
5. Marker appears at selected position
6. Save the location

### Viewing Locations on Map
1. Navigate to Locations → Map View
2. Map displays all locations with coordinates
3. Tap a marker to see location info
4. Tap "View Details" to see full location information

### Removing Coordinates
1. Edit an existing location
2. Scroll to map section
3. Tap "Clear Map Coordinates"
4. Save changes

## Future Enhancements

Potential improvements:
- Multiple map types (satellite, terrain)
- Distance measurements
- Location clustering for dense areas
- Route planning between locations
- Custom marker icons per location type
- Search/filter locations on map
- Import coordinates from GPX/KML files
- Export map as image
