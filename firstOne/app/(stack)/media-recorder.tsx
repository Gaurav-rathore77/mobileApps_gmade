// Media Recorder Component - Audio and Video Recording
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Audio, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { uploadAudioRecording, uploadVideoRecording, getUserMediaRecordings, deleteMediaRecording } from '../../api/media';

export default function MediaRecorder() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video'>('audio');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [currentRecordingUri, setCurrentRecordingUri] = useState<string | null>(null);
  const [playingRecording, setPlayingRecording] = useState<string | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [currentPlaybackUrl, setCurrentPlaybackUrl] = useState<string | null>(null);
  
  const router = useRouter();
  const audioRecorderRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const playbackSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      // For demo, using mock user ID
      const userRecordings = await getUserMediaRecordings('demo_user');
      setRecordings(userRecordings);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const startAudioRecording = async () => {
    try {
      console.log('🎙 Starting audio recording...');
      
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record audio');
        return;
      }

      // Configure audio recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      audioRecorderRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      setCurrentRecordingUri(recording.getURI() || null);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('✅ Audio recording started');
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      Alert.alert('Error', 'Failed to start audio recording');
    }
  };

  const startVideoRecording = async () => {
    try {
      console.log('🎥 Starting video recording...');
      
      // For video, we'll use ImagePicker to record from camera
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please grant camera permission to record video');
        return;
      }

      // Launch camera for video recording
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 0.8, // High quality
        maxDuration: 300, // 5 minutes max
      } as any);

      if (!result.canceled && result.assets[0]) {
        setIsRecording(true);
        setRecordingDuration(0);
        setCurrentRecordingUri(result.assets[0].uri);
        setRecordingType('video');

        // Simulate recording timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);

        console.log('✅ Video recording started');
      }
    } catch (error) {
      console.error('Failed to start video recording:', error);
      Alert.alert('Error', 'Failed to start video recording');
    }
  };

  const stopRecording = async () => {
    try {
      console.log('⏹️ Stopping recording...');
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      if (recordingType === 'audio' && audioRecorderRef.current) {
        await audioRecorderRef.current.stopAndUnloadAsync();
        console.log('✅ Audio recording stopped');
      }

      setIsRecording(false);
      
      // Show transcript modal
      setShowTranscriptModal(true);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const saveRecording = async () => {
    if (!currentRecordingUri) {
      Alert.alert('Error', 'No recording to save');
      return;
    }

    setIsUploading(true);
    try {
      let response;
      
      if (recordingType === 'audio') {
        response = await uploadAudioRecording(
          currentRecordingUri,
          recordingDuration,
          transcript.trim() || undefined
        );
      } else {
        response = await uploadVideoRecording(
          currentRecordingUri,
          recordingDuration,
          transcript.trim() || undefined
        );
      }

      // Add to local recordings list
      const newRecording = {
        id: response.id,
        type: recordingType,
        uri: response.url,
        duration: recordingDuration,
        timestamp: new Date().toISOString(),
        transcript: transcript.trim() || undefined,
      };

      setRecordings(prev => [newRecording, ...prev]);
      
      // Reset state
      setCurrentRecordingUri(null);
      setRecordingDuration(0);
      setTranscript('');
      setShowTranscriptModal(false);
      
      Alert.alert('Success', `${recordingType === 'audio' ? 'Audio' : 'Video'} saved successfully!`);
    } catch (error) {
      console.error('Failed to save recording:', error);
      Alert.alert('Error', 'Failed to save recording');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteRecording = async (recordingId: string) => {
    try {
      await deleteMediaRecording(recordingId);
      setRecordings(prev => prev.filter(r => r.id !== recordingId));
      Alert.alert('Success', 'Recording deleted successfully');
    } catch (error) {
      console.error('Failed to delete recording:', error);
      Alert.alert('Error', 'Failed to delete recording');
    }
  };

  const playRecording = async (recording: any) => {
    try {
      console.log('🎬 Playing recording:', recording);
      
      if (recording.type === 'audio') {
        // Stop any currently playing audio
        if (playbackSoundRef.current) {
          await playbackSoundRef.current.unloadAsync();
        }
        
        // Try to load and play audio
        try {
          const audioUrl = recording.url || recording.uri;
          console.log('🎵 Playing audio URL:', audioUrl);
          
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true }
          );
          
          playbackSoundRef.current = sound;
          setPlayingRecording(recording.id);
          setCurrentPlaybackUrl(recording.url);
          setShowPlayerModal(true);
          
          // Handle playback end
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setPlayingRecording(null);
            }
          });
          
        } catch (audioError) {
          console.log('❌ Audio playback failed, trying fallback:', audioError);
          
          // Fallback: Show URL and let user open in browser
          const fallbackUrl = recording.url || recording.uri;
          console.log('🌐 Fallback URL:', fallbackUrl);
          
          Alert.alert(
            'Audio Playback Issue',
            'Cannot play audio directly. Would you like to open the file in browser?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open in Browser',
                onPress: () => {
                  Linking.openURL(fallbackUrl);
                }
              }
            ]
          );
        }
        
      } else if (recording.type === 'video') {
        // For video, just show the URL in browser
        const videoUrl = recording.url || recording.uri;
        setCurrentPlaybackUrl(videoUrl);
        setShowPlayerModal(true);
        setPlayingRecording(recording.id);
      }
      
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const stopPlayback = async () => {
    try {
      if (playbackSoundRef.current) {
        await playbackSoundRef.current.unloadAsync();
        playbackSoundRef.current = null;
      }
      setPlayingRecording(null);
      setShowPlayerModal(false);
      setCurrentPlaybackUrl(null);
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (playbackSoundRef.current) {
        playbackSoundRef.current.unloadAsync();
      }
    };
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-blue-600 p-4 shadow-lg">
        <Text className="text-white text-xl font-bold text-center">Media Recorder 🎙️🎥️</Text>
        <Text className="text-blue-100 text-center text-sm mt-1">Record audio and video with transcript</Text>
      </View>

      {/* Recording Controls */}
      <View className="p-6">
        <View className="bg-white rounded-lg p-4 shadow-md mb-4">
          <Text className="text-lg font-semibold mb-4 text-gray-800">Recording Controls</Text>
          
          {/* Recording Type Selector */}
          <View className="flex-row justify-center mb-4">
            <TouchableOpacity
              onPress={() => setRecordingType('audio')}
              className={`px-4 py-2 rounded-l-lg mr-2 ${
                recordingType === 'audio' ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <Text className={`font-semibold ${
                recordingType === 'audio' ? 'text-white' : 'text-gray-700'
              }`}>
                🎙 Audio
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setRecordingType('video')}
              className={`px-4 py-2 rounded-r-lg ${
                recordingType === 'video' ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <Text className={`font-semibold ${
                recordingType === 'video' ? 'text-white' : 'text-gray-700'
              }`}>
                🎥 Video
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recording Status */}
          <View className="items-center mb-4">
            {isRecording && (
              <View className="items-center">
                <View className="w-3 h-3 bg-red-500 rounded-full animate-pulse mb-2" />
                <Text className="text-lg font-semibold text-red-600">
                  Recording {recordingType === 'audio' ? 'Audio' : 'Video'}...
                </Text>
                <Text className="text-2xl font-bold text-gray-800">
                  {formatDuration(recordingDuration)}
                </Text>
              </View>
            )}
            
            {!isRecording && !currentRecordingUri && (
              <Text className="text-gray-600 text-center">
                Choose recording type and tap start
              </Text>
            )}
            
            {currentRecordingUri && !isRecording && (
              <Text className="text-green-600 text-center">
                Ready to save with transcript
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-center space-x-4">
            {!isRecording && !currentRecordingUri && (
              <TouchableOpacity
                onPress={recordingType === 'audio' ? startAudioRecording : startVideoRecording}
                className="bg-green-500 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-bold">Start Recording</Text>
              </TouchableOpacity>
            )}
            
            {isRecording && (
              <TouchableOpacity
                onPress={stopRecording}
                className="bg-red-500 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-bold">Stop Recording</Text>
              </TouchableOpacity>
            )}
            
            {currentRecordingUri && !isRecording && (
              <TouchableOpacity
                onPress={saveRecording}
                disabled={isUploading}
                className={`px-6 py-3 rounded-lg ${
                  isUploading ? 'bg-gray-400' : 'bg-blue-500'
                }`}
              >
                {isUploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">Save Recording</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Upload Progress */}
        {isUploading && (
          <View className="bg-blue-50 p-4 rounded-lg mb-4">
            <Text className="text-blue-600 text-center font-semibold">
              Uploading {recordingType}...
            </Text>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        )}
      </View>

      {/* Recordings List */}
      <View className="flex-1 px-6">
        <Text className="text-lg font-semibold mb-4 text-gray-800">Your Recordings</Text>
        
        <ScrollView className="flex-1">
          {recordings.length === 0 ? (
            <View className="items-center justify-center py-8">
              <Text className="text-gray-500 text-center">No recordings yet</Text>
              <Text className="text-gray-400 text-sm text-center mt-2">
                Start recording to create your first {recordingType === 'audio' ? 'audio' : 'video'}
              </Text>
            </View>
          ) : (
            recordings.map((recording) => (
              <View key={recording.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-2xl mr-2">
                        {recording.type === 'audio' ? '🎙️' : '🎥️'}
                      </Text>
                      <Text className="font-semibold text-gray-800">
                        {recording.type === 'audio' ? 'Audio' : 'Video'} Recording
                      </Text>
                      {playingRecording === recording.id && (
                        <Text className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded ml-2">
                          ▶️ Playing
                        </Text>
                      )}
                    </View>
                    
                    <Text className="text-sm text-gray-600 mb-1">
                      Duration: {formatDuration(recording.duration)}
                    </Text>
                    
                    <Text className="text-xs text-gray-500">
                      {new Date(recording.timestamp).toLocaleString()}
                    </Text>
                    
                    {recording.transcript && (
                      <Text className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                        <Text className="font-semibold text-xs text-gray-600">Transcript:</Text>
                        <Text className="text-xs mt-1">{recording.transcript}</Text>
                      </Text>
                    )}
                  </View>
                  
                  <View className="flex-column items-end space-y-2">
                    <TouchableOpacity
                      onPress={() => playRecording(recording)}
                      className="bg-green-100 p-2 rounded-lg"
                    >
                      <Text className="text-green-600 text-sm">▶️ Play</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => deleteRecording(recording.id)}
                      className="bg-red-100 p-2 rounded-lg"
                    >
                      <Text className="text-red-600 text-sm">🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Transcript Modal */}
      <Modal
        visible={showTranscriptModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-lg p-6 m-4 w-11/12">
            <Text className="text-lg font-bold mb-4 text-gray-800">
              Add Transcript (Optional)
            </Text>
            
            <Text className="text-sm text-gray-600 mb-4">
              Add transcript or notes for this {recordingType} recording:
            </Text>
            
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-gray-800 min-h-24"
              multiline
              value={transcript}
              onChangeText={setTranscript}
              placeholder="Enter transcript or notes here..."
              autoFocus
            />
            
            <View className="flex-row justify-end space-x-3 mt-4">
              <TouchableOpacity
                onPress={() => setShowTranscriptModal(false)}
                className="bg-gray-300 px-4 py-2 rounded-lg"
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={saveRecording}
                disabled={isUploading}
                className={`px-4 py-2 rounded-lg ${
                  isUploading ? 'bg-gray-400' : 'bg-blue-500'
                }`}
              >
                {isUploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Playback Modal */}
      <Modal
        visible={showPlayerModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-lg p-6 m-4 w-11/12">
            <Text className="text-lg font-bold mb-4 text-gray-800">
              {currentPlaybackUrl?.includes('audio') ? '🎙️ Audio Playback' : '🎥️ Video Playback'}
            </Text>
            
            {currentPlaybackUrl?.includes('audio') ? (
              <View className="items-center py-4">
                <Text className="text-gray-600 mb-4">Playing Audio...</Text>
                <View className="w-full h-2 bg-gray-200 rounded-full">
                  <View className="w-3/4 h-2 bg-green-500 rounded-full animate-pulse" />
                </View>
              </View>
            ) : (
              <View className="items-center py-4">
                <Text className="text-gray-600 mb-4">Video URL:</Text>
                <Text className="text-xs text-blue-600 mb-4 text-center break-all">
                  {currentPlaybackUrl}
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(currentPlaybackUrl || '')}
                  className="bg-blue-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-semibold">Open in Browser</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View className="flex-row justify-end mt-4">
              <TouchableOpacity
                onPress={stopPlayback}
                className="bg-red-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-bold">Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
