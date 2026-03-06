import { ABOUT_LABELS } from './constants/labels'
export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">{ABOUT_LABELS.LABEL_2857}</h1>
      <p className="text-muted-foreground max-w-lg text-center">
        {ABOUT_LABELS.PROCESSING_6562}
      </p>
    </div>
  );
}
