import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, FlatList, Modal } from "react-native";
import Card from "./Card";
import { Ionicons } from "@expo/vector-icons";

interface ModalPickerProps<T = string> {
  visible: boolean;
  title: string;
  data: T[];
  selectedIndex: number;
  onSelect: (index: number, value: T) => void;
  onRequestClose: () => void;
  listRef?: React.RefObject<FlatList<T>> | null;
  onEndReached?: () => void;
  getItemLayout?: (data: T[] | null | undefined, index: number) => { length: number; offset: number; index: number };
  keyExtractor?: (item: T, index: number) => string;
}

export default function ModalPicker<T = string>({
  visible,
  title,
  data,
  selectedIndex,
  onSelect,
  onRequestClose,
  listRef,
  onEndReached,
  getItemLayout,
  keyExtractor,
}: ModalPickerProps<T>) {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onRequestClose}>
      <TouchableWithoutFeedback onPress={onRequestClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View>
              <Card style={styles.modalCard}>
                <Text style={styles.modalTitle}>{title}</Text>
                <FlatList
                  ref={listRef as any}
                  data={data}
                  keyExtractor={keyExtractor || ((item: any, index: number) => `${String(item)}-${index}`)}
                  style={styles.modalList}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                  onEndReachedThreshold={0.6}
                  onEndReached={onEndReached}
                  getItemLayout={getItemLayout}
                  renderItem={({ item, index }) => {
                    const selected = index === selectedIndex;
                    return (
                      <TouchableOpacity
                        style={[styles.optionRow, selected && styles.selectedOptionRow]}
                        onPress={() => onSelect(index, item)}
                      >
                        <Text style={styles.optionText}>{String(item)}</Text>
                        {selected && <Ionicons name="checkmark-circle" size={20} color="#2563EB" />}
                      </TouchableOpacity>
                    );
                  }}
                />
              </Card>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  modalList: {
    height: 300,
    maxHeight: 300,
    flexGrow: 0,
    marginBottom: 12,
  },
  optionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  selectedOptionRow: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  optionText: {
    fontSize: 14,
    color: "#111827",
    textAlign: "center",
  },
});