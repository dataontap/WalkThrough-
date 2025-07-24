import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface MoodRating {
  difficulty: 'very-easy' | 'easy' | 'medium' | 'hard' | 'very-hard';
  satisfaction: 'very-unhappy' | 'unhappy' | 'neutral' | 'happy' | 'very-happy';
}

interface MoodTrackerProps {
  onRatingSubmit?: (rating: MoodRating) => void;
  currentRating?: MoodRating;
  disabled?: boolean;
}

const difficultyEmojis = {
  'very-easy': { emoji: '😊', label: 'Very Easy', color: 'bg-green-100 text-green-700' },
  'easy': { emoji: '🙂', label: 'Easy', color: 'bg-green-50 text-green-600' },
  'medium': { emoji: '😐', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  'hard': { emoji: '😟', label: 'Hard', color: 'bg-orange-100 text-orange-700' },
  'very-hard': { emoji: '😵', label: 'Very Hard', color: 'bg-red-100 text-red-700' }
};

const satisfactionEmojis = {
  'very-unhappy': { emoji: '😡', label: 'Very Unhappy', color: 'bg-red-100 text-red-700' },
  'unhappy': { emoji: '😞', label: 'Unhappy', color: 'bg-orange-100 text-orange-700' },
  'neutral': { emoji: '😐', label: 'Neutral', color: 'bg-gray-100 text-gray-700' },
  'happy': { emoji: '😊', label: 'Happy', color: 'bg-green-50 text-green-600' },
  'very-happy': { emoji: '🤩', label: 'Very Happy', color: 'bg-green-100 text-green-700' }
};

export function MoodTracker({ onRatingSubmit, currentRating, disabled = false }: MoodTrackerProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<MoodRating['difficulty'] | null>(currentRating?.difficulty || null);
  const [selectedSatisfaction, setSelectedSatisfaction] = useState<MoodRating['satisfaction'] | null>(currentRating?.satisfaction || null);

  const handleSubmit = () => {
    if (selectedDifficulty && selectedSatisfaction && onRatingSubmit) {
      onRatingSubmit({
        difficulty: selectedDifficulty,
        satisfaction: selectedSatisfaction
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">How was this walkthrough?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Difficulty Rating */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-neutral-600">Difficulty Level</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(difficultyEmojis).map(([key, { emoji, label, color }]) => (
              <Button
                key={key}
                variant={selectedDifficulty === key ? "default" : "outline"}
                size="sm"
                onClick={() => !disabled && setSelectedDifficulty(key as MoodRating['difficulty'])}
                disabled={disabled}
                className={`h-auto p-3 flex flex-col items-center gap-1 ${
                  selectedDifficulty === key ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Satisfaction Rating */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-neutral-600">Overall Satisfaction</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(satisfactionEmojis).map(([key, { emoji, label, color }]) => (
              <Button
                key={key}
                variant={selectedSatisfaction === key ? "default" : "outline"}
                size="sm"
                onClick={() => !disabled && setSelectedSatisfaction(key as MoodRating['satisfaction'])}
                disabled={disabled}
                className={`h-auto p-3 flex flex-col items-center gap-1 ${
                  selectedSatisfaction === key ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        {onRatingSubmit && !disabled && (
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedDifficulty || !selectedSatisfaction}
            className="w-full"
          >
            Submit Rating
          </Button>
        )}

        {/* Current Rating Display */}
        {currentRating && disabled && (
          <div className="flex gap-4 pt-2 border-t">
            <Badge className={difficultyEmojis[currentRating.difficulty].color}>
              {difficultyEmojis[currentRating.difficulty].emoji} {difficultyEmojis[currentRating.difficulty].label}
            </Badge>
            <Badge className={satisfactionEmojis[currentRating.satisfaction].color}>
              {satisfactionEmojis[currentRating.satisfaction].emoji} {satisfactionEmojis[currentRating.satisfaction].label}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MoodBadges({ difficulty, satisfaction }: MoodRating) {
  return (
    <div className="flex gap-2">
      <Badge variant="secondary" className="text-xs">
        {difficultyEmojis[difficulty].emoji} {difficultyEmojis[difficulty].label}
      </Badge>
      <Badge variant="secondary" className="text-xs">
        {satisfactionEmojis[satisfaction].emoji} {satisfactionEmojis[satisfaction].label}
      </Badge>
    </div>
  );
}