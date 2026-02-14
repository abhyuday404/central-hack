// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  // Navigation / Tab bar
  "house.fill": "home",
  "folder.fill": "folder",
  "staroflife.fill": "emergency",
  "lock.shield.fill": "security",
  "person.fill": "person",

  // General UI
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "chevron.left.forwardslash.chevron.right": "code",
  "arrow.up.right": "open-in-new",
  "bell.fill": "notifications",
  ellipsis: "more-horiz",
  magnifyingglass: "search",
  pencil: "edit",
  xmark: "close",
  checkmark: "check",
  "paperplane.fill": "send",

  // Documents / Records
  "doc.text.fill": "description",
  "checkmark.seal.fill": "verified",

  // Medical / Health
  "heart.fill": "favorite",
  "heart.text.square.fill": "monitor-heart",
  "pills.fill": "medication",
  "cross.case.fill": "medical-services",
  "person.fill.viewfinder": "center-focus-strong",
  "checkmark.shield.fill": "verified-user",

  // Communication
  "phone.fill": "phone",
  "location.fill": "location-on",

  // Profile / Settings
  faceid: "fingerprint",
  "key.fill": "vpn-key",
  "clock.fill": "schedule",
  "questionmark.circle.fill": "help",
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mappedName = MAPPING[name] ?? "help-outline";
  return (
    <MaterialIcons color={color} size={size} name={mappedName} style={style} />
  );
}
