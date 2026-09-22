import { Image, View } from "react-native";
import { Text } from "../primitives/Text";
import { Button } from "./Button";
import { TextField } from "./TextField";
import { LocationPinIcon } from "@rescue-alert/icons";

export interface LocationFieldProps {
  /** A static map image URL centered on the current point, if one has been picked. MAP-006/007: no live map dependency here - Part 9 wires the real interactive map. */
  mapPreviewUri?: string;
  landmark: string;
  onLandmarkChange: (value: string) => void;
  onUseGps: () => void;
  onAdjustOnMap: () => void;
  helpText?: string;
  errorText?: string;
  className?: string;
}

/**
 * design/DESIGN.md section 11.3 "Location field", section 14.3 report
 * flow step 4. CASE-006/PERM-005: manual entry must always be
 * available even when GPS/map interaction is denied or unused -
 * onAdjustOnMap and the landmark field work independently of onUseGps.
 */
export function LocationField({
  mapPreviewUri,
  landmark,
  onLandmarkChange,
  onUseGps,
  onAdjustOnMap,
  helpText,
  errorText,
  className,
}: LocationFieldProps) {
  return (
    <View className={["gap-3", className].filter(Boolean).join(" ")}>
      <View className="h-32 w-full items-center justify-center overflow-hidden rounded-medium bg-surface-strong">
        {mapPreviewUri ? (
          <Image
            source={{ uri: mapPreviewUri }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityLabel="Map preview of the selected location"
          />
        ) : (
          <View className="items-center gap-1">
            <LocationPinIcon size={24} className="text-text-muted" />
            <Text tone="muted" variant="caption">
              No location set yet
            </Text>
          </View>
        )}
      </View>
      <View className="flex-row gap-2">
        <Button variant="outline" onPress={onUseGps}>
          Use my location
        </Button>
        <Button variant="outline" onPress={onAdjustOnMap}>
          Adjust on map
        </Button>
      </View>
      <TextField
        label="Landmark"
        value={landmark}
        onChangeText={onLandmarkChange}
        placeholder="e.g. Near Dhanmondi Lake, gate 4"
        helpText={helpText}
        errorText={errorText}
      />
    </View>
  );
}
