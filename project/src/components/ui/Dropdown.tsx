import React, { useRef, useState, useEffect, memo } from 'react';

type DropdownProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
};

const Dropdown: React.FC<DropdownProps> = memo(({
  trigger,
  children,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={toggleDropdown} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={`
            absolute mt-2 ${align === 'right' ? 'right-0' : 'left-0'} 
            z-10 w-56 origin-top-right rounded-md bg-white shadow-lg 
            border border-gray-200 py-1 focus:outline-none
            animate-in fade-in-50 zoom-in-95 duration-100
          `}
        >
          {children}
        </div>
      )}
    </div>
  );
});

Dropdown.displayName = 'Dropdown';

export const DropdownItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
}> = memo(({ children, onClick, icon, danger = false, disabled = false, className = '' }) => {
  return (
    <button
      className={`
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}
        group flex w-full items-center px-4 py-2 text-sm
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
});

DropdownItem.displayName = 'DropdownItem';

export default Dropdown;