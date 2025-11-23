import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CameraPopupProps {
  visible: boolean;
  onClose: (photoUri?: string) => void;
}

export default function CameraPopup({ visible, onClose }: CameraPopupProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
  };

  const handleUsePhoto = () => {
    if (photoUri) {
      onClose(photoUri);
      setPhotoUri(null); // Reset for next time
    }
  };

  const handleClose = () => {
    setPhotoUri(null);
    onClose();
  };

  // Loading state
  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.centerContainer}>
          <Text>Loading camera...</Text>
        </View>
      </Modal>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.centerContainer}>
          <Text style={styles.permissionText}>No access to camera</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {!photoUri ? (
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
            <View style={styles.cameraControls}>
              <TouchableOpacity
                onPress={takePhoto}
                style={styles.captureButton}
              />
            </View>
          </CameraView>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={handleRetake} style={styles.retakeButton}>
                <Text style={styles.buttonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUsePhoto} style={styles.usePhotoButton}>
                <Text style={styles.buttonText}>Use Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <TouchableOpacity onPress={handleClose} style={styles.closeIcon}>
          <Text style={styles.closeIconText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 30,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    borderWidth: 4,
    borderColor: "gray",
  },
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: 300,
    height: 400,
    borderRadius: 12,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
  },
  retakeButton: {
    padding: 12,
    backgroundColor: "#f44336",
    marginHorizontal: 10,
    borderRadius: 8,
  },
  usePhotoButton: {
    padding: 12,
    backgroundColor: "#4caf50",
    marginHorizontal: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  closeIcon: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 10,
  },
  closeIconText: {
    color: "white",
    fontSize: 18,
  },
  permissionText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "600",
  },
  closeButton: {
    backgroundColor: "#757575",
    padding: 15,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "600",
  },
});