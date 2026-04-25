import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, Sparkles, Copy, Check } from 'lucide-react';

type PIIType = 'names' | 'emails' | 'phones' | 'ssn' | 'creditCards' | 'passwords' | 'moneyAmounts' | 'addresses' | 'dates' | 'urls' | 'ipAddresses' | 'numbers';

interface PIIConfig {
  [key: string]: {
    label: string;
    pattern: RegExp;
    placeholder: string;
    minStrength: number;
  };
}

interface ReplacementEntry {
  token: string;
  originalValue: string;
}

type AppTab = 'sanitizer' | 'desanitizer';
type CopiedOutput = 'sanitized' | 'desanitized' | null;

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
  names: { label: 'Person Names', pattern: /\b(?!Hi\b|Hello\b|Hey\b|Greetings\b|Dear\b)[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g, placeholder: '[NAME]', minStrength: 50 },
  numbers: { label: 'All Numbers', pattern: /\b\d{3,}\b/g, placeholder: '[NUM]', minStrength: 95 },
};

export default function App() {
  const [inputText, setInputText] = useState('');
  const [deSanitizerInput, setDeSanitizerInput] = useState('');
  const [activeTab, setActiveTab] = useState<AppTab>('sanitizer');
  const [copiedOutput, setCopiedOutput] = useState<CopiedOutput>(null);
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

  const sanitizeText = (text: string): { sanitizedText: string; replacements: ReplacementEntry[] } => {
    let sanitized = text;
    const replacements: ReplacementEntry[] = [];
    let tokenCounter = 1;

    const replaceWithToken = (source: string, pattern: RegExp, basePlaceholder: string): string =>
      source.replace(pattern, (match) => {
        const token = `${basePlaceholder.slice(0, -1)}_${tokenCounter}]`;
        tokenCounter += 1;
        replacements.push({ token, originalValue: match });
        return token;
      });

    if (enabledTypes.names) {
      // Catch greeting-based single names like "Hi John" that are not matched by full-name patterns.
      sanitized = sanitized.replace(/\b(Hi|Hello|Hey|Greetings|Dear)\s+([A-Z][a-z]+)\b/g, (_, greeting: string, name: string) => {
        const token = `[NAME_${tokenCounter}]`;
        tokenCounter += 1;
        replacements.push({ token, originalValue: name });
        return `${greeting} ${token}`;
      });
    }

    Object.entries(piiConfig).forEach(([key, config]) => {
      if (enabledTypes[key as PIIType]) {
        sanitized = replaceWithToken(sanitized, config.pattern, config.placeholder);
      }
    });
    return { sanitizedText: sanitized, replacements };
  };

  const { sanitizedText: outputText, replacements } = sanitizeText(inputText);
  const hasSanitizerData = inputText.trim().length > 0 && outputText.trim().length > 0;
  const replacementMap = new Map(replacements.map((item) => [item.token, item.originalValue]));
  const deSanitizedOutput = deSanitizerInput.replace(/\[[^\]]+_\d+\]/g, (token) => replacementMap.get(token) ?? token);

  const toggleType = (type: PIIType) => {
    setEnabledTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const copyToClipboard = async (text: string, target: Exclude<CopiedOutput, null>) => {
    if (!text.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopiedOutput(target);
    window.setTimeout(() => setCopiedOutput((current) => (current === target ? null : current)), 1500);
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
                  AI privacy-sanitizer
                </h1>
                <p className="text-gray-500 text-xs md:text-sm font-mono">v0.1.0 | Open Source Privacy Filtering Engine for AI/LLM prompts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900/40 p-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('sanitizer')}
              className={`rounded-xl px-4 py-2 text-sm transition-colors ${
                activeTab === 'sanitizer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Sanitizer
            </button>
            <button
              type="button"
              onClick={() => hasSanitizerData && setActiveTab('desanitizer')}
              disabled={!hasSanitizerData}
              className={`rounded-xl px-4 py-2 text-sm transition-colors ${
                activeTab === 'desanitizer'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-800`}
            >
              De-sanitizer
            </button>
          </div>
        </div>

        {activeTab === 'sanitizer' ? (
          <>
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
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                    <EyeOff className="w-5 h-5 text-white" />
                  </div>
                  <label className="text-white">Sanitized Output</label>
                </div>
                <button
                  type="button"
                  onClick={() => void copyToClipboard(outputText, 'sanitized')}
                  disabled={!outputText.trim()}
                  className="inline-flex items-center gap-2 rounded-lg border border-green-500/40 bg-slate-900/60 px-3 py-2 text-sm text-green-100 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copiedOutput === 'sanitized' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedOutput === 'sanitized' ? 'Copied' : 'Copy'}
                </button>
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
          </>
        ) : (
          <>
            {/* De-sanitizer Input */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 mb-6 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <label className="text-white">De-sanitizer Input</label>
              </div>
              <textarea
                value={deSanitizerInput}
                onChange={(e) => setDeSanitizerInput(e.target.value)}
                className="w-full h-48 p-4 border-2 border-blue-500/30 rounded-xl focus:border-blue-400 focus:outline-none resize-none bg-slate-900/50 text-white placeholder:text-gray-500"
                placeholder="Paste LLM output containing sanitizer placeholders..."
              />
            </div>

            {/* De-sanitizer Output */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 mb-6 border border-green-500/30">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <label className="text-white">De-sanitizer Output</label>
                </div>
                <button
                  type="button"
                  onClick={() => void copyToClipboard(deSanitizedOutput, 'desanitized')}
                  disabled={!deSanitizedOutput.trim()}
                  className="inline-flex items-center gap-2 rounded-lg border border-green-500/40 bg-slate-900/60 px-3 py-2 text-sm text-green-100 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copiedOutput === 'desanitized' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedOutput === 'desanitized' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <textarea
                value={deSanitizedOutput}
                readOnly
                className="w-full h-48 p-4 border-2 border-green-500/30 rounded-xl bg-gradient-to-br from-green-950/20 to-slate-900/50 resize-none text-green-100 placeholder:text-gray-500"
                placeholder="De-sanitized text will appear here..."
              />
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400 flex flex-wrap items-center justify-center gap-2 bg-slate-800/50 rounded-full px-6 py-3 border border-slate-700">
          <Lock className="w-4 h-4" />
          <span>All processing happens locally in your browser</span>
          <span className="text-gray-600">|</span>
          <a
            href="https://github.com/valeriyc/AIPrivacySanitizer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          >
            GitHub project
          </a>
        </div>
      </div>
    </div>
  );
}