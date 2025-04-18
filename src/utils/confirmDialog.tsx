import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Check } from 'lucide-react';

interface ConfirmDialogProps {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'delete' | 'warn' | 'confirm';
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  title = 'Confirm Action',
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warn',
  onConfirm, 
  onCancel,
  isOpen
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Start entrance animation after mounting
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    setIsVisible(false);
    // Delay the actual confirmation to allow animation to complete
    setTimeout(() => {
      onConfirm();
    }, 300);
  };

  const handleCancel = () => {
    setIsVisible(false);
    // Delay the cancellation to allow animation to complete
    setTimeout(() => {
      onCancel();
    }, 300);
  };

  // Determine styles based on type
  const getIconStyles = () => {
    switch (type) {
      case 'delete':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-500',
          icon: <Trash2 className="h-6 w-6" />
        };
      case 'confirm':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-500',
          icon: <Check className="h-6 w-6" />
        };
      case 'warn':
      default:
        return {
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-500',
          icon: <AlertTriangle className="h-6 w-6" />
        };
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'delete':
        return 'bg-red-500 hover:bg-red-600 focus:ring-red-300';
      case 'confirm':
        return 'bg-green-500 hover:bg-green-600 focus:ring-green-300';
      case 'warn':
      default:
        return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-300';
    }
  };

  const { bgColor, textColor, icon } = getIconStyles();
  const buttonStyle = getButtonStyles();

  if (!isOpen) return null;

  // Use a portal to render at the root level
  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm transition-all duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
      onClick={handleCancel}
    >
      <div 
        className={`max-w-md w-[90%] m-4 p-6 rounded-lg bg-white shadow-xl border border-gray-200 transition-all duration-300 transform ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`${bgColor} p-2 rounded-full flex-shrink-0`}>
            <span className={textColor}>{icon}</span>
          </div>
          <div className="text-lg font-medium text-gray-800">{title}</div>
        </div>
        
        <p className="text-gray-600 mb-6 pl-11">{message}</p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-md transition-colors focus:outline-none focus:ring-2 flex items-center gap-2 ${buttonStyle}`}
          >
            {type === 'delete' && <Trash2 className="h-4 w-4" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Singleton pattern to manage dialog state
class ConfirmDialogManager {
  private static instance: ConfirmDialogManager;
  private resolveCallback: ((value: boolean) => void) | null = null;
  private _isOpen = false;
  private _dialogProps: Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel' | 'isOpen'> = {
    message: '',
  };

  private constructor() {}

  public static getInstance(): ConfirmDialogManager {
    if (!ConfirmDialogManager.instance) {
      ConfirmDialogManager.instance = new ConfirmDialogManager();
    }
    return ConfirmDialogManager.instance;
  }

  get isOpen() {
    return this._isOpen;
  }

  get dialogProps() {
    return this._dialogProps;
  }

  public confirm(message: string, options: Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel' | 'isOpen' | 'message'> = {}): Promise<boolean> {
    return new Promise((resolve) => {
      this._isOpen = true;
      this._dialogProps = {
        ...options,
        message,
      };
      this.resolveCallback = resolve;
      this.forceUpdate();
    });
  }

  public handleConfirm = () => {
    this._isOpen = false;
    this.forceUpdate();
    if (this.resolveCallback) {
      this.resolveCallback(true);
      this.resolveCallback = null;
    }
  };

  public handleCancel = () => {
    this._isOpen = false;
    this.forceUpdate();
    if (this.resolveCallback) {
      this.resolveCallback(false);
      this.resolveCallback = null;
    }
  };

  private forceUpdate() {
    // This will be connected to a React state update in the DialogProvider
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dialog-update'));
    }
  }
}

// React component to render the dialog
export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, forceUpdate] = useState({});
  const dialogManager = ConfirmDialogManager.getInstance();

  useEffect(() => {
    const handleUpdate = () => forceUpdate({});
    window.addEventListener('dialog-update', handleUpdate);
    return () => window.removeEventListener('dialog-update', handleUpdate);
  }, []);

  return (
    <>
      {children}
      <ConfirmDialog
        {...dialogManager.dialogProps}
        isOpen={dialogManager.isOpen}
        onConfirm={dialogManager.handleConfirm}
        onCancel={dialogManager.handleCancel}
      />
    </>
  );
};

// Export the confirm function
export const confirmDialog = (message: string, options: Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel' | 'isOpen' | 'message'> = {}): Promise<boolean> => {
  return ConfirmDialogManager.getInstance().confirm(message, options);
}; 