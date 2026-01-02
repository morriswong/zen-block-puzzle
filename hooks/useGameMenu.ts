import { useState, useCallback } from 'react';

export interface UseGameMenuReturn {
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

/**
 * Hook for managing game menu state
 */
export const useGameMenu = (): UseGameMenuReturn => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMenu = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  return {
    isMenuOpen,
    openMenu,
    closeMenu,
    toggleMenu
  };
};
