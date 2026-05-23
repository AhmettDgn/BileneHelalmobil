import { useEffect, useState } from 'react';
import { getQuestionResults, type QuestionResults } from '../gameService';

export function useQuestionResults(
  gameSessionId: string,
  questionId: string | null,
  enabled: boolean
) {
  const [results, setResults] = useState<QuestionResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !questionId) {
      setResults(null);
      return;
    }

    let active = true;
    setLoading(true);
    getQuestionResults(gameSessionId, questionId)
      .then((data) => {
        if (active) setResults(data);
      })
      .catch(() => {
        if (active) setResults(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [gameSessionId, questionId, enabled]);

  return { results, loading };
}
