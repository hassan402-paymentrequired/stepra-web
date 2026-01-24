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
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold">Select Subject</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {subjects.map((subject) => {
            const isCurrent = subject === currentSubject;
            return (
              <button
                key={subject}
                onClick={() => {
                  onSelectSubject(subject);
                  onClose();
                }}
                className={`w-full p-4 border rounded-lg mb-3 text-left ${
                  isCurrent ? "border-primary bg-primary/10" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{subject}</p>
                  </div>
                  {isCurrent && <Check className="h-5 w-5 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
