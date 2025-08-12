import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    hover: string;
    headerBg: string;
    headerText: string;
    filterBg: string;
    filterText: string;
    activeBg: string;
    activeText: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themes: Theme[] = [
    {
      id: 'default',
      name: 'Default Blue',
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#06b6d4',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        hover: '#f1f5f9',
        headerBg: '#f1f5f9',
        headerText: '#334155',
        filterBg: '#ffffff',
        filterText: '#475569',
        activeBg: '#2563eb',
        activeText: '#ffffff'
      }
    }
  ];

  private currentThemeSubject = new BehaviorSubject<Theme>(this.themes[0]);
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    // Load saved theme from localStorage
    const savedThemeId = localStorage.getItem('selectedTheme');
    if (savedThemeId) {
      const savedTheme = this.themes.find(theme => theme.id === savedThemeId);
      if (savedTheme) {
        this.currentThemeSubject.next(savedTheme);
      }
    }
  }

  getThemes(): Theme[] {
    return this.themes;
  }

  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  setTheme(themeId: string): void {
    const theme = this.themes.find(t => t.id === themeId);
    if (theme) {
      this.currentThemeSubject.next(theme);
      localStorage.setItem('selectedTheme', themeId);
      this.applyThemeToDocument(theme);
    }
  }

  private applyThemeToDocument(theme: Theme): void {
    const root = document.documentElement;
    
    // Set theme data attribute for CSS targeting
    document.body.setAttribute('data-theme', theme.id);
    
    // Object.entries(theme.colors).forEach(([key, value]) => {
    //   root.style.setProperty(`--theme-${key}`, value);
    //   // Also set Bootstrap CSS variables
    //   if (key === 'primary') root.style.setProperty('--bs-primary', value);
    //   if (key === 'secondary') root.style.setProperty('--bs-secondary', value);
    //   if (key === 'background') root.style.setProperty('--bs-body-bg', value);
    //   if (key === 'text') root.style.setProperty('--bs-body-color', value);
    //   if (key === 'border') root.style.setProperty('--bs-border-color', value);
    // });
  }

  initializeTheme(): void {
    this.applyThemeToDocument(this.getCurrentTheme());
  }
}