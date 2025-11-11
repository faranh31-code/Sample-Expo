import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { FocusSession, useFirestore } from "@/contexts/FirestoreContext";
import { useTheme } from "@/contexts/theme-provider";
import { FontAwesome6 } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const HistoryView = () => {
  const {
    filteredSessions,
    loading,
    setFilterDate,
    clearFilter,
    filterDate,
  } = useFirestore();
  const { theme } = useTheme();
  const themeColors = Colors[theme];

  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowDatePicker(Platform.OS === "ios");
    
    // If user cancels (Android) or clears the date
    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    // Normalize the date to midnight to ensure consistent date comparison
    const normalizedDate = new Date(selectedDate);
    normalizedDate.setHours(0, 0, 0, 0);
    
    setFilterDate(normalizedDate);
  };

  const renderSessionItem = ({ item }: { item: FocusSession }) => (
    <View style={[styles.historyItem, { backgroundColor: themeColors.card }]}>
      <FontAwesome6
        name={item.status === "Completed" ? "check-circle" : "times-circle"}
        size={24}
        color={
          item.status === "Completed"
            ? themeColors.accent
            : themeColors.destructive
        }
      />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <ThemedText type="defaultSemiBold">Session {item.status}</ThemedText>
        <ThemedText type="default" style={{ opacity: 0.7, marginTop: 4 }}>
          {item.timestamp.toDate().toLocaleString()}
        </ThemedText>
      </View>
      <View
        style={[
          styles.durationBadge,
          { borderColor: themeColors.border, backgroundColor: themeColors.background },
        ]}
      >
        <Text style={{ color: themeColors.text, fontWeight: "600" }}>
          {item.duration} min
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.historyContainer}>
      <ThemedText
        type="subtitle"
        style={{ marginBottom: 16, textAlign: "center" }}
      >
        Forest History
      </ThemedText>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={[styles.button, { backgroundColor: themeColors.card }]}
        >
          <Text style={{ color: themeColors.text }}>
            {filterDate ? filterDate.toLocaleDateString() : "Filter by Date"}
          </Text>
        </TouchableOpacity>
        {filterDate && (
          <TouchableOpacity
            onPress={clearFilter}
            style={[styles.button, { backgroundColor: themeColors.card }]}
          >
            <Text style={{ color: themeColors.text }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={filterDate || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {loading ? (
        <ActivityIndicator
          size="large"
          color={themeColors.tint}
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 10 }}
          ListEmptyComponent={
            <ThemedText
              style={{ textAlign: "center", marginTop: 40, opacity: 0.7 }}
            >
              No sessions found.
            </ThemedText>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  historyContainer: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent", // Handled by card background
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    marginHorizontal: 4, // for shadow to appear
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  durationBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "center",
  },
});

export default HistoryView;
