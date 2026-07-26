import { describe, it, expect } from 'vitest';
import { useAppStore } from '../store/useAppStore.js';

describe('Desktop AppStore', () => {
  it('should initialize theme and default state', () => {
    const state = useAppStore.getState();
    expect(state.activeTab).toBeDefined();
    expect(state.devices).toBeDefined();
    expect(state.transfers).toBeDefined();
  });

  it('should set active tab correctly', () => {
    useAppStore.getState().setActiveTab('transfers');
    expect(useAppStore.getState().activeTab).toBe('transfers');
  });

  it('should toggle theme cleanly', () => {
    const initialTheme = useAppStore.getState().theme;
    useAppStore.getState().setTheme(initialTheme === 'dark' ? 'light' : 'dark');
    expect(useAppStore.getState().theme).not.toBe(initialTheme);
  });
});
