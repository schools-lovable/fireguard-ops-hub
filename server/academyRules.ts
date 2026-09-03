/** Deterministic Academy rules keep quiz grading and progress calculations transparent to learners and managers. */
export type AcademyQuestion = { id: number; correctOption: number };

export function gradeQuiz(questions: AcademyQuestion[], answers: Record<number, number>) {
  const correctCount = questions.filter(question => answers[question.id] === question.correctOption).length;
  const questionCount = questions.length;
  const scorePercent = questionCount ? Math.round((correctCount / questionCount) * 100) : 0;
  return { correctCount, questionCount, scorePercent, isPassed: scorePercent >= 80 };
}

export function calculateProgress(completedLessons: number, lessonCount: number) {
  const progressPercent = lessonCount ? Math.round((completedLessons / lessonCount) * 100) : 0;
  return { progressPercent, status: progressPercent === 100 ? "complete" as const : progressPercent > 0 ? "in_progress" as const : "not_started" as const };
}
