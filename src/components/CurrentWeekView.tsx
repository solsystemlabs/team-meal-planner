import React from "react";
import { Check, MapPin } from "lucide-react";

export const CurrentWeekView: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          This Week's Lunch
        </h2>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <MapPin className="w-6 h-6 text-green-600" />
            <h3 className="text-2xl font-bold text-gray-800">
              Demo Restaurant
            </h3>
          </div>
          <p className="text-gray-600">
            Week of {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};
