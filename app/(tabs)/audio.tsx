import React, { useState, useEffect } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { Button, Card, Text, TextInput, IconButton, ProgressBar } from 'react-native-paper';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RecordingItem = {
  id: string;
  uri: string;
  duration: number;
};

export default function AudioScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    setIsLoading(true);
    const data = await AsyncStorage.getItem('audioRecordings');
    if (data) setRecordings(JSON.parse(data));
    setIsLoading(false);
  };

  const saveRecordings = async (items: RecordingItem[]) => {
    await AsyncStorage.setItem('audioRecordings', JSON.stringify(items));
  };

  const handleDelete = async (id: string) => {
  Alert.alert(
    'Delete Recording',
    'Are you sure you want to delete this recording?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = recordings.filter((rec) => rec.id !== id);
          setRecordings(updated);
          await saveRecordings(updated);
        },
      },
    ]
  );
  };


  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const newItem: RecordingItem = {
        id: Date.now().toString(),
        uri: uri!,
        duration: status.durationMillis || 0,
      };
      const updated = [newItem, ...recordings];
      setRecordings(updated);
      await saveRecordings(updated);
      setRecording(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to stop recording');
    }
    setIsLoading(false);
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#f6f6f6' }}>
        <TextInput
            label="Search Recordings"
            value={search}
            onChangeText={setSearch}
            mode="outlined"
            style={{ marginBottom: 8 }}
          />
      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="Audio Recorder" />
        <Card.Content>
          <Button
            mode="contained"
            icon={recording ? 'stop' : 'microphone'}
            onPress={recording ? stopRecording : startRecording}
            loading={isLoading}
            style={{ marginVertical: 8 }}
          >
            {recording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </Card.Content>
      </Card>
      <Text variant="titleMedium" style={{ marginBottom: 8, color: 'black' }}>Recordings</Text>
      <FlatList
        data={recordings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (<RecordingCard item={item} OnDelete={() => handleDelete(item.id)}/>)}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: 'black' }}>No recordings yet.</Text>}
      />
    </View>
  );
}

function formatDuration(ms: number) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${min}:${s.toString().padStart(2, '0')}`;
}

function RecordingCard({ item, OnDelete }: { item: { id: string; uri: string; duration: number }; OnDelete: () => void; }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const playPause = async () => {
    if (!sound) {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: item.uri }, {}, onPlaybackStatusUpdate);
      setSound(newSound);
      await newSound.playAsync();
      setIsPlaying(true);
    } else if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const stop = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
      setPosition(0);
    }
  };

  return (
    <Card style={{ marginBottom: 12 }}>
      <Card.Title title={`Audio #${item.id}`} />
      <Card.Content>
        <Text>
          {formatDuration(position)} / {formatDuration(item.duration)}
        </Text>
        <ProgressBar progress={item.duration ? position / item.duration : 0} style={{ marginVertical: 8 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon={isPlaying ? 'pause' : 'play'} onPress={playPause} />
          <IconButton icon="stop" onPress={stop} />
          <IconButton icon="delete" onPress={OnDelete} />
        </View>
      </Card.Content>
    </Card>
  );
}