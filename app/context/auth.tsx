import * as SecureStore from "expo-secure-store";
import * as React from "react";
import { createContext, useCallback, useContext, useEffect } from "react";
import { Platform } from "react-native";

import * as AuthSession from "expo-auth-session";
import { useAuthRequest } from "expo-auth-session";
import { router, useNavigation } from "expo-router";
import { env } from "lib/env";

type UseStateHook<T> = [[boolean, T | null], (value?: T | null) => void];

function useAsyncState<T>(
  initialValue: [boolean, T | null] = [true, null]
): UseStateHook<T> {
  return React.useReducer<any>(
    (state: [boolean, T | null], action: T | null = null) => [false, action],
    initialValue
  ) as UseStateHook<T>;
}

export async function setStorageItemAsync(key: string, value: string | null) {
  if (Platform.OS === "web") {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error("Local storage is unavailable:", e);
    }
  } else {
    if (value == null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }
}

export function useStorageState(key: string): UseStateHook<string | any> {
  // Public
  const [state, setState] = useAsyncState<string>();

  // Get
  useEffect(() => {
    if (Platform.OS === "web") {
      try {
        if (typeof localStorage !== "undefined") {
          setState(localStorage.getItem(key));
        }
      } catch (e) {
        console.error("Local storage is unavailable:", e);
      }
    } else {
      SecureStore.getItemAsync(key).then((value) => {
        setState(value);
      });
    }
  }, [key]);

  // Set
  const setValue = useCallback(
    (value: string | null) => {
      setStorageItemAsync(key, value).then(() => {
        setState(value);
      });
    },
    [key]
  );

  return [state, setValue];
}

const AuthContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  setSessionManual: (session: string) => void;
  session?: string | null;
  isLoading: boolean;
  authHeaders?: Record<string, string>;
  restHeaders?: Record<string, string>;
} | null>(null);

// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext)!;
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "arena-rn",
  path: "callback",
});

const discovery = {
  authorizationEndpoint: "https://dev.are.na/oauth/authorize",
};

const tokenUrl = env.EXPO_PUBLIC_ARENA_TOKEN_URL;

const getToken = async (code: string) => {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });
  const json = await response.json();
  return json as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
};

const authConfig: AuthSession.AuthRequestConfig = {
  clientId: env.EXPO_PUBLIC_ARENA_CLIENT_ID,
  redirectUri,
};

export function SessionProvider(props: { children: React.ReactNode }) {
  const [[isLoading, session], setSession] = useStorageState("session");

  const [request, response, promptAsync] = useAuthRequest(
    authConfig,
    discovery
  );

  useEffect(() => {
    if (response?.type === "success") {
      getToken(response.params.code).then((token) => {
        setSession(token.access_token);
      });
    }
  }, [response]);

  const navigation = useNavigation();

  return (
    <AuthContext.Provider
      value={{
        setSessionManual: (session: string) => {
          setSession(session);
          router.replace("/(app)/(tabs)");
        },
        signIn: async () => {
          // Perform sign-in logic here
          await promptAsync();
          // await AuthSession.refreshAsync(authConfig, {
          // 	tokenEndpoint: url,
          // });
        },
        authHeaders: {
          "x-auth-token": `${session}`,
          "x-app-token": "pL4YhrdwXq7Bm7t8s6Yt",
        },
        restHeaders: {
          Authorization: `Bearer ${session}`,
        },
        signOut: () => {
          setSession(null);
        },
        session,
        isLoading,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}
