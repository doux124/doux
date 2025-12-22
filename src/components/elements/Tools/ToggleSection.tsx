import { useState, type ReactNode } from "react";
import './Hidden.css';
import '../../standards/buttons.css';

interface ToggleSectionProps {
  title: string;
  children: ReactNode;
}

const ToggleSection = ({ title, children }: ToggleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const toggleExpand = (): void => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="toggle-section">
      <button className="button-78" onClick={toggleExpand}>
        {isExpanded ? `Hide ${title}` : `${title}`}
      </button>

      {isExpanded && (
        <div className="mt-6 flex-center">
          {children}
        </div>
      )}
    </div>
  );
};

export default ToggleSection;