import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback, ScrollView, TouchableOpacity, Modal } from "react-native";
import Card from "./Card";

interface TimeWheelPickerProps {
  visible: boolean;
  title?: string;
  value?: string; // "HH:MM"
  allowedHours?: string[];
  allowedMinutes?: string[];
  onChange?: (time: string) => void;
  onRequestClose: () => void;
}

const TimeWheelPicker: React.FC<TimeWheelPickerProps> = ({
  visible,
  title = "Selecciona hora",
  value,
  allowedHours,
  allowedMinutes,
  onChange,
  onRequestClose,
}) => {
  const defaultHours = useMemo(() => allowedHours ?? Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")), [allowedHours]);
  const defaultMinutes = useMemo(() => allowedMinutes ?? Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")), [allowedMinutes]);

  const [hour, setHour] = useState<string>(() => (value ? value.split(":")[0] : defaultHours[0]));
  const [minute, setMinute] = useState<string>(() => (value ? value.split(":")[1] : defaultMinutes[0]));

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Efecto para desplazar automáticamente a la hora/minuto seleccionados cuando se abre
  useEffect(() => {
    if (!visible) return;
    const hourIndex = defaultHours.indexOf(hour);
    const minuteIndex = defaultMinutes.indexOf(minute);
    setTimeout(() => {
      if (hourIndex >= 0) hourScrollRef.current?.scrollTo({ y: hourIndex * 44, animated: true });
      if (minuteIndex >= 0) minuteScrollRef.current?.scrollTo({ y: minuteIndex * 44, animated: true });
    }, 30);
  }, [visible]);

  // Propagar cambios en vivo
  useEffect(() => {
    if (!visible) return;
    const time = `${hour}:${minute}`;
    onChange?.(time);
  }, [hour, minute, visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onRequestClose}>
      <TouchableWithoutFeedback onPress={onRequestClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <Card style={styles.timePickerContainer}>
                <Text style={styles.timePickerTitle}>{title}</Text>
                <View style={styles.timeWheelsContainer}>
                  {/* Selector de horas */}
                  <View style={styles.timeWheel}>
                    <Text style={styles.timeWheelLabel}>Hora</Text>
                    <ScrollView
                      ref={hourScrollRef}
                      style={styles.timeWheelScroll}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      snapToInterval={44}
                      decelerationRate="fast"
                    >
                      {defaultHours.map((h) => (
                        <TouchableOpacity
                          key={h}
                          style={[styles.timeWheelItem, hour === h && styles.timeWheelItemSelected]}
                          onPress={() => setHour(h)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.timeWheelItemText, hour === h && styles.timeWheelItemTextSelected]}>
                            {h}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <Text style={styles.timeSeparator}>:</Text>

                  {/* Selector de minutos */}
                  <View style={styles.timeWheel}>
                    <Text style={styles.timeWheelLabel}>Minutos</Text>
                    <ScrollView
                      ref={minuteScrollRef}
                      style={styles.timeWheelScroll}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      snapToInterval={44}
                      decelerationRate="fast"
                    >
                      {defaultMinutes.map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.timeWheelItem, minute === m && styles.timeWheelItemSelected]}
                          onPress={() => setMinute(m)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.timeWheelItemText, minute === m && styles.timeWheelItemTextSelected]}>
                            {m}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.selectedTimeContainer}>
                  <Text style={styles.selectedTimeText}>
                    {hour}:{minute}
                  </Text>
                </View>
              </Card>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    width: "90%",
    maxWidth: 420,
  },
  timePickerContainer: {
    padding: 16,
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  timeWheelsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  timeWheel: {
    flex: 1,
    minWidth: 120,
  },
  timeWheelLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
    textAlign: "center",
  },
  timeWheelScroll: {
    maxHeight: 264,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
  },
  timeWheelItem: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  timeWheelItemSelected: {
    backgroundColor: "#E5E7EB",
  },
  timeWheelItemText: {
    fontSize: 16,
    color: "#111827",
  },
  timeWheelItemTextSelected: {
    fontWeight: "600",
    color: "#111827",
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginHorizontal: 12,
  },
  selectedTimeContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  selectedTimeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2563EB",
  },
});

export default TimeWheelPicker;