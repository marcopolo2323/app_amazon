import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../stores/auth';
import { Api } from '../lib/api';

interface ImageUploadOptions {
  allowsEditing?: boolean;
  allowsMultipleSelection?: boolean;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  folder?: string;
}

interface ImageUploadResult {
  url: string;
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
}

interface UseImageUploadReturn {
  uploading: boolean;
  uploadProgress: number;
  pickAndUploadImage: (options?: ImageUploadOptions) => Promise<ImageUploadResult | null>;
  pickAndUploadMultiple: (options?: ImageUploadOptions) => Promise<ImageUploadResult[] | null>;
  takePhotoAndUpload: (options?: ImageUploadOptions) => Promise<ImageUploadResult | null>;
  uploadFromUri: (uri: string, fileName?: string) => Promise<ImageUploadResult | null>;
  deleteImage: (publicId: string) => Promise<boolean>;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const token = useAuthStore((state) => state.token);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a tu galería para subir imágenes.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a tu cámara para tomar fotos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  const validateImage = (uri: string): boolean => {
    // Accept content/file/data URIs even if they don't have an extension
    const hasKnownScheme = uri.startsWith('content://') || uri.startsWith('file://') || uri.startsWith('data:');
    const extension = uri.split('.').pop()?.toLowerCase();

    if (!extension) {
      // No extension: allow if it looks like an image path
      return hasKnownScheme;
    }

    if (!allowedExtensions.includes(extension)) {
      Toast.show({
        type: 'error',
        text1: 'Formato no soportado',
        text2: 'Solo se permiten imágenes JPG, PNG y WebP'
      });
      return false;
    }
    return true;
  };

  const uploadSingleImage = async (
    uri: string,
    fileName: string = `image_${Date.now()}.jpg`
  ): Promise<ImageUploadResult | null> => {
    if (!token) {
      Toast.show({
        type: 'error',
        text1: 'Error de autenticación',
        text2: 'Debes iniciar sesión para subir imágenes'
      });
      return null;
    }

    if (!validateImage(uri)) {
      return null;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await Api.uploadImage(token, uri, fileName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      Toast.show({
        type: 'success',
        text1: 'Imagen subida',
        text2: 'La imagen se subió correctamente'
      });

      return result;
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error al subir imagen',
        text2: error.message || 'Intenta nuevamente'
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const pickAndUploadImage = async (
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        quality: options.quality ?? 0.8,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const assetFileName = (asset as any).fileName as string | undefined;
      const derivedExt = assetFileName?.split('.').pop()?.toLowerCase()
        || asset.uri.split('.').pop()?.toLowerCase();
      const safeExt = derivedExt && allowedExtensions.includes(derivedExt) ? derivedExt : 'jpg';
      const fileName = `image_${Date.now()}.${safeExt}`;

      return await uploadSingleImage(asset.uri, fileName);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo seleccionar la imagen'
      });
      return null;
    }
  };

  const pickAndUploadMultiple = async (
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult[] | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? false,
        allowsMultipleSelection: options.allowsMultipleSelection ?? true,
        quality: options.quality ?? 0.8,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Error de autenticación',
          text2: 'Debes iniciar sesión para subir imágenes'
        });
        return null;
      }

      setUploading(true);
      const uploadPromises = result.assets.map((asset, index) => {
        const assetFileName = (asset as any).fileName as string | undefined;
        const derivedExt = assetFileName?.split('.').pop()?.toLowerCase()
          || asset.uri.split('.').pop()?.toLowerCase();
        const safeExt = derivedExt && allowedExtensions.includes(derivedExt) ? derivedExt : 'jpg';
        const fileName = `image_${Date.now()}_${index}.${safeExt}`;
        return Api.uploadImage(token, asset.uri, fileName);
      });

      const results = await Promise.all(uploadPromises);

      Toast.show({
        type: 'success',
        text1: 'Imágenes subidas',
        text2: `${results.length} imagen${results.length > 1 ? 'es' : ''} subida${results.length > 1 ? 's' : ''} correctamente`
      });

      return results;
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error al subir imágenes',
        text2: error.message || 'Intenta nuevamente'
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const takePhotoAndUpload = async (
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult | null> => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        quality: options.quality ?? 0.8,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const fileName = `photo_${Date.now()}.jpg`;

      return await uploadSingleImage(asset.uri, fileName);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo tomar la foto'
      });
      return null;
    }
  };

  const uploadFromUri = async (
    uri: string,
    fileName?: string
  ): Promise<ImageUploadResult | null> => {
    return uploadSingleImage(uri, fileName);
  };

  const deleteImage = async (publicId: string): Promise<boolean> => {
    if (!token) {
      Toast.show({
        type: 'error',
        text1: 'Error de autenticación',
        text2: 'Debes iniciar sesión para eliminar imágenes'
      });
      return false;
    }

    try {
      await Api.deleteImage(token, publicId);
      Toast.show({
        type: 'success',
        text1: 'Imagen eliminada',
        text2: 'La imagen se eliminó correctamente'
      });
      return true;
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo eliminar la imagen'
      });
      return false;
    }
  };

  return {
    uploading,
    uploadProgress,
    pickAndUploadImage,
    pickAndUploadMultiple,
    takePhotoAndUpload,
    uploadFromUri,
    deleteImage,
  };
};

export default useImageUpload;
