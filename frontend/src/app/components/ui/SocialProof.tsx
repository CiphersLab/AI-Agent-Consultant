import { useSocialProof } from '@/app/hooks/useSocialProof';
import { Card } from './Card';

export function SocialProof() {
  const { socialProof, isLoading } = useSocialProof();

  if (isLoading || !socialProof) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 text-center">
      <div className="mb-3">
        <svg
          className="w-8 h-8 mx-auto text-white/80"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>
      <p className="text-lg font-medium mb-2 italic">"{socialProof.testimonial}"</p>
      <p className="text-sm text-white/70">✨ {socialProof.metric}</p>
    </Card>
  );
}