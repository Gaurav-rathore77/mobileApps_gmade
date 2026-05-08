import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, SafeAreaView, StatusBar, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useUserStore } from '../store/user.native';
import { uploadPDF, getUserPDFs, askQuestion, deletePDF, PDF } from '../../api/pdfService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  type: 'user' | 'assistant';
  content: string;
}

export default function PDFAnalyzer() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.token);
  const insets = useSafeAreaInsets();
  
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [selectedPDF, setSelectedPDF] = useState<PDF | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [asking, setAsking] = useState(false);
  const [showPDFList, setShowPDFList] = useState(true);

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      setUploading(true);
      const file = result.assets[0];
      
      const uploadResult = await uploadPDF(file.uri, file.name, file.mimeType || 'application/pdf', token!);
      
      Alert.alert('Success', 'PDF uploaded and processed successfully!');
      
      // Refresh PDF list
      await loadPDFs();
    } catch (error: any) {
      console.error('Error picking PDF:', error);
      Alert.alert('Error', error.message || 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const loadPDFs = async () => {
    if (!user || !token) {
      Alert.alert('Authentication Required', 'Please login to use PDF Analyzer');
      router.replace('/login');
      return;
    }

    try {
      setLoading(true);
      const result = await getUserPDFs(token);
      setPdfs(result.pdfs);
    } catch (error: any) {
      console.error('Error loading PDFs:', error);
      if (error.message?.includes('401')) {
        Alert.alert('Authentication Error', 'Please login again');
        router.replace('/login');
      } else {
        Alert.alert('Error', 'Failed to load PDFs');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectPDF = (pdf: PDF) => {
    setSelectedPDF(pdf);
    setMessages([
      {
        type: 'assistant',
        content: `I've analyzed "${pdf.fileName}". Here's a summary:\n\n${pdf.summary}\n\nKey Points:\n${pdf.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nAsk me any questions about this document!`
      }
    ]);
    setShowPDFList(false);
  };

  const handleAsk = async () => {
    if (!question.trim() || !selectedPDF) {
      return;
    }

    const userMessage: Message = {
      type: 'user',
      content: question
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setAsking(true);

    try {
      const result = await askQuestion(selectedPDF.id, question, token!);
      
      const assistantMessage: Message = {
        type: 'assistant',
        content: result.answer
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error asking question:', error);
      Alert.alert('Error', 'Failed to get answer');
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setAsking(false);
    }
  };

  const handleDeletePDF = async (pdfId: string) => {
    Alert.alert(
      'Delete PDF',
      'Are you sure you want to delete this PDF?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePDF(pdfId, token!);
              Alert.alert('Success', 'PDF deleted successfully');
              await loadPDFs();
              if (selectedPDF?.id === pdfId) {
                setSelectedPDF(null);
                setMessages([]);
                setShowPDFList(true);
              }
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete PDF');
            }
          }
        }
      ]
    );
  };

  const backToList = () => {
    setSelectedPDF(null);
    setMessages([]);
    setShowPDFList(true);
  };

  // Load PDFs on mount
  useEffect(() => {
    if (user) {
      loadPDFs();
    }
  }, [user]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {selectedPDF && (
              <TouchableOpacity onPress={backToList} className="mr-3">
                <Text className="text-2xl">←</Text>
              </TouchableOpacity>
            )}
            <Text className="text-xl font-bold text-gray-800">
              {selectedPDF ? selectedPDF.fileName : 'PDF Analyzer'}
            </Text>
          </View>
          <TouchableOpacity onPress={pickPDF} disabled={uploading}>
            <View className={`px-4 py-2 rounded-lg ${uploading ? 'bg-gray-400' : 'bg-blue-600'}`}>
              <Text className="text-white font-semibold">
                {uploading ? 'Uploading...' : '+ Upload'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-600 mt-4">Loading PDFs...</Text>
          </View>
        ) : showPDFList ? (
          <View className="p-4">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Your PDFs ({pdfs.length})
            </Text>
            
            {pdfs.length === 0 ? (
              <View className="bg-white rounded-xl p-8 items-center">
                <Text className="text-4xl mb-4">📄</Text>
                <Text className="text-gray-600 text-center mb-4">
                  No PDFs uploaded yet
                </Text>
                <TouchableOpacity onPress={pickPDF} className="bg-blue-600 px-6 py-3 rounded-lg">
                  <Text className="text-white font-semibold">Upload First PDF</Text>
                </TouchableOpacity>
              </View>
            ) : (
              pdfs.map((pdf) => (
                <TouchableOpacity
                  key={pdf.id}
                  onPress={() => selectPDF(pdf)}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-800 mb-1">
                        {pdf.fileName}
                      </Text>
                      <View className="flex-row items-center">
                        <View className={`px-2 py-1 rounded-md ${
                          pdf.documentType === 'resume' ? 'bg-green-100' :
                          pdf.documentType === 'notes' ? 'bg-blue-100' :
                          pdf.documentType === 'contract' ? 'bg-red-100' :
                          'bg-gray-100'
                        }`}>
                          <Text className={`text-xs ${
                            pdf.documentType === 'resume' ? 'text-green-700' :
                            pdf.documentType === 'notes' ? 'text-blue-700' :
                            pdf.documentType === 'contract' ? 'text-red-700' :
                            'text-gray-700'
                          }`}>
                            {pdf.documentType}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-500 ml-2">
                          {new Date(pdf.uploadedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text className="text-gray-600 text-sm mt-2 line-clamp-2">
                        {pdf.summary}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeletePDF(pdf.id);
                      }}
                      className="ml-3"
                    >
                      <Text className="text-red-500 text-lg">🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <View className="flex-1">
            {/* Chat Messages */}
            <ScrollView className="flex-1 p-4">
              {messages.map((msg, index) => (
                <View
                  key={index}
                  className={`mb-4 ${
                    msg.type === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <View
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.type === 'user'
                        ? 'bg-blue-600'
                        : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`${
                        msg.type === 'user' ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              ))}
              {asking && (
                <View className="items-start mb-4">
                  <View className="bg-white rounded-2xl p-4">
                    <ActivityIndicator size="small" color="#2563eb" />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Question Input */}
            <View className="bg-white px-4 py-4 border-t border-gray-200">
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 bg-gray-100 rounded-full px-4 py-3 mr-3"
                  placeholder="Ask a question about this PDF..."
                  value={question}
                  onChangeText={setQuestion}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleAsk}
                  disabled={asking || !question.trim()}
                  className={`px-4 py-3 rounded-full ${
                    asking || !question.trim() ? 'bg-gray-400' : 'bg-blue-600'
                  }`}
                >
                  <Text className="text-white font-semibold">Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
