import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  checkForGitHubUpdates,
  isGitHubConfigured,
} from '@utils/gitIntegration';

interface GitHubSyncContextType {
  hasUpdates: boolean;
  checkForUpdates: () => Promise<void>;
  clearUpdateBadge: () => void;
}

const GitHubSyncContext = createContext<GitHubSyncContextType>({
  hasUpdates: false,
  checkForUpdates: async () => {},
  clearUpdateBadge: () => {},
});

export const useGitHubSync = () => useContext(GitHubSyncContext);

export const GitHubSyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hasUpdates, setHasUpdates] = useState(false);

  const checkForUpdates = useCallback(async () => {
    const configured = await isGitHubConfigured();
    if (configured) {
      const result = await checkForGitHubUpdates();
      setHasUpdates(result.hasUpdates);
    }
  }, []);

  const clearUpdateBadge = useCallback(() => {
    setHasUpdates(false);
  }, []);

  useEffect(() => {
    // Set up periodic check (every 5 minutes)
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    // Use a promise to defer the initial check to avoid calling setState in effect
    Promise.resolve().then(() => checkForUpdates());

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  return (
    <GitHubSyncContext.Provider
      value={{ hasUpdates, checkForUpdates, clearUpdateBadge }}
    >
      {children}
    </GitHubSyncContext.Provider>
  );
};
