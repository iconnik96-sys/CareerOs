import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const HeaderContext = createContext({
  headerConfig: { title: '', subtitle: '', actions: null },
  setHeader: () => {},
  resetHeader: () => {}
});

export const HeaderProvider = ({ children }) => {
  const [headerConfig, setHeaderConfig] = useState({
    title: '',
    subtitle: '',
    actions: null
  });

  const setHeader = useCallback((config) => {
    setHeaderConfig((prev) => {
      if (
        prev.title === config.title &&
        prev.subtitle === config.subtitle &&
        prev.actions === config.actions
      ) {
        return prev;
      }
      return {
        title: config.title || '',
        subtitle: config.subtitle || '',
        actions: config.actions || null
      };
    });
  }, []);

  const resetHeader = useCallback(() => {
    setHeaderConfig({ title: '', subtitle: '', actions: null });
  }, []);

  const value = useMemo(
    () => ({ headerConfig, setHeader, resetHeader }),
    [headerConfig, setHeader, resetHeader]
  );

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => useContext(HeaderContext);
export default HeaderContext;

