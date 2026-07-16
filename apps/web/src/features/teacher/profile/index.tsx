import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileForm } from './components/ProfileForm';

export default function TeacherProfileFeature() {
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      <ProfileHeader />

      {message && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' 
            ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-green-600" /> 
            : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
          }
          <div className="flex-1 font-medium text-sm mt-0.5">{message.text}</div>
          <button 
            type="button" 
            onClick={() => setMessage(null)} 
            className="p-1 rounded-md hover:bg-black/5 transition-colors opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <ProfileForm 
        onSuccess={(msg) => setMessage({ type: 'success', text: msg })}
        onError={(msg) => setMessage({ type: 'error', text: msg })}
      />
    </div>
  );
}
