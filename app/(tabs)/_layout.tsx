import { PaperProvider } from 'react-native-paper';
import { Tabs } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <PaperProvider>
      <Tabs>
        <Tabs.Screen
          name="audio"
          options={{
            title: 'Audio',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="keyboard-voice" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="files"
          options={{
            title: 'Files',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="file-upload" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </PaperProvider>
  );
}
