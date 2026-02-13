interface QuestionDisplayProps {
  questionText: string;
  imageUrl: string | null;
}

export const QuestionDisplay = ({ questionText, imageUrl }: QuestionDisplayProps) => {
  return (
    <div className="space-y-4">
      <div className="prose max-w-none">
        <p className="text-lg leading-relaxed whitespace-pre-wrap">
          {questionText}
        </p>
      </div>
      
      {imageUrl && (
        <div className="mt-4">
          <img
            src={imageUrl}
            alt="Question diagram"
            className="size-64 object-cover border-border"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
};
