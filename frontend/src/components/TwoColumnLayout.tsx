import React from 'react';

interface TwoColumnLayoutProps {
  inputComponent: React.ReactNode;
  resultComponent: React.ReactNode;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ inputComponent, resultComponent }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
      {inputComponent}
      {resultComponent}
    </div>
  );
};

export default TwoColumnLayout;
