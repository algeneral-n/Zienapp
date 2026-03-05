import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

// --- CAMERA & GALLERY ---
export const takePicture = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });
    return image.webPath;
  } catch (error) {
    console.error('Camera Error:', error);
    throw error;
  }
};

export const pickFromGallery = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });
    return image.webPath;
  } catch (error) {
    console.error('Gallery Error:', error);
    throw error;
  }
};

// --- GEOLOCATION ---
export const getCurrentLocation = async () => {
  try {
    const coordinates = await Geolocation.getCurrentPosition();
    return {
      lat: coordinates.coords.latitude,
      lng: coordinates.coords.longitude,
    };
  } catch (error) {
    console.error('Geolocation Error:', error);
    throw error;
  }
};

// --- BIOMETRICS ---
export const authenticateWithBiometrics = async (reason = 'Please authenticate to continue') => {
  try {
    const result = await NativeBiometric.isAvailable();
    if (!result.isAvailable) {
      throw new Error('Biometrics not available on this device');
    }

    const verified = await NativeBiometric.verifyIdentity({
      reason,
      title: 'Log In',
      subtitle: 'Use your fingerprint or face to log in',
      description: 'Secure access to ZIEN',
    });
    
    return verified;
  } catch (error) {
    console.error('Biometric Error:', error);
    throw error;
  }
};

// --- FILESYSTEM ---
export const saveFile = async (fileName: string, data: string) => {
  try {
    const result = await Filesystem.writeFile({
      path: fileName,
      data,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    return result.uri;
  } catch (error) {
    console.error('Filesystem Error:', error);
    throw error;
  }
};

export const readFile = async (fileName: string) => {
  try {
    const contents = await Filesystem.readFile({
      path: fileName,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    return contents.data;
  } catch (error) {
    console.error('Filesystem Error:', error);
    throw error;
  }
};

// --- PUSH NOTIFICATIONS ---
export const registerPushNotifications = async () => {
  try {
    // Request permission to use push notifications
    // iOS will prompt user and return if they granted permission or not
    // Android will just grant without prompting
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('User denied permissions!');
    }

    // Register with Apple / Google to receive push via APNS/FCM
    await PushNotifications.register();

    // Listeners
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // Send token to your backend here
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });

  } catch (error) {
    console.error('Push Notifications Error:', error);
    throw error;
  }
};
