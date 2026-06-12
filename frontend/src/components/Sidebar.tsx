import React from "react";
import ReactMarkdown from "react-markdown";

interface SidebarProps {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  history: {
    method: string;
    prompt: string;
    response: string;
    created_at: string;
  }[];
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedTool,
  setSelectedTool,
  history,
}) => {
  const tools = [
    {
      name: "LLM Tools",
      tools: [
        "Prompt",
        "Proofreader",
        "Rewriter",
        "Summarizer",
        "Translator",
        "Writer",
        "Copywriting",
        "Explainer",
        "Document AI",
        "Image Generation",
        "Email Builder",
        "Coming soon...",
      ],
    },
   
  ];

  return (
    <div className="w-1/4 bg-gray-200 h-full p-4 border-r-2 border-white z-10 shadow-lg flex-shrink-0 flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="mb-4 text-xl font-semibold">Tools</h2>
        <div className="max-h-48 overflow-y-auto">
          {tools.map((toolGroup) => (
            <div key={toolGroup.name} className="mb-4">
              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer font-medium text-gray-700 mb-2 hover:bg-gray-300 p-2 rounded border-b border-gray-300">
                  {toolGroup.name}
                  <span className="transition group-open:rotate-180">▼</span>
                </summary>
                <ul className="pl-4 text-sm">
                  {toolGroup.tools.map((tool) => (
                    <li key={tool} className="mb-2">
                      <a
                        href="#"
                        className={`block p-2 rounded hover:bg-gray-300 cursor-pointer border-b border-gray-300 ${
                          selectedTool === tool ? "font-bold bg-gray-300" : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedTool(tool);
                        }}
                      >
                        {tool}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
        <hr className="my-4 border-t-2 border-gray-400" />
        <h2 className="mb-4 text-xl font-semibold">History</h2>
      </div>
      {history ? (
        <div className="overflow-y-auto flex-grow">
          {history.length > 0 ? (
            history.map((entry, index) => (
              <div
                key={index}
                className="mb-4 p-4 bg-white shadow rounded-lg border border-gray-300"
              >
                <h3 className="font-bold text-lg mb-2">{entry.method}</h3>

                <div className="text-sm text-gray-800 space-y-2">
                  <div>
                    <strong>Prompt:</strong> {entry.prompt.slice(0, 100)}
                  </div>

                  <div>
                    <strong>Response:</strong>{" "}
                    <ReactMarkdown>
                      {entry.response.slice(0, 100)}
                    </ReactMarkdown>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2 text-right">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No history available.</p>
          )}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No history available.</div>
      )}
    </div>
  );
};

export default Sidebar;
