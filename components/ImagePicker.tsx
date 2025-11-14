import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useImageUpload } from '../hooks/useImageUpload';

interface ImagePickerProps {
  onImagesSelected?: (images: any[]) => void;
  maxImages?: number;
  allowMultiple?: boolean;
  initialImages?: string[];
  style?: any;
  placeholder?: string;
  showCamera?: boolean;
  imageStyle?: any;
  quality?: number;
}

interface SelectedImage {
  uri: string;
  url?: string;
  public_id?: string;
  isUploaded: boolean;
}

const ImagePickerComponent: React.FC<ImagePickerProps> = ({
  onImagesSelected,
  maxImages = 1,
  allowMultiple = false,
  initialImages = [],
  style,
  placeholder = "Seleccionar imagen",
  showCamera = true,
  imageStyle,
  quality = 0.8,
}) => {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>(
    initialImages.map(uri => ({ uri, isUploaded: true }))
  );

  const {
    uploading,
    uploadProgress,
    pickAndUploadImage,
    takePhotoAndUpload,
    deleteImage,
  } = useImageUpload();

  const handleAddImage = () => {
    if (selectedImages.length >= maxImages) {
      Alert.alert(
        'Límite alcanzado',
        `Solo puedes seleccionar hasta ${maxImages} imagen${maxImages > 1 ? 'es' : ''}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const options = [
      {
        text: 'Galería',
        onPress: handlePickFromGallery,
      },
    ];

    if (showCamera) {
      options.unshift({
        text: 'Cámara',
        onPress: handleTakePhoto,
      });
    }

    options.push({
      text: 'Cancelar',
      style: 'cancel' as const,
    });

    Alert.alert(
      'Seleccionar imagen',
      'Elige una opción',
      options
    );
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await pickAndUploadImage({
        allowsEditing: true,
        quality,
      });

      if (result) {
        const newImage: SelectedImage = {
          uri: result.secure_url || result.url,
          url: result.secure_url || result.url,
          public_id: result.public_id,
          isUploaded: true,
        };

        const updatedImages = [...selectedImages, newImage];
        setSelectedImages(updatedImages);
        onImagesSelected?.(updatedImages);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await takePhotoAndUpload({
        allowsEditing: true,
        quality,
      });

      if (result) {
        const newImage: SelectedImage = {
          uri: result.secure_url || result.url,
          url: result.secure_url || result.url,
          public_id: result.public_id,
          isUploaded: true,
        };

        const updatedImages = [...selectedImages, newImage];
        setSelectedImages(updatedImages);
        onImagesSelected?.(updatedImages);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const image = selectedImages[index];

    Alert.alert(
      'Eliminar imagen',
      '¿Estás seguro de que quieres eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            // If the image was uploaded to Cloudinary, delete it
            if (image.public_id && image.isUploaded) {
              await deleteImage(image.public_id);
            }

            const updatedImages = selectedImages.filter((_, i) => i !== index);
            setSelectedImages(updatedImages);
            onImagesSelected?.(updatedImages);
          },
        },
      ]
    );
  };

  const renderImageItem = (image: SelectedImage, index: number) => (
    <View key={index} style={styles.imageContainer}>
      <Image
        source={{ uri: image.uri }}
        style={[styles.selectedImage, imageStyle]}
      />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveImage(index)}
      >
        <Ionicons name="close-circle" size={24} color="#EF4444" />
      </TouchableOpacity>

      {!image.isUploaded && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.uploadingText}>Subiendo...</Text>
        </View>
      )}
    </View>
  );

  const renderAddButton = () => (
    <TouchableOpacity
      style={[styles.addCard, style]}
      onPress={handleAddImage}
      disabled={uploading || selectedImages.length >= maxImages}
    >
      {uploading ? (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.uploadingText}>
            {uploadProgress > 0 ? `${uploadProgress}%` : 'Subiendo...'}
          </Text>
        </View>
      ) : (
        <>
          <Ionicons
            name="add-circle-outline"
            size={28}
            color={selectedImages.length >= maxImages ? "#9CA3AF" : "#2563EB"}
          />
          <Text style={styles.addCardText}>Agregar</Text>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.imagesScroll}
      >
        {selectedImages.map(renderImageItem)}
        {selectedImages.length < maxImages && renderAddButton()}
      </ScrollView>
      {selectedImages.length > 0 && (
        <Text style={styles.counterText}>
          {selectedImages.length} de {maxImages} imagen{maxImages > 1 ? 'es' : ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  imagesScroll: {
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  addButtonText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '500',
    marginTop: 8,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  uploadingContainer: {
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  counterText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  addCard: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginRight: 12,
  },
  addCardText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
    marginTop: 4,
  },
});

export default ImagePickerComponent;
