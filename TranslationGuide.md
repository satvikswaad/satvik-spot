# React JS Custom Translation System (i18n)

This is a lightweight, type-safe translation system using TypeScript, JavaScript Proxy, and React Context. It does not require any external libraries like `react-i18next`.

## Features
- **TypeScript Support:** Ensures no translation keys are missed in English.
- **Auto-Fallback (Proxy):** If a Hindi or Urdu word is missing, it automatically falls back to English without crashing.
- **Reactivity:** Changing the language instantly updates the entire UI.
- **RTL Support:** Automatically switches document direction to Right-to-Left for Urdu.

---

## 1. Types (`src/translations/types.ts`)
Defines the schema and allowed languages.

```typescript
export type Language = 'en' | 'hi' | 'ur';

export interface TranslationSchema {
  // Navigation
  home: string;
  about: string;
  contact: string;
  
  // Actions
  login: string;
  signup: string;
  submit: string;
  
  // Content
  welcomeMessage: string;
  description: string;
}
```

## 2. Dictionaries (`src/translations/`)

### `en.ts` (English - Default)
```typescript
import { TranslationSchema } from './types';

export const en: TranslationSchema = {
  home: "Home",
  about: "About Us",
  contact: "Contact",
  login: "Login",
  signup: "Sign Up",
  submit: "Submit",
  welcomeMessage: "Welcome to our Website!",
  description: "We provide the best services in the world."
};
```

### `hi.ts` (Hindi)
```typescript
import { TranslationSchema } from './types';

// Using Partial so missing words don't throw errors
export const hi: Partial<TranslationSchema> = {
  home: "मुख्य पृष्ठ",
  about: "हमारे बारे में",
  contact: "संपर्क करें",
  login: "लॉग इन",
  signup: "साइन अप",
  submit: "जमा करें",
  welcomeMessage: "हमारी वेबसाइट पर आपका स्वागत है!",
  description: "हम दुनिया में सबसे अच्छी सेवाएं प्रदान करते हैं।"
};
```

### `ur.ts` (Urdu)
```typescript
import { TranslationSchema } from './types';

export const ur: Partial<TranslationSchema> = {
  home: "ہوم",
  about: "ہمارے بارے میں",
  contact: "رابطہ کریں",
  login: "لاگ ان",
  signup: "سائن اپ",
  submit: "جمع کرائیں",
  welcomeMessage: "ہماری ویب سائٹ پر خوش آمدید!",
  description: "ہم دنیا میں بہترین خدمات فراہم کرتے ہیں۔"
};
```

## 3. Proxy Engine (`src/translations/index.ts`)
Handles fetching translations and fallback logic.

```typescript
import { Language, TranslationSchema } from './types';
import { en } from './en';
import { hi } from './hi';
import { ur } from './ur';

const dictionaries: Record<Language, Partial<TranslationSchema>> = {
  en,
  hi,
  ur
};

export const useTranslation = (lang: Language): TranslationSchema => {
  const dictionary = dictionaries[lang] || en;
  
  return new Proxy(dictionary, {
    get(target, prop: string | symbol) {
      if (prop in target && (target as any)[prop] !== undefined) {
        return (target as any)[prop];
      }
      return (en as any)[prop] || prop.toString();
    }
  }) as unknown as TranslationSchema;
};
```

## 4. React Context (`src/translations/TranslationContext.tsx`)
Provides language state globally and saves it to localStorage.

```tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from './types';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language') as Language;
    return saved || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    
    // RTL logic for Urdu
    if (lang === 'ur') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  };

  useEffect(() => {
    if (language === 'ur') {
      document.documentElement.dir = 'rtl';
    }
  }, []);

  return (
    <TranslationContext.Provider value={{ language, setLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useLanguage must be used within a TranslationProvider');
  }
  return context;
};
```

## 5. Implementation Example

### Step 1: Wrap Application in `App.tsx`
```tsx
import { TranslationProvider } from './translations/TranslationContext';
import Home from './components/Home';

function App() {
  return (
    <TranslationProvider>
      <Home />
    </TranslationProvider>
  );
}

export default App;
```

### Step 2: Use in any Component (`Home.tsx`)
```tsx
import { useLanguage } from '../translations/TranslationContext';
import { useTranslation } from '../translations';

const Home = () => {
  const { language, setLanguage } = useLanguage();
  const t = useTranslation(language); 

  return (
    <div className="p-8">
      {/* Language Switcher */}
      <select 
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        className="mb-8 p-2 border rounded"
      >
        <option value="en">English</option>
        <option value="hi">हिंदी (Hindi)</option>
        <option value="ur">اردو (Urdu)</option>
      </select>

      {/* Translated Content */}
      <h1 className="text-3xl font-bold">{t.welcomeMessage}</h1>
      <p className="mt-4 text-gray-600">{t.description}</p>
      
      <button className="bg-blue-500 text-white px-4 py-2 mt-4 rounded">
        {t.login}
      </button>
    </div>
  );
};

export default Home;
```
