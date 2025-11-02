import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/contexts/theme-provider';
import { Colors } from '@/constants/theme';

export type ThemedViewProps = ViewProps;

export function ThemedView({ style, ...otherProps }: ThemedViewProps) {
  const { theme } = useTheme();
  const backgroundColor = Colors[theme].background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
