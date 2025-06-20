import React, { useState, useEffect } from 'react';
import { View, FlatList, Modal, Image, ScrollView, Pressable, Alert } from 'react-native';
import { Button, Card, Text, IconButton, TextInput } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';

type FileItem = {
  id: string;
  name: string;
  uri: string;
  type: string;
  date: string;
};

export default function FilesScreen() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [search, setSearch] = useState('');
  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    const data = await AsyncStorage.getItem('storedFiles');
    if (data) setFiles(JSON.parse(data));
    setIsLoading(false);
  };

  const saveFiles = async (items: FileItem[]) => {
    await AsyncStorage.setItem('storedFiles', JSON.stringify(items));
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newItem: FileItem = {
          id: Date.now().toString(),
          name: asset.name ?? 'Unknown',
          uri: asset.uri,
          type: asset.mimeType || 'unknown',
          date: new Date().toISOString(),
        };
        const updated = [newItem, ...files];
        setFiles(updated);
        await saveFiles(updated);
      }
    } catch (err) {
      alert('Failed to pick file');
    }
  };

  const openFile = (item: FileItem) => setPreviewFile(item);
  const closePreview = () => setPreviewFile(null);

  const getTypeLabel = (type: string) => {
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('image')) return 'Image';
    if (type.includes('video')) return 'Video';
    if (type.includes('excel') || type.includes('spreadsheet') || type.includes('sheet')) return 'Excel';
    return 'File';
  };

  const handleDelete = (id: string) => {
  const fileToDelete = files.find(f => f.id === id);
  Alert.alert(
    'Delete File',
    `Are you sure you want to delete "${fileToDelete?.name}"?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = files.filter((f) => f.id !== id);
          setFiles(updated);
          await saveFiles(updated);
        },
      },
    ]
  );
};


  const renderPreview = () => {
    if (!previewFile) return null;
    if (previewFile.type.includes('image')) {
  return (
    <ScrollView
      maximumZoomScale={5}
      minimumZoomScale={1}
      contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <Image
        source={{ uri: previewFile.uri }}
        style={{ width: '100%', height: 300 }}
        resizeMode="contain"
      />
    </ScrollView>
  );
}

    if (previewFile.type.includes('video')) {
      return (
        <Video
          source={{ uri: previewFile.uri }}
          style={{ width: '100%', height: 300 }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
        />
      );
    }
    if (previewFile.type.includes('pdf')) {
      return (
        <Text style={{ textAlign: 'center', margin: 20, color: 'black' }}>
          PDF preview is not supported in Expo Go. Use a custom dev client or production build.
        </Text>
      );
    }
    if (previewFile.type.includes('excel') || previewFile.name.endsWith('.xls') || previewFile.name.endsWith('.xlsx')) {
      return (
        <Text style={{ textAlign: 'center', margin: 20, color: 'black' }}>
          Excel preview is not supported. You can download and open this file in Excel.
        </Text>
      );
    }
    return (
      <Text style={{ textAlign: 'center', margin: 20, color: 'black' }}>Preview not supported for this file type.</Text>
    );
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#f6f6f6' }}>
      <TextInput
        label="Search Files"
        value={search}
        onChangeText={setSearch}
        mode="outlined"
        style={{ marginBottom: 8 }}
       />
      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="Files" />
        <Card.Content>
          <Button mode="contained" icon="plus" onPress={pickFile} loading={isLoading} style={{ marginVertical: 8 }}>
            Pick File
          </Button>
        </Card.Content>
      </Card>
      <Text variant="titleMedium" style={{ marginBottom: 8, color: 'black' }}>Your Files</Text>
      <FlatList
        data={filteredFiles}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <Card.Title title={item.name} subtitle={getTypeLabel(item.type)} />
            <Card.Content>
              <Text style={{ fontSize: 12, color: '#888' }}>{new Date(item.date).toLocaleString()}</Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => openFile(item)}>Preview</Button>
              <IconButton icon="delete" onPress={() => handleDelete(item.id)} />
            </Card.Actions>
          </Card>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: 'black' }}>No files stored yet.</Text>}
      />

      <Modal visible={!!previewFile} animationType="slide" onRequestClose={closePreview} transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 16, maxHeight: '80%' }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>{previewFile?.name}</Text>
            {renderPreview()}
            <Pressable onPress={closePreview} style={{ marginTop: 16, alignSelf: 'center' }}>
              <Text style={{ color: 'blue', fontWeight: 'bold' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}