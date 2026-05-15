"use client"

import { Provider } from "react-redux";
import { store } from "../redux/store";
import { ThemeProvider } from "../components/ThemeProvider";
import { Toaster } from "react-hot-toast";

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </ThemeProvider>
    </Provider>
  );
}
