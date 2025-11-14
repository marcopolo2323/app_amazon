import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image?: any; // You can replace with actual images
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Encuentra servicios',
    subtitle: 'Cerca de ti',
    description: 'Descubre profesionales y servicios de calidad en tu ciudad. Desde limpieza hasta reparaciones.',
  },
  {
    id: 2,
    title: 'Conecta directamente',
    subtitle: 'Con profesionales',
    description: 'Contacta directamente con proveedores verificados y obtén cotizaciones instantáneas.',
  },
  {
    id: 3,
    title: 'Pago seguro',
    subtitle: 'Y confiable',
    description: 'Realiza pagos seguros a través de nuestra plataforma y obtén garantía en todos los servicios.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.replace('/login');
    }
  };

  const handleSkip = () => {
    router.replace('/login');
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const renderSlide = (slide: Slide) => (
    <View style={styles.slide} key={slide.id}>
      {/* Image placeholder */}
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Ionicons
            name={
              slide.id === 1 ? 'search-outline' :
              slide.id === 2 ? 'people-outline' :
              'shield-checkmark-outline'
            }
            size={80}
            color="#2563EB"
          />
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const slideIndex = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentSlide(slideIndex);
        }}
        scrollEnabled={false} // Disable manual scrolling, use buttons instead
        contentOffset={{ x: currentSlide * width, y: 0 }}
        style={styles.scrollView}
      >
        {slides.map(renderSlide)}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              index === currentSlide && styles.activeDot,
            ]}
            onPress={() => setCurrentSlide(index)}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          {currentSlide > 0 && (
            <TouchableOpacity onPress={handlePrevious} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#6B7280" />
              <Text style={styles.backText}>Atrás</Text>
            </TouchableOpacity>
          )}

          <View style={styles.spacer} />

          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>
              {currentSlide === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
            </Text>
            <Ionicons
              name={currentSlide === slides.length - 1 ? 'checkmark' : 'chevron-forward'}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  textContainer: {
    flex: 0.4,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2563EB',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#2563EB',
    width: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    justifyContent: 'center',
  },
  nextText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 8,
  },
});
