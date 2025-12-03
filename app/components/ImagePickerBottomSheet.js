import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import Modal from "react-native-modal";
import { Camera, Image as ImageIcon, Trash2 } from "lucide-react-native";

export default function ImagePickerBottomSheet({
  visible,
  onClose,
  onCamera,
  onGallery,
  onRemoveAll
}) {
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      swipeDirection="down"
      onSwipeComplete={onClose}
      style={styles.modal}
      backdropOpacity={0.3}
    >
      <View style={styles.sheetContainer}>
        <View style={styles.grabber} />

        <TouchableOpacity style={styles.item} onPress={onCamera}>
          <Camera size={22} color="#333" />
          <Text style={styles.itemText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={onGallery}>
          <ImageIcon size={22} color="#333" />
          <Text style={styles.itemText}>Choose from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={onRemoveAll}>
          <Trash2 size={22} color="red" />
          <Text style={[styles.itemText, { color: "red" }]}>Remove All Images</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },

  sheetContainer: {
    backgroundColor: "#fff",
    paddingTop: 12,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  grabber: {
    width: 40,
    height: 5,
    backgroundColor: "#ddd",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  itemText: {
    fontSize: 16,
    marginLeft: 15,
    color: "#333",
  },

  cancelBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },

  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
