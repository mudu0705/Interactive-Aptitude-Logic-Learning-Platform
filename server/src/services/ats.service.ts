import { ATSFeedback } from 'shared';

const APTITUDE_TOPICS = [
  'arithmetic', 'algebra', 'probability', 'statistics', 'geometry', 'percentages', 'ratio', 'time and work',
  'syllogisms', 'blood relations', 'coding decoding', 'seating arrangement', 'data sufficiency',
  'verbal ability', 'grammar', 'reading comprehension', 'sentence correction',
  'pie charts', 'bar graphs', 'line graphs', 'data interpretation', 'puzzles', 'programming'
];

const TECHNICAL_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'sql', 'postgresql', 'mongodb',
  'react', 'node', 'express', 'git', 'aws', 'docker', 'data structures', 'algorithms',
  'machine learning', 'html', 'css', 'next.js', 'prisma'
];

export const analyzeResumeText = (
  text: string,
  userCompletedTopicsCount: number = 0,
  userAccuracyRate: number = 0.7
): ATSFeedback => {
  const normalizedText = text.toLowerCase();

  // Find matches
  const matchedAptitude = APTITUDE_TOPICS.filter((topic) =>
    new RegExp(`\\b${topic}\\b`, 'i').test(normalizedText)
  );

  const matchedTech = TECHNICAL_SKILLS.filter((skill) =>
    new RegExp(skill, 'i').test(normalizedText)
  );

  // Score calculation
  // Base score out of 100
  const skillScore = Math.min((matchedTech.length / 10) * 40, 40); // Max 40% from tech skills
  const aptScore = Math.min((matchedAptitude.length / 8) * 30, 30);  // Max 30% from aptitude terms
  
  // Format score based on presence of key resume headers
  const headers = ['education', 'experience', 'project', 'skill', 'certificate', 'summary'];
  const matchedHeaders = headers.filter((h) => normalizedText.includes(h));
  const formattingScore = (matchedHeaders.length / headers.length) * 20; // Max 20%

  // Grammar score (mock scanner using passive voice check & formatting metrics)
  const containsPassive = /\b(was|were|been|is|are)\\b\\s+\\w+ed\\b/gi.test(normalizedText);
  const grammarScore = containsPassive ? 8 : 10; // Max 10%
  
  const rawScore = skillScore + aptScore + formattingScore + grammarScore;
  const score = Math.round(Math.max(30, Math.min(rawScore, 98))); // Keep score between 30 and 98

  // Compute missing skills
  const missingSkills = TECHNICAL_SKILLS
    .filter(skill => !new RegExp(skill, 'i').test(normalizedText))
    .slice(0, 5)
    .map(s => s.replace('\\+', '+'));

  // Grammar errors/issues list
  const grammarIssues: string[] = [];
  if (containsPassive) {
    grammarIssues.push('Found passive voice sentences. Prefer active verbs (e.g., "Led development of..." instead of "Development was led by...")');
  }
  if (!normalizedText.includes('education')) {
    grammarIssues.push('Missing explicit "Education" section header.');
  }
  if (!normalizedText.includes('experience') && !normalizedText.includes('project')) {
    grammarIssues.push('Missing structural section for "Experience" or "Projects".');
  }

  // Formatting suggestions
  const formattingSuggestions: string[] = [];
  if (matchedHeaders.length < 5) {
    formattingSuggestions.push(`Include all standard resume sections: ${headers.filter(h => !matchedHeaders.includes(h)).join(', ')}.`);
  }
  if (text.length < 200) {
    formattingSuggestions.push('Resume text is too brief. Provide more details on key projects, coursework, and technical stack.');
  } else {
    formattingSuggestions.push('Format your resume using standard single-column layout for optimal ATS readability.');
  }

  // Compute placement readiness & company wise predictions
  // Company prediction logic combines resume score with practice platform stats
  const accuracyModifier = userAccuracyRate * 10; // Max 10%
  const practiceModifier = Math.min((userCompletedTopicsCount / 10) * 10, 10); // Max 10%

  const baseReadiness = (score * 0.8) + accuracyModifier + practiceModifier;

  const readyForJobPrediction: Record<string, number> = {
    TCS: Math.round(Math.min(95, baseReadiness * 1.05)),
    Infosys: Math.round(Math.min(95, baseReadiness * 1.02)),
    Accenture: Math.round(Math.min(95, baseReadiness * 0.98)),
    Capgemini: Math.round(Math.min(95, baseReadiness * 0.95)),
    Wipro: Math.round(Math.min(95, baseReadiness * 1.01)),
    Cognizant: Math.round(Math.min(95, baseReadiness * 0.97)),
  };

  return {
    score,
    missingSkills,
    grammarIssues,
    formattingSuggestions,
    readyForJobPrediction,
  };
};
