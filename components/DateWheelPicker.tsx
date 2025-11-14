import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback, ScrollView, TouchableOpacity, Modal } from "react-native";
import Card from "./Card";
import { formatDate } from "../lib/date-time";

interface DateWheelPickerProps {
  visible: boolean;
  title?: string;
  value?: string; // "DD/MM/AAAA"
  minYear?: number;
  maxYear?: number;
  onChange?: (date: string) => void;
  onRequestClose: () => void;
}

function daysInMonth(year: number, monthIndexZeroBased: number) {
  return new Date(year, monthIndexZeroBased + 1, 0).getDate();
}

const ITEM_HEIGHT = 44;

const DateWheelPicker: React.FC<DateWheelPickerProps> = ({
  visible,
  title = "Selecciona fecha",
  value,
  minYear,
  maxYear,
  onChange,
  onRequestClose,
}) => {
  const now = new Date();
  const initialDay = (() => {
    if (value) {
      const parts = value.split("/");
      if (parts.length === 3) return parts[0].padStart(2, "0");
    }
    return String(now.getDate()).padStart(2, "0");
  })();
  const initialMonth = (() => {
    if (value) {
      const parts = value.split("/");
      if (parts.length === 3) return parts[1].padStart(2, "0");
    }
    return String(now.getMonth() + 1).padStart(2, "0");
  })();
  const initialYear = (() => {
    if (value) {
      const parts = value.split("/");
      if (parts.length === 3) return parts[2];
    }
    return String(now.getFullYear());
  })();

  const years = useMemo(() => {
    const start = minYear ?? now.getFullYear();
    const end = maxYear ?? now.getFullYear() + 2;
    const arr: string[] = [];
    for (let y = start; y <= end; y++) arr.push(String(y));
    return arr;
  }, [minYear, maxYear]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")), []);

  const [year, setYear] = useState<string>(initialYear);
  const [month, setMonth] = useState<string>(initialMonth);
  const [day, setDay] = useState<string>(initialDay);

  const dayScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  const days = useMemo(() => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1;
    const count = daysInMonth(y, m);
    return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, "0"));
  }, [year, month]);

  // Ajustar día si el mes/año cambian y el día actual excede el máximo
  useEffect(() => {
    const maxDay = days.length;
    const current = parseInt(day, 10);
    if (current > maxDay) setDay(String(maxDay).padStart(2, "0"));
  }, [days]);

  // Desplazar ruedas al abrir según valor inicial
  useEffect(() => {
    if (!visible) return;
    const dayIndex = Math.max(days.indexOf(day), 0);
    const monthIndex = Math.max(months.indexOf(month), 0);
    const yearIndex = Math.max(years.indexOf(year), 0);
    setTimeout(() => {
      dayScrollRef.current?.scrollTo({ y: dayIndex * ITEM_HEIGHT, animated: true });
      monthScrollRef.current?.scrollTo({ y: monthIndex * ITEM_HEIGHT, animated: true });
      yearScrollRef.current?.scrollTo({ y: yearIndex * ITEM_HEIGHT, animated: true });
    }, 30);
  }, [visible, days, months, years]);

  // Propagar cambios
  useEffect(() => {
    if (!visible) return;
    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1;
    const d = parseInt(day, 10);
    const composed = formatDate(new Date(y, m, d));
    onChange?.(composed);
  }, [day, month, year, visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onRequestClose}>
      <TouchableWithoutFeedback onPress={onRequestClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <Card style={styles.pickerCard}>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.wheelsRow}>
                  {/* Día */}
                  <View style={styles.wheel}>
                    <Text style={styles.wheelLabel}>Día</Text>
                    <ScrollView
                      ref={dayScrollRef}
                      style={styles.wheelScroll}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                    >
                      {days.map((dVal) => (
                        <TouchableOpacity
                          key={dVal}
                          style={[styles.wheelItem, day === dVal && styles.wheelItemSelected]}
                          onPress={() => setDay(dVal)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.wheelItemText, day === dVal && styles.wheelItemTextSelected]}>
                            {dVal}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Mes */}
                  <View style={styles.wheel}>
                    <Text style={styles.wheelLabel}>Mes</Text>
                    <ScrollView
                      ref={monthScrollRef}
                      style={styles.wheelScroll}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                    >
                      {months.map((mVal) => (
                        <TouchableOpacity
                          key={mVal}
                          style={[styles.wheelItem, month === mVal && styles.wheelItemSelected]}
                          onPress={() => setMonth(mVal)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.wheelItemText, month === mVal && styles.wheelItemTextSelected]}>
                            {mVal}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Año */}
                  <View style={styles.wheel}>
                    <Text style={styles.wheelLabel}>Año</Text>
                    <ScrollView
                      ref={yearScrollRef}
                      style={styles.wheelScroll}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                    >
                      {years.map((yVal) => (
                        <TouchableOpacity
                          key={yVal}
                          style={[styles.wheelItem, year === yVal && styles.wheelItemSelected]}
                          onPress={() => setYear(yVal)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.wheelItemText, year === yVal && styles.wheelItemTextSelected]}>
                            {yVal}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
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
  },
  modalContent: {
    width: "90%",
    maxWidth: 480,
  },
  pickerCard: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  wheelsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  wheel: {
    flex: 1,
    minWidth: 100,
  },
  wheelLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
    textAlign: "center",
  },
  wheelScroll: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  wheelItemSelected: {
    backgroundColor: "#E5E7EB",
  },
  wheelItemText: {
    fontSize: 16,
    color: "#111827",
  },
  wheelItemTextSelected: {
    fontWeight: "600",
    color: "#111827",
  },
});

export default DateWheelPicker;