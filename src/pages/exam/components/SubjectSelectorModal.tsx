import { X, Check } from "lucide-react";

interface SubjectSelectorModalProps {
  isOpen: boolean;
  subjects: string[];
  currentSubject: string;
  onClose: () => void;
  onSelectSubject: (subject: string) => void;
}

export const SubjectSelectorModal = ({
  isOpen,
  subjects,
  currentSubject,
  onClose,
  onSelectSubject,
}: SubjectSelectorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="w-full bg-background rounded-t-lg max-h-[70vh] flex flex-col">
        <div className="flex justify-between items-center px-3 py-3 sm:px-4 sm:py-4 border-b gap-3">
          <h3 className="font-semibold text-sm sm:text-base">Select Subject</h3>
          <button type="button" onClick={onClose} className="shrink-0 p-1">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
          {subjects.map((subject) => {
            const isCurrent = subject === currentSubject;
            return (
              <button
                key={subject}
                type="button"
                onClick={() => {
                  onSelectSubject(subject);
                  onClose();
                }}
                className={`w-full p-3 sm:p-4 border rounded-lg text-left ${
                  isCurrent ? "border-primary bg-primary/10" : ""
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <p className="font-semibold text-xs sm:text-sm break-words min-w-0 flex-1">
                    {subject}
                  </p>
                  {isCurrent && (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
