interface QuestionDisplayProps {
  questionText: string;
  imageUrl: string | null;
}

export const QuestionDisplay = ({ questionText, imageUrl }: QuestionDisplayProps) => {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="prose max-w-none">
        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
          {questionText}
        </p>
      </div>

      {imageUrl && (
        <div className="mt-2 sm:mt-4">
          <img
            src={imageUrl}
            alt="Question diagram"
            className="max-w-full h-auto max-h-48 sm:max-h-64 object-contain border border-border rounded-md"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
};
