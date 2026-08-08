import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200 print:hidden">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden scale-in-95 duration-200">
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-center text-gray-900 mb-2">{title || 'Confirm Action'}</h2>
                    <p className="text-center text-gray-500 text-sm mb-6">{message || 'Are you sure you want to proceed?'}</p>
                    <div className="flex space-x-3">
                        <button onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition">Cancel</button>
                        <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition shadow-md shadow-red-500/30">Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ConfirmDialog;
