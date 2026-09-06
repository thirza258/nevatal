import React, { useState } from 'react';
import services from '../../services/services';
import ChatPanel from '../../components/ChatPanel';
import { useChat } from '../../hooks/useChat';
import { SelectField, type Option } from '../../components/FormControls';
import { conversationStorageKey } from '../../constant';

const LEVELS: Option[] = [
  { value: 'a curious ten-year-old', label: 'Explain to a 10-year-old' },
  { value: 'a complete beginner with no background in the subject', label: 'Beginner' },
  { value: 'someone who works adjacent to the field and knows the basics', label: 'Intermediate' },
  { value: 'an expert who wants the precise, technical account', label: 'Expert' },
];

const STYLES: Option[] = [
  { value: 'a clear, direct explanation', label: 'Straightforward' },
  { value: 'an explanation built around a concrete analogy', label: 'Use an analogy' },
  { value: 'a numbered, step-by-step walkthrough', label: 'Step by step' },
  { value: 'an explanation that starts from first principles', label: 'First principles' },
];

const ExplainerPage: React.FC = () => {
  const [level, setLevel] = useState(LEVELS[1].value);
  const [style, setStyle] = useState(STYLES[0].value);

  const { messages, isLoading, sendMessage, clearMessages } = useChat(
    (text, conversation) =>
      services.postExplainer(
        [
          `Explain the following for ${level}.`,
          `Give ${style}.`,
          'End with a one-sentence summary.',
          '',
          `Topic: ${text}`,
        ].join('\n'),
        // Follow-ups are the point of this page, so the thread goes with them.
        conversation
      ),
    conversationStorageKey('/explainer')
  );

  return (
    <div className="h-full flex flex-col gap-3">
      <header className="flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Explainer</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Get any concept explained at the depth you choose — ask follow-up
            questions to go deeper.
          </p>
        </div>
        <button
          type="button"
          onClick={clearMessages}
          disabled={messages.length === 0 || isLoading}
          className="flex-shrink-0 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 border border-gray-200 disabled:opacity-50"
        >
          Clear chat
        </button>
      </header>

      <div className="flex-1 min-h-0">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSend={sendMessage}
          sendLabel="Explain"
          placeholder="Enter a topic, question, or concept..."
          composerHeader={
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField
                id="explain-level"
                label="Explain for"
                value={level}
                options={LEVELS}
                onChange={setLevel}
                disabled={isLoading}
              />
              <SelectField
                id="explain-style"
                label="Style"
                value={style}
                options={STYLES}
                onChange={setStyle}
                disabled={isLoading}
              />
            </div>
          }
          emptyState={
            <div>
              <p className="text-3xl font-bold text-gray-400">
                Need something explained?
              </p>
              <p className="text-gray-400 mt-2">
                Pick the depth below, then name the concept.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default ExplainerPage;
