"use client";

// Shims the bits of react-native this clone still references conceptually, so
// components can be ported 1:1 (e.g. Platform checks, image handling).

export const Platform = {
  OS: "web",
};

export function pickImageFile(inputElement, callback) {
  // Stands in for react-native-image-picker's launchImageLibrary result:
  // { uri, type, name / fileName, didCancel }
  const file = inputElement.files && inputElement.files[0];
  if (!file) {
    callback({ didCancel: true, assets: null });
    return;
  }
  const reader = new FileReader();
  reader.onloadend = () => {
    callback({
      didCancel: false,
      assets: [
        {
          uri: reader.result,
          type: file.type || "image/jpeg",
          fileName: file.name,
          name: file.name,
          file,
        },
      ],
    });
  };
  reader.readAsDataURL(file);
}
