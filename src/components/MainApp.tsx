import React, { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Header } from "./Header";
import { CurrentWeekView } from "./CurrentWeekView";
import { NextWeekView } from "./NextWeekView";

export const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"current" | "next">("next");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex space-x-1 mb-8 bg-white p-1 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab("current")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === "current"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>This Week</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("next")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === "next"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Next Week</span>
            </div>
          </button>
        </div>

        {activeTab === "current" ? <CurrentWeekView /> : <NextWeekView />}
      </div>
    </div>
  );
};
