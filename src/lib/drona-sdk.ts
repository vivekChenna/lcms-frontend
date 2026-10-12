// The DronaHQ container SDK is a vendor script (public/dronahq.js). Inside the container it supplies the
// signed-in user's profile; anywhere else there is no profile to read.
type Profile = { email?: unknown };
type DronaSdk = {
  IsReady?: boolean;
  user?: {
    getProfile?: (success: (profile: Profile) => void, error: (error: unknown) => void) => void;
  };
};
declare global {
  interface Window {
    DronaHQ?: DronaSdk;
  }
}

const SDK_URL = "/dronahq.js";
const TIMEOUT_MS = 10_000;

let loading: Promise<void> | undefined;

function loadSdk(): Promise<void> {
  // never overwrite an SDK the container already supplied
  if (window.DronaHQ) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    const timer = window.setTimeout(() => {
      script.remove();
      reject(new Error("The DronaHQ SDK took too long to load. Reopen LCMS from Drona."));
    }, TIMEOUT_MS);
    script.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      script.remove();
      reject(new Error("The DronaHQ SDK could not be loaded."));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}

function whenReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = () => {
      if (window.DronaHQ?.user?.getProfile && window.DronaHQ.IsReady !== false) resolve();
      else if (Date.now() - started >= TIMEOUT_MS)
        reject(
          new Error(
            "Open LCMS inside the DronaHQ container. Its user session is unavailable here.",
          ),
        );
      else window.setTimeout(poll, 100);
    };
    poll();
  });
}

export function dronaProfileEmail(profile: Profile | null | undefined): string {
  const email = typeof profile?.email === "string" ? profile.email.trim().toLowerCase() : "";
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Drona did not supply a valid profile email.");
  }
  return email;
}

/** The email on the current Drona profile. The profile itself is never logged or stored. */
export async function fetchDronaEmail(): Promise<string> {
  await loadSdk();
  await whenReady();
  const profile = await new Promise<Profile>((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error("Loading the Drona profile took too long.")),
      TIMEOUT_MS,
    );
    const fail = () => {
      window.clearTimeout(timer);
      reject(new Error("Drona could not provide the current session."));
    };
    try {
      window.DronaHQ!.user!.getProfile!((p) => {
        window.clearTimeout(timer);
        resolve(p);
      }, fail);
    } catch {
      fail();
    }
  });
  return dronaProfileEmail(profile);
}
