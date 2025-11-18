import Constants from 'expo-constants';

export const getApiUrl = () => {
  try {
    const url = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL ||
      Constants.manifest?.extra?.EXPO_PUBLIC_API_URL ||
      process.env.EXPO_PUBLIC_API_URL ||
      'https://amazon-group-app.onrender.com/api';
    
    console.log('API URL configured:', url);
    return url;
  } catch (error) {
    console.error('Error getting API URL:', error);
    return 'https://amazon-group-app.onrender.com/api';
  }
};

export const API_URL = getApiUrl();
