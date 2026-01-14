import { useNavigate } from 'react-router';
import AppLayout from '@/components/layouts/app-layout';
import { FileText, BookOpen } from 'lucide-react';

const JAMBModeSelection = () => {
  const navigate = useNavigate();

  const handleSelectMode = (mode: 'past_question' | 'practice') => {
    if (mode === 'past_question') {
      navigate('/jamb/past-questions');
    } else {
      navigate('/jamb/practice-questions');
    }
  };

  return (
    <AppLayout>
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full max-w-2xl px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Select Question Mode</h1>
            <p className="text-muted-foreground">
              Choose how you want to practice JAMB questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Past Questions Card */}
            <div
              onClick={() => handleSelectMode('past_question')}
              className="border rounded-lg bg-card p-8 flex flex-col items-center justify-center hover:shadow-lg transition-all cursor-pointer group hover:border-primary"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                Past Questions
              </h2>
              <p className="text-muted-foreground text-center">
                Practice with previous JAMB exam questions
              </p>
            </div>

            {/* Practice Questions Card */}
            <div
              onClick={() => handleSelectMode('practice')}
              className="border rounded-lg bg-card p-8 flex flex-col items-center justify-center hover:shadow-lg transition-all cursor-pointer group hover:border-primary"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                Practice Questions
              </h2>
              <p className="text-muted-foreground text-center">
                Practice with random questions (max 4 sessions per subject)
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default JAMBModeSelection;
