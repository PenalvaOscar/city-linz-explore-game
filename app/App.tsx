import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { supabase } from './utils/supabase';

type Holding = { gem_id: string; player: string; held_since: string };

export default function App() {
  const [holdings, setHoldings] = useState<Holding[]>([]);

  useEffect(() => {
    const getHoldings = async () => {
      try {
        const { data, error } = await supabase.from('holdings').select();

        if (error) {
          console.error('Error fetching holdings:', error.message);
          return;
        }

        if (data && data.length > 0) {
          setHoldings(data);
        }
      } catch (error) {
        console.error('Error fetching holdings:', (error as Error).message);
      }
    };

    getHoldings();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Holdings</Text>
      <FlatList
        data={holdings}
        keyExtractor={(item) => item.gem_id}
        renderItem={({ item }) => <Text>{item.gem_id} — {item.player}</Text>}
      />
    </View>
  );
}
