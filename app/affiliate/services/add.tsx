import React, { useState } from "react";
import { Alert, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Screen from "../../../components/Screen";
import Input from "../../../components/Input";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import RequireAuth from "../../../components/auth/RequireAuth";
import ImagePickerComponent from "../../../components/ImagePicker";
import TimeWheelPicker from "../../../components/TimeWheelPicker";
import ModalPicker from "../../../components/ModalPicker";
import { ThemedText } from "../../../components/themed-text";
import { useAuthStore } from "../../../stores/auth";
import { Api } from "../../../lib/api";
import * as Location from "expo-location";

interface SimpleServiceFormData {
  title: string;
  description: string;
  price: string;
  currency: string;
  categoryId?: string;
  categoryName?: string;
  tags: string;
  featuresText: string;
  includesText: string;
  excludesText: string;
  cancellationPolicy: string;
  images: string[];
  availability: {
    days: { [key: string]: boolean };
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  };
  locationAddress: string;
  locationCity: string;
  providerName: string;
  contactPhone: string;
  contactEmail: string;
  // campos dinámicos por categoría
  transaction?: string; // Venta/Alquiler
  subType?: string; // Casa Normal / Casa de Campo
  type?: string; // Galón / Paquete de botella
}

export default function AddServiceScreen() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SimpleServiceFormData>({
    title: "",
    description: "",
    price: "",
    currency: "PEN",
    categoryId: undefined,
    categoryName: "",
    tags: "",
    featuresText: "",
    includesText: "",
    excludesText: "",
    cancellationPolicy: "",
    images: [],
    availability: {
      days: { Lun: true, Mar: true, Mie: true, Jue: true, Vie: true, Sab: false, Dom: false },
      startTime: "09:00",
      endTime: "18:00",
    },
    locationAddress: "",
    locationCity: "",
    providerName: "",
    contactPhone: "",
    contactEmail: "",
    transaction: "",
    subType: "",
    type: "",
  });

  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);

  // Pickers
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);
  const currencyOptions = ["PEN", "USD"];
  const [currencyIndex, setCurrencyIndex] = useState(0);

  // Pickers dinámicos
  const [houseTransactionPickerVisible, setHouseTransactionPickerVisible] = useState(false);
  const [houseTypePickerVisible, setHouseTypePickerVisible] = useState(false);
  const [waterTypePickerVisible, setWaterTypePickerVisible] = useState(false);
  const houseTransactionOptions = ["Venta", "Alquiler"];
  const houseTypeOptions = ["Casa Normal", "Casa de Campo"];
  const waterTypeOptions = ["Galón", "Paquete de botella"];

  // Categorías
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryIndex, setCategoryIndex] = useState(-1);

  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await Api.listCategories(token);
        const arr = Array.isArray(data) ? data : (data?.items || []);
        const mapped = arr.map((c: any) => ({ id: String(c.id || c._id || c.uuid), name: String(c.name || c.title || c.label || "Categoría") }));
        setCategories(mapped);
      } catch (error) {
        console.warn("No se pudo cargar categorías", error);
      }
    };
    loadCategories();
  }, [token]);

  const updateField = (field: keyof SimpleServiceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helpers para detectar categorías con nombres variables
  const categoryLower = (formData.categoryName || "").toLowerCase();
  const isHouseCategory = /\bcasas?\b|hogar/.test(categoryLower);
  const isWaterCategory = /agua/.test(categoryLower);

  const fillLocationFromDevice = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso de ubicación denegado");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;

      let addressStr = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      let cityStr = "";
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        const place = places?.[0];
        if (place) {
          const streetParts: string[] = [];
          if ((place as any).streetNumber) streetParts.push(String((place as any).streetNumber));
          if (place.street) streetParts.push(place.street);
          const district = place.district || place.name || "";
          addressStr = [streetParts.join(" "), district].filter(Boolean).join(", ");
          cityStr = place.city || place.subregion || place.region || "";
        }
      } catch {}

      setFormData((prev) => ({
        ...prev,
        locationAddress: addressStr,
        locationCity: cityStr,
      }));
      Alert.alert("Ubicación actual aplicada");
    } catch (e) {
      Alert.alert("Error", "Error obteniendo ubicación");
    }
  };

  const fillContactFromAffiliate = () => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      providerName: user?.name || prev.providerName,
      contactEmail: user?.email || prev.contactEmail,
      contactPhone: user?.phone || prev.contactPhone,
    }));
    Alert.alert("Contacto del afiliado aplicado");
  };

  const handleSubmit = async () => {
    // Validaciones básicas
    if (!formData.title.trim()) {
      Alert.alert("Falta título", "Ingresa el título del servicio");
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert("Falta descripción", "Describe tu servicio");
      return;
    }
    if (!formData.price.trim() || isNaN(Number(formData.price))) {
      Alert.alert("Precio inválido", "Ingresa un precio numérico");
      return;
    }
    if (!formData.categoryName) {
      Alert.alert("Selecciona categoría", "Elige una categoría para tu servicio");
      return;
    }

    if (isHouseCategory) {
      if (!formData.transaction) {
        Alert.alert("Selecciona transacción", "Elige Venta o Alquiler");
        return;
      }
      if (!formData.subType) {
        Alert.alert("Selecciona tipo de casa", "Elige Casa Normal o Casa de Campo");
        return;
      }
    }
    if (isWaterCategory && !formData.type) {
      Alert.alert("Selecciona tipo de agua", "Elige Galón o Paquete de botella");
      return;
    }

    const normalizeList = (text: string): string[] => {
      return text
        .split(/\r?\n|,/)
        .map((t) => t.trim())
        .filter(Boolean);
    };

    const dayMap: Record<string, string> = {
      Lun: 'monday',
      Mar: 'tuesday',
      Mie: 'wednesday',
      Jue: 'thursday',
      Vie: 'friday',
      Sab: 'saturday',
      Dom: 'sunday',
    };

    const payload: any = {
      affiliateId: user?.id,
      category: formData.categoryName.trim(),
      title: formData.title.trim(),
      price: Number(formData.price),
      description: formData.description.trim(),
      images: formData.images,
      locationText: [formData.locationAddress.trim(), formData.locationCity.trim()].filter(Boolean).join(", "),
      contactEmail: formData.contactEmail.trim() || undefined,
      contactPhone: formData.contactPhone.trim() || undefined,
      providerName: formData.providerName.trim() || undefined,
      // map text fields to arrays/strings expected by backend
      features: normalizeList(formData.featuresText),
      includesInfo: normalizeList(formData.includesText),
      excludesInfo: normalizeList(formData.excludesText),
      cancellationPolicy: formData.cancellationPolicy.trim() || undefined,
      // availability mapping: convert boolean map to array of day strings and include times
      availability: {
        days: Object.entries(formData.availability.days)
          .filter(([_, enabled]) => !!enabled)
          .map(([day]) => dayMap[day] || day.toLowerCase()),
        startTime: formData.availability.startTime,
        endTime: formData.availability.endTime,
      },
      status: "active",
    };

    if (isHouseCategory) {
      payload.transaction = formData.transaction;
      payload.subType = formData.subType;
    }
    if (isWaterCategory) {
      payload.type = formData.type;
    }

    setLoading(true);
    try {
      await Api.createService(token!, payload);
      Alert.alert("Éxito", "Servicio creado correctamente");
      router.back();
    } catch (error: any) {
      const msg = error?.message || error?.toString?.() || "Error en la solicitud";
      Alert.alert("Error creando servicio", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireAuth>
      <Screen title="Nuevo Servicio" back>
        {/* Imágenes */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Imágenes</ThemedText>
          <ImagePickerComponent
            maxImages={6}
            initialImages={formData.images}
            onImagesSelected={(imgs) =>
              setFormData((prev) => ({
                ...prev,
                images: imgs.map((i: any) => i.url || i.uri),
              }))
            }
          />
        </Card>

        {/* Información básica */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Información</ThemedText>

          <Input
            label="Título del servicio"
            placeholder="Ej: Limpieza profunda del hogar"
            value={formData.title}
            onChangeText={(text) => updateField("title", text)}
            required
          />

          <Input
            label="Descripción"
            placeholder="Describe detalladamente tu servicio"
            value={formData.description}
            onChangeText={(text) => updateField("description", text)}
            multiline
            numberOfLines={4}
            required
          />

          <Input
            label="Categoría"
            value={formData.categoryName}
            placeholder={categories.length ? "Selecciona categoría" : "Cargando categorías..."}
            editable={false}
            rightIcon="chevron-down-outline"
            onRightIconPress={() => setCategoryPickerVisible(true)}
          />

          {/* Opciones dinámicas */}
          {isHouseCategory && (
            <View>
              <Input
                label="Transacción"
                value={formData.transaction || ""}
                placeholder="Venta o Alquiler"
                editable={false}
                rightIcon="chevron-down-outline"
                onRightIconPress={() => setHouseTransactionPickerVisible(true)}
              />
              <Input
                label="Tipo de casa"
                value={formData.subType || ""}
                placeholder="Casa Normal o Casa de Campo"
                editable={false}
                rightIcon="chevron-down-outline"
                onRightIconPress={() => setHouseTypePickerVisible(true)}
              />
            </View>
          )}

          {isWaterCategory && (
            <View>
              <Input
                label="Tipo de agua"
                value={formData.type || ""}
                placeholder="Galón o Paquete de botella"
                editable={false}
                rightIcon="chevron-down-outline"
                onRightIconPress={() => setWaterTypePickerVisible(true)}
              />
            </View>
          )}

          <Input
            label="Precio"
            placeholder="0.00"
            value={formData.price}
            onChangeText={(text) => updateField("price", text)}
            keyboardType="numeric"
            required
          />

          <Input
            label="Moneda"
            value={formData.currency}
            editable={false}
            rightIcon="chevron-down-outline"
            onRightIconPress={() => setCurrencyPickerVisible(true)}
          />

          <Input
            label="Etiquetas"
            value={formData.tags}
            onChangeText={(text) => updateField("tags", text)}
            placeholder="Ej: limpieza, hogar, rápido"
          />
        </Card>

        {/* Disponibilidad */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Disponibilidad</ThemedText>

          <View style={styles.daysContainer}>
            {Object.keys(formData.availability.days).map((dayKey) => (
              <TouchableOpacity
                key={dayKey}
                style={[styles.dayToggle, formData.availability.days[dayKey] && styles.dayToggleActive]}
                onPress={() =>
                  setFormData((prev) => ({
                    ...prev,
                    availability: {
                      ...prev.availability,
                      days: { ...prev.availability.days, [dayKey]: !prev.availability.days[dayKey] },
                    },
                  }))
                }
              >
                <Text style={[styles.dayToggleText, formData.availability.days[dayKey] && styles.dayToggleTextActive]}>
                  {dayKey}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.timeRow}>
            <Button variant="outline" size="small" onPress={() => setStartPickerVisible(true)}>
              Inicio: {formData.availability.startTime}
            </Button>
            <Button variant="outline" size="small" onPress={() => setEndPickerVisible(true)}>
              Fin: {formData.availability.endTime}
            </Button>
          </View>

          <TimeWheelPicker
            visible={startPickerVisible}
            title="Hora de inicio"
            value={formData.availability.startTime}
            onChange={(t) => setFormData((prev) => ({
              ...prev,
              availability: { ...prev.availability, startTime: t },
            }))}
            onRequestClose={() => setStartPickerVisible(false)}
          />

          <TimeWheelPicker
            visible={endPickerVisible}
            title="Hora de fin"
            value={formData.availability.endTime}
            onChange={(t) => setFormData((prev) => ({
              ...prev,
              availability: { ...prev.availability, endTime: t },
            }))}
            onRequestClose={() => setEndPickerVisible(false)}
          />
        </Card>

        {/* Detalles adicionales */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Detalles</ThemedText>
          <Input
            label="Características"
            value={formData.featuresText}
            onChangeText={(text) => updateField("featuresText", text)}
            placeholder="Lista las características principales"
            multiline
          />
          <Input
            label="Incluye"
            value={formData.includesText}
            onChangeText={(text) => updateField("includesText", text)}
            placeholder="Qué incluye el servicio"
            multiline
          />
          <Input
            label="No incluye"
            value={formData.excludesText}
            onChangeText={(text) => updateField("excludesText", text)}
            placeholder="Qué no incluye el servicio"
            multiline
          />
          <Input
            label="Política de cancelación"
            value={formData.cancellationPolicy}
            onChangeText={(text) => updateField("cancellationPolicy", text)}
            placeholder="Condiciones para cancelar"
            multiline
          />
        </Card>

        {/* Ubicación */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Ubicación</ThemedText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Button variant="outline" onPress={fillLocationFromDevice}>
              Usar mi ubicación
            </Button>
          </View>
          <Input
            label="Dirección"
            placeholder="Av. Siempre Viva 123"
            value={formData.locationAddress}
            onChangeText={(text) => updateField("locationAddress", text)}
          />
          <Input
            label="Ciudad"
            placeholder="Lima"
            value={formData.locationCity}
            onChangeText={(text) => updateField("locationCity", text)}
          />
        </Card>

        {/* Contacto */}
        <Card style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Contacto</ThemedText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Button variant="outline" onPress={fillContactFromAffiliate}>
              Usar mis datos
            </Button>
          </View>
          <Input
            label="Nombre del proveedor"
            placeholder="Tu nombre o empresa"
            value={formData.providerName}
            onChangeText={(text) => updateField("providerName", text)}
          />
          <Input
            label="Teléfono"
            placeholder="+51 999 999 999"
            value={formData.contactPhone}
            onChangeText={(text) => updateField("contactPhone", text)}
            keyboardType="phone-pad"
          />
          <Input
            label="Email"
            placeholder="tucorreo@ejemplo.com"
            value={formData.contactEmail}
            onChangeText={(text) => updateField("contactEmail", text)}
            keyboardType="email-address"
          />
        </Card>

        <Button onPress={handleSubmit} loading={loading} style={styles.submitButton}>
          Publicar Servicio
        </Button>

        {/* Picker de categoría */}
        {categoryPickerVisible && (
          <ModalPicker
            visible={categoryPickerVisible}
            title="Selecciona categoría"
            data={categories.map((c) => c.name)}
            selectedIndex={categoryIndex}
            onSelect={(index, value) => {
              setCategoryIndex(index);
              const cat = categories[index];
              setFormData((prev) => ({
                ...prev,
                categoryId: cat?.id,
                categoryName: cat?.name || (value as string),
                // limpiar opciones dinámicas al cambiar categoría
                transaction: "",
                subType: "",
                type: "",
              }));
              setCategoryPickerVisible(false);
            }}
            onRequestClose={() => setCategoryPickerVisible(false)}
          />
        )}

        {/* Picker de moneda */}
        {currencyPickerVisible && (
          <ModalPicker
            visible={currencyPickerVisible}
            title="Selecciona moneda"
            data={currencyOptions}
            selectedIndex={currencyIndex}
            onSelect={(index, value) => {
              setCurrencyIndex(index);
              updateField("currency", value as string);
              setCurrencyPickerVisible(false);
            }}
            onRequestClose={() => setCurrencyPickerVisible(false)}
          />
        )}

        {/* Picker de transacción (Casa) */}
        {houseTransactionPickerVisible && (
          <ModalPicker
            visible={houseTransactionPickerVisible}
            title="Transacción"
            data={houseTransactionOptions}
            selectedIndex={houseTransactionOptions.indexOf(formData.transaction || "")}
            onSelect={(_, value) => {
              updateField("transaction", value as string);
              setHouseTransactionPickerVisible(false);
            }}
            onRequestClose={() => setHouseTransactionPickerVisible(false)}
          />
        )}

        {/* Picker de tipo de casa */}
        {houseTypePickerVisible && (
          <ModalPicker
            visible={houseTypePickerVisible}
            title="Tipo de casa"
            data={houseTypeOptions}
            selectedIndex={houseTypeOptions.indexOf(formData.subType || "")}
            onSelect={(_, value) => {
              updateField("subType", value as string);
              setHouseTypePickerVisible(false);
            }}
            onRequestClose={() => setHouseTypePickerVisible(false)}
          />
        )}

        {/* Picker de tipo de agua */}
        {waterTypePickerVisible && (
          <ModalPicker
            visible={waterTypePickerVisible}
            title="Tipo de agua"
            data={waterTypeOptions}
            selectedIndex={waterTypeOptions.indexOf(formData.type || "")}
            onSelect={(_, value) => {
              updateField("type", value as string);
              setWaterTypePickerVisible(false);
            }}
            onRequestClose={() => setWaterTypePickerVisible(false)}
          />
        )}
      </Screen>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  dayToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
  },
  dayToggleActive: {
    borderColor: "#2563EB",
    backgroundColor: "#DBEAFE",
  },
  dayToggleText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  dayToggleTextActive: {
    color: "#1D4ED8",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    height: 32, 
    width: "48%",
  },
  submitButton: {
    marginTop: 24,
  },
});
