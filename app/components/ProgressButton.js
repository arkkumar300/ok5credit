import React, { useEffect, useRef } from "react";
import { TouchableOpacity,View, Text, StyleSheet, Animated } from "react-native";
import { Check } from "lucide-react-native";

export default function ProgressButton({
  title = "Submit",
  loading = false,
  success = false,
  progress = 0,
  onPress,
  style = {},
  textStyle = {},
  disabled = false,
}) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  // Animate progress bar
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: loading ? progress : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, loading]);

  // Success animation
  useEffect(() => {
    if (success) {
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true
      }).start(() => {
        setTimeout(() => {
          Animated.timing(checkScale, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }).start();
        }, 1000);
      });
    }
  }, [success]);

  return (
      <View style={[styles.button, style]}>
        {/* Touchable Layer */}
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, { zIndex: 3 }]}
          onPress={!success && !loading ? onPress : null}
          activeOpacity={0.8}
          disabled={success || loading || disabled}
        />
    
        {/* Progress Fill */}
        {loading && (
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: animatedWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        )}
    
        {/* Text / Success */}
        {success ? (
          <Animated.View style={{ transform: [{ scale: checkScale }], zIndex: 2 }}>
            <Check size={24} color="#fff" />
          </Animated.View>
        ) : (
          <Text style={[styles.text, textStyle]}>
            {loading ? `Submitting ${Math.round(progress * 100)}%` : title}
          </Text>
        )}
      </View>
      );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    width: "100%",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    height: 50,
  },
  progressFill: {
    backgroundColor: "#2E7D32",
    height: 50,
    position: "absolute",
    left: 0,
    top: 0,
  },
  text: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    zIndex: 2,
  },
});
