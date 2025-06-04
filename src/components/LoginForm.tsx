import React, { useState } from "react";
import {
  Users,
  Mail,
  Lock,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export const LoginForm: React.FC = () => {
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { login, signup, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSignupSuccess(false);

    if (isSignupMode) {
      const success = await signup(email, password, name);
      if (success) {
        setSignupSuccess(true);
        setEmail("");
        setPassword("");
        setName("");
        // Don't automatically switch to login mode - show success message
      } else {
        setError("Signup failed. Please try again.");
      }
    } else {
      const success = await login(email, password);
      if (!success) {
        setError(
          "Invalid credentials. If you just signed up, please check your email and confirm your account before logging in.",
        );
      }
    }
  };

  const handleSwitchMode = () => {
    setIsSignupMode(!isSignupMode);
    setError("");
    setSignupSuccess(false);
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">
            Team Lunch
          </h1>
          <p className="text-gray-600 mt-2">Plan your team meals together</p>
        </div>

        {signupSuccess ? (
          <div className="text-center space-y-4">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Check Your Email!
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-blue-800 font-medium mb-2">
                    Account created successfully!
                  </p>
                  <p className="text-blue-700 text-sm">
                    We've sent a confirmation email to <strong>{email}</strong>.
                    Please click the link in the email to verify your account
                    before logging in.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSwitchMode}
              className="w-full bg-gradient-to-r from-blue-600 to-slate-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-slate-800 transition-all"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignupMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {isSignupMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 font-medium text-sm">
                      Email Confirmation Required
                    </p>
                    <p className="text-yellow-700 text-sm">
                      After signing up, you'll need to confirm your email
                      address before you can log in.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-slate-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-slate-800 transition-all disabled:opacity-50"
            >
              {loading ? "Loading..." : isSignupMode ? "Sign Up" : "Sign In"}
            </button>

            <p className="text-center text-sm text-gray-600">
              {isSignupMode
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={handleSwitchMode}
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                {isSignupMode ? "Sign in" : "Sign up"}
              </button>
            </p>
          </form>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Demo: Use any email and password "password" for testing
          </p>
        </div>
      </div>
    </div>
  );
};
