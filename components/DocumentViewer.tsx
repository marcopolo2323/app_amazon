import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

interface Document {
  type: string;
  url: string;
  label: string;
}

interface DocumentViewerProps {
  visible: boolean;
  documents: Document[];
  affiliateName: string;
  onClose: () => void;
}

export default function DocumentViewer({
  visible,
  documents,
  affiliateName,
  onClose,
}: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Documentos de {affiliateName}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Document List */}
        {!selectedDoc ? (
          <ScrollView style={styles.documentList}>
            <Text style={styles.sectionTitle}>Documentos Subidos</Text>
            {documents.map((doc, index) => (
              <TouchableOpacity
                key={index}
                style={styles.documentItem}
                onPress={() => setSelectedDoc(doc)}
              >
                <View style={styles.documentIcon}>
                  <Ionicons name="document-text" size={32} color="#2563EB" />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentLabel}>{doc.label}</Text>
                  <Text style={styles.documentType}>{doc.type}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            ))}

            {documents.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyText}>No hay documentos disponibles</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          /* Document Viewer */
          <View style={styles.viewerContainer}>
            <View style={styles.viewerHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedDoc(null)}
              >
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.viewerTitle}>{selectedDoc.label}</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={styles.imageContainer}
              contentContainerStyle={styles.imageContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
            >
              {imageLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#2563EB" />
                </View>
              )}
              <Image
                source={{ uri: selectedDoc.url }}
                style={styles.documentImage}
                resizeMode="contain"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
            </ScrollView>

            <View style={styles.viewerActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    if (!selectedDoc) return;
                    
                    // Generar nombre de archivo único
                    const fileName = `${selectedDoc.label.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
                    const fileUri = FileSystem.documentDirectory + fileName;
                    
                    // Mostrar indicador de descarga
                    Alert.alert('Descargando', 'Por favor espera...');
                    
                    // Descargar el archivo
                    const downloadResult = await FileSystem.downloadAsync(
                      selectedDoc.url,
                      fileUri
                    );
                    
                    if (downloadResult.status === 200) {
                      // Verificar si se puede compartir
                      const canShare = await Sharing.isAvailableAsync();
                      
                      if (canShare) {
                        // Compartir el archivo (esto también permite guardar)
                        await Sharing.shareAsync(downloadResult.uri, {
                          mimeType: 'image/jpeg',
                          dialogTitle: 'Guardar o compartir documento',
                          UTI: 'public.jpeg',
                        });
                        Alert.alert('Éxito', 'Documento descargado correctamente');
                      } else {
                        Alert.alert(
                          'Descargado',
                          `Documento guardado en: ${downloadResult.uri}`
                        );
                      }
                    } else {
                      throw new Error('Error al descargar');
                    }
                  } catch (error) {
                    console.error('Error downloading document:', error);
                    Alert.alert(
                      'Error',
                      'No se pudo descargar el documento. Verifica tu conexión a internet.'
                    );
                  }
                }}
              >
                <Ionicons name="download-outline" size={24} color="#2563EB" />
                <Text style={styles.actionButtonText}>Descargar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    if (!selectedDoc) return;
                    
                    // Verificar si se puede compartir
                    const canShare = await Sharing.isAvailableAsync();
                    
                    if (!canShare) {
                      Alert.alert(
                        'No disponible',
                        'La función de compartir no está disponible en este dispositivo'
                      );
                      return;
                    }
                    
                    // Descargar temporalmente para compartir
                    const fileName = `${selectedDoc.label.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
                    const fileUri = FileSystem.cacheDirectory + fileName;
                    
                    const downloadResult = await FileSystem.downloadAsync(
                      selectedDoc.url,
                      fileUri
                    );
                    
                    if (downloadResult.status === 200) {
                      // Compartir el archivo
                      await Sharing.shareAsync(downloadResult.uri, {
                        mimeType: 'image/jpeg',
                        dialogTitle: 'Compartir documento',
                      });
                    } else {
                      throw new Error('Error al preparar el documento');
                    }
                  } catch (error) {
                    console.error('Error sharing document:', error);
                    Alert.alert(
                      'Error',
                      'No se pudo compartir el documento. Intenta de nuevo.'
                    );
                  }
                }}
              >
                <Ionicons name="share-outline" size={24} color="#2563EB" />
                <Text style={styles.actionButtonText}>Compartir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  documentList: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  documentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  viewerContainer: {
    flex: 1,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  imageContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentImage: {
    width: width,
    height: height * 0.7,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  viewerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
});
