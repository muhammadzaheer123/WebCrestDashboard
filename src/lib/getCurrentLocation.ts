export type CurrentLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export async function getCurrentLocation(): Promise<CurrentLocation> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not supported in this browser.");
  }

  if ("permissions" in navigator) {
    try {
      const perm = await navigator.permissions.query({
        name: "geolocation",
      } as PermissionDescriptor);

      if (perm.state === "denied") {
        throw new Error(
          "Location permission denied. Please allow location access in your browser.",
        );
      }
    } catch {
      // Ignore Permissions API issues and continue to actual geolocation call
    }
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        switch (error.code) {
          case 1:
            reject(
              new Error(
                "Location permission denied. Please allow location access in your browser.",
              ),
            );
            break;
          case 2:
            reject(
              new Error(
                "Location unavailable. Please make sure your device location is turned on.",
              ),
            );
            break;
          case 3:
            reject(new Error("Location request timed out. Please try again."));
            break;
          default:
            reject(new Error(error.message || "Failed to get location."));
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  });
}
