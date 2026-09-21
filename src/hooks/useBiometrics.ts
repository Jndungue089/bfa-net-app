import * as LocalAuthentication from "expo-local-authentication";

/** True when the device can do a biometric/passcode check. */
export async function canAuthenticate(): Promise<boolean> {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

export async function authenticate(prompt = "Desbloquear o BFA NET"): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: prompt, cancelLabel: "Cancelar", disableDeviceFallback: false });
    return r.success;
  } catch {
    return false;
  }
}
