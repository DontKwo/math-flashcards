import React, { useState, useRef, useEffect } from 'react';
import { IconButton } from './IconButton.tsx';
import { Icon } from './Icon.tsx';
import './ui.css';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  isDestructive?: boolean;
  onClick: () => void;
  'data-testid'?: string;
}

export interface MenuProps {
  items: MenuItem[];
  triggerLabel?: string;
  className?: string;
}

export const Menu: React.FC<MenuProps> = ({
  items,
  triggerLabel = 'Options',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`ui-menu-container ${className}`} ref={menuRef}>
      <IconButton
        variant="ghost"
        size="md"
        aria-label={triggerLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icon name="menu" size={18} />
      </IconButton>

      {isOpen && (
        <div className="ui-menu-dropdown" role="menu">
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              role="menuitem"
              className={`ui-menu-item ${item.isDestructive ? 'is-destructive' : ''}`}
              data-testid={item['data-testid']}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
            >
              {item.icon && <span className="ui-menu-item-icon">{item.icon}</span>}
              <span className="ui-menu-item-text">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
