import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { useTheme } from '@/contexts/theme-provider';
import { Colors } from '@/constants/theme';

export default function HistoryScreen() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const colors = Colors[theme];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('date', 'desc'));
      const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
        const sessionsData = [];
        querySnapshot.forEach((doc) => {
          sessionsData.push({ id: doc.id, ...doc.data() });
        });
        setSessions(sessionsData);
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    } else if (!user) {
      setLoading(false);
    }
  }, [user]);

  const renderItem = ({ item }) => (
    <View style={[styles.item, { backgroundColor: colors.card }]}>
      <ThemedText style={styles.itemType}>{item.type}</ThemedText>
      <View style={styles.itemDetails}>
        <ThemedText style={styles.itemText}>{item.duration} minutes</ThemedText>
        <ThemedText style={styles.itemText}>
          {new Date(item.date.seconds * 1000).toLocaleDateString()}
        </ThemedText>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Session History</ThemedText>
      {sessions.length > 0 ? (
        <FlatList
          data={sessions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={{width: '100%'}}
        />
      ) : (
        <ThemedText>No sessions found.</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  item: {
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
    width: '100%',
  },
  itemType: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  itemText: {
    fontSize: 16,
  },
});