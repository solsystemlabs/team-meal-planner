import React from "react";
import { AuthProvider } from "./components/AuthProvider";
import { LoginForm } from "./components/LoginForm";
import { MainApp } from "./components/MainApp";
import { useAuth } from "./contexts/AuthContext";

const AppContent: React.FC = () => {
  const { user } = useAuth();
  return user ? <MainApp /> : <LoginForm />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
