import React from "react";
import { useNavigate } from "react-router-dom";

interface NavBarProps {
  selectedTool: string;
  hasApiKey: boolean;
  onClearApiKey: () => Promise<void> | void;
  onClearDocument: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ selectedTool, hasApiKey, onClearApiKey, onClearDocument }) => {
  const navigate = useNavigate();
    return (
    <nav className="w-full h-16 bg-gray-800 text-white flex items-center justify-between px-4 border-b-2 border-white z-10">
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Nevatal Logo" className="h-8 w-8" />
        <h1 className="text-lg font-bold">Nevatal</h1>
        <button
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-md text-sm"
          onClick={() => {
            navigate("/about");
          }}
        >
          About Us
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex gap-4">
          <span className="font-bold text-blue-400">
            {selectedTool} Page 
          </span>
        </div>
          {selectedTool === "Document AI" && (
            <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-md text-sm" onClick={() => {
              onClearDocument();
            }}>
              Clear Document
            </button>
          )}
        {hasApiKey ? (
          <button
            className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-md text-sm"
            onClick={onClearApiKey}  
          >
            Clear API Key
          </button>
        ) : (
          <button
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-md text-sm"
            onClick={async () => {
              await onClearApiKey();
              window.location.reload();
            }}
          >
            Renew API Key
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
