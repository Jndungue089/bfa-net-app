import { View, type ViewStyle } from "react-native";

export const Skeleton = ({ style }: { style?: ViewStyle }) => <View style={[{ backgroundColor: "#E2E8F0", borderRadius: 10, height: 20 }, style]} />;
