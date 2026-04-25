import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

type PIIType = 'names' | 'emails' | 'phones' | 'ssn' | 'creditCards' | 'passwords' | 'moneyAmounts' | 'addresses' | 'dates' | 'urls' | 'ipAddresses' | 'numbers';

interface PIIConfig {
  [key: string]: {
    label: string;
    pattern: RegExp;
    placeholder: string;
    minStrength: number;
  };
}

const piiConfig: PIIConfig = {
  passwords: { label: 'Passwords', pattern: /(?:password|pwd|pass)\s*[:=]\s*\S+/gi, placeholder: '[PASSWORD_REDACTED]', minStrength: 0 },
  creditCards: { label: 'Credit Cards', pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, placeholder: '[CARD_****]', minStrength: 0 },
  ssn: { label: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g, placeholder: '[SSN_***]', minStrength: 0 },
  moneyAmounts: { label: 'Money Amounts', pattern: /(?<!\w)(?:[$€£¥]\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|EUR|GBP|JPY))(?!\w)/gi, placeholder: '[MONEY]', minStrength: 20 },
  addresses: { label: 'Addresses', pattern: /\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,5}\s+(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|lane|ln\.?|drive|dr\.?|court|ct\.?|circle|cir\.?|way)\b/gi, placeholder: '[ADDRESS]', minStrength: 30 },
  emails: { label: 'Email Addresses', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, placeholder: '[EMAIL]', minStrength: 50 },
  phones: { label: 'Phone Numbers', pattern: /(?:\+?1[-.\s\u2013\u2014]?)?\(?\d{3}\)?[-.\s\u2013\u2014]?\d{3}[-.\s\u2013\u2014]?\d{4}\b/g, placeholder: '[PHONE]', minStrength: 50 },
  dates: { label: 'Dates', pattern: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, placeholder: '[DATE]', minStrength: 70 },
  urls: { label: 'URLs', pattern: /https?:\/\/[^\s]+/gi, placeholder: '[URL]', minStrength: 70 },
  ipAddresses: { label: 'IP Addresses', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, placeholder: '[IP]', minStrength: 80 },
  names: { label: 'Person Names', pattern: /\b(?!Hi\b|Hello\b|Hey\b|Greetings\b|Dear\b)[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g, placeholder: '[NAME]', minStrength: 90 },
  numbers: { label: 'All Numbers', pattern: /\b\d{3,}\b/g, placeholder: '[NUM]', minStrength: 95 },
};

export default function App() {
  const [inputText, setInputText] = useState('');
  const [strength, setStrength] = useState(50);
  const [enabledTypes, setEnabledTypes] = useState<Record<PIIType, boolean>>({
    names: false,
    emails: false,
    phones: false,
    ssn: true,
    creditCards: true,
    passwords: true,
    moneyAmounts: false,
    addresses: false,
    dates: false,
    urls: false,
    ipAddresses: false,
    numbers: false,
  });

  useEffect(() => {
    const newEnabled: Record<string, boolean> = {};
    Object.keys(piiConfig).forEach((key) => {
      newEnabled[key] = strength >= piiConfig[key].minStrength;
    });
    setEnabledTypes(newEnabled as Record<PIIType, boolean>);
  }, [strength]);

  const sanitizeText = (text: string): string => {
    let sanitized = text;
    Object.entries(piiConfig).forEach(([key, config]) => {
      if (enabledTypes[key as PIIType]) {
        sanitized = sanitized.replace(config.pattern, config.placeholder);
      }
    });
    return sanitized;
  };

  const outputText = sanitizeText(inputText);

  const toggleType = (type: PIIType) => {
    setEnabledTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="relative mb-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-lg p-4 md:p-5 shadow-xl border border-slate-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="relative p-2 bg-slate-800 border border-slate-600 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-400" />
                  <Lock className="w-3 h-3 text-green-400 absolute bottom-0 right-0" />
                </div>
              </div>
              <div>
                <h1 className="text-gray-100 text-xl md:text-2xl font-mono tracking-tight">
                  privacy-sanitizer
                </h1>
                <p className="text-gray-500 text-xs md:text-sm font-mono">v2.1.0 | Open Source PII Detection Engine</p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 mb-6 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <label className="text-white">Input Text</label>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-48 p-4 border-2 border-blue-500/30 rounded-xl focus:border-blue-400 focus:outline-none resize-none bg-slate-900/50 text-white placeholder:text-gray-500"
            placeholder="Paste or type text containing sensitive information here..."
          />
        </div>

        {/* Output Section */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 mb-6 border border-green-500/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <EyeOff className="w-5 h-5 text-white" />
            </div>
            <label className="text-white">Sanitized Output</label>
          </div>
          <div className="w-full h-48 p-4 border-2 border-green-500/30 rounded-xl bg-gradient-to-br from-green-950/20 to-slate-900/50 overflow-auto whitespace-pre-wrap break-words text-green-100">
            {outputText || <span className="text-gray-500">Sanitized text will appear here...</span>}
          </div>
        </div>

        {/* Sensitivity Slider */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 mb-6 border border-blue-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-green-600/5"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <label className="text-white">Sensitization Strength</label>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg">
                <span className="text-2xl font-semibold text-white">{strength}%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #10b981 ${strength}%, #1e293b ${strength}%, #1e293b 100%)`
              }}
            />
            <div className="flex justify-between mt-2 text-sm text-gray-400">
              <span>Minimal</span>
              <span>Maximum</span>
            </div>
          </div>
        </div>

        {/* PII Type Checkboxes */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white">Privacy Filters</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(piiConfig).map(([key, config]) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer p-3 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-800/50 hover:from-blue-600/30 hover:to-green-600/30 border border-slate-700 hover:border-blue-500/50 transition-all"
              >
                <input
                  type="checkbox"
                  checked={enabledTypes[key as PIIType]}
                  onChange={() => toggleType(key as PIIType)}
                  className="w-4 h-4 accent-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-200">{config.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400 flex items-center justify-center gap-2 bg-slate-800/50 rounded-full px-6 py-3 border border-slate-700">
          <Lock className="w-4 h-4" />
          <span>All processing happens locally in your browser</span>
        </div>
      </div>
    </div>
  );
}