import { Progress } from './Progress';
import { cn, getProgressLabel, getProgressColor } from '@/app/lib/utils';
import { Check, Clock } from 'lucide-react';

interface ProgressTrackerProps {
  percentage: number;
  currentStage?: string;
}

export function ProgressTracker({ percentage, currentStage }: ProgressTrackerProps) {
  const stages = [
    { name: 'Requirements', threshold: 25 },
    { name: 'Architecture', threshold: 50 },
    { name: 'UX Design', threshold: 75 },
    { name: 'Business Strategy', threshold: 100 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className={cn('text-2xl font-semibold', getProgressColor(percentage))}>
            {getProgressLabel(percentage)}
          </h3>
          <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
        </div>
        <Progress value={percentage} max={100} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stages.map((stage, index) => {
          const isComplete = percentage >= stage.threshold;
          const isCurrent = percentage >= (stages[index - 1]?.threshold || 0) && percentage < stage.threshold;

          return (
            <div
              key={stage.name}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                isComplete && 'border-green-500 bg-green-50',
                isCurrent && 'border-blue-500 bg-blue-50 animate-pulse',
                !isComplete && !isCurrent && 'border-gray-200 bg-gray-50'
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                  isComplete && 'bg-green-500',
                  isCurrent && 'bg-blue-500',
                  !isComplete && !isCurrent && 'bg-gray-300'
                )}
              >
                {isComplete ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Clock className={cn('w-5 h-5', isCurrent ? 'text-white' : 'text-gray-500')} />
                )}
              </div>
              <div className="min-w-0">
                <p className={cn('text-sm font-medium truncate', isComplete && 'text-green-700', isCurrent && 'text-blue-700')}>
                  {stage.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}