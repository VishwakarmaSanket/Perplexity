import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useEffect } from "react";

const App = () => {
  const auth = useAuth();

  useEffect(() => {
    auth.handleGetMe();
  }, []);

  return <RouterProvider router={router} />;
};

export default App;
