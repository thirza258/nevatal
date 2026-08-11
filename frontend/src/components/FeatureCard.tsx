import React from 'react';
import { Link } from 'react-router-dom';

interface FeatureCardProps {
  title: string;
  description: string;
  /** When set, the whole card links to this tool. */
  to?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, to }) => {
  const content = (
    <>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </>
  );

  const className =
    'block p-4 border border-gray-200 rounded-lg bg-white hover:border-blue-300 hover:shadow-sm transition-all h-full';

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
};

export default FeatureCard;
