import React from "react";
import { Users, Crown, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white shadow-lg border-b border-purple-100">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-10 h-10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Team Lunch Planner
              </h1>
              <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {user?.is_admin && (
              <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                <Crown className="w-4 h-4 mr-1" />
                Admin
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
