import { MockInterviewFeedback, Question } from 'shared';

const callGemini = async (prompt: string, fallbackResponse: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackResponse;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}. Using fallback.`);
      return fallbackResponse;
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return generatedText || fallbackResponse;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return fallbackResponse;
  }
};

export const explainConcept = async (topicName: string, query: string): Promise<string> => {
  const prompt = `You are an expert AI Tutor for a Computer Science college student. Explain the concept of "${topicName}" and answer this student's query: "${query}". Provide a clear, step-by-step explanation, formulas if applicable, and a short trick to remember it. Keep it structured and formatting in Markdown.`;
  
  const fallback = `### AI Tutor Explanation for ${topicName}

Here is a step-by-step breakdown to solve queries on **${topicName}**:

1. **Core Concept**: Focus on identifying the independent variables. For example, in quantitative problems, define the rate of work or speed relative to total constants.
2. **Formula Checklist**:
   - Primary: $\\text{Work} = \\text{Rate} \\times \\text{Time}$
   - Relative Speed: $\\text{Speed}_{\\text{relative}} = S_1 + S_2$ (moving opposite) or $S_1 - S_2$ (moving same direction)
3. **Shortcut Trick**: Try representing values as ratios. If speed increases by $25\\%$, time taken drops by $20\\%$.
4. **Resolution to your query "${query}"**:
   - Break the problem into unit values.
   - Sum the individual fractions per hour.
   - Invert the sum to get the total duration required.
   
*Practice similar medium-level questions in the Practice section to build speed and accuracy!*`;

  return callGemini(prompt, fallback);
};

export const generateInterviewFeedback = async (
  company: string,
  history: { sender: 'AI' | 'USER'; text: string }[]
): Promise<MockInterviewFeedback> => {
  const transcript = history.map((h) => `${h.sender}: ${h.text}`).join('\n');
  const prompt = `You are an AI Interviewer. Analyze the following mock interview transcript for the target company ${company}:
  ${transcript}
  
  Evaluate the user's communication, confidence, grammar, and technical competency.
  Return a raw JSON object matching this TypeScript interface exactly:
  interface MockInterviewFeedback {
    communicationScore: number; // 0 to 100
    confidenceScore: number; // 0 to 100
    grammarScore: number; // 0 to 100
    technicalScore: number; // 0 to 100
    overallScore: number; // 0 to 100
    constructiveFeedback: string[];
  }
  Do not wrap the JSON in markdown code blocks.`;

  const fallbackJSON = JSON.stringify({
    communicationScore: 78,
    confidenceScore: 82,
    grammarScore: 80,
    technicalScore: 75,
    overallScore: 79,
    constructiveFeedback: [
      `Demonstrated good structural communication, but could explain data structure choices with more depth for ${company}.`,
      'Structure code explanations using the STAR method (Situation, Task, Action, Result).',
      'Watch for minor grammatical hesitations (e.g., repeating "like" and "basically").',
      'Excellent confidence level during problem solving.'
    ]
  });

  const responseText = await callGemini(prompt, fallbackJSON);
  try {
    // Strip markdown code fences if Gemini returned them
    const cleanedText = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText) as MockInterviewFeedback;
  } catch (error) {
    return JSON.parse(fallbackJSON) as MockInterviewFeedback;
  }
};

export const generateAIQuestion = async (
  topicName: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
): Promise<Partial<Question>> => {
  const prompt = `Generate a unique, high-quality multiple choice question on the topic "${topicName}" with difficulty level "${difficulty}".
  Return a raw JSON object matching this structure:
  {
    "text": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The exact correct option matching one of the options list",
    "explanation": "Detailed explanation of the solution"
  }
  Do not wrap the JSON in markdown code blocks.`;

  const fallbackMap: Record<string, any> = {
    'EASY': {
      text: `A pipe can fill a tank in 12 hours. Another pipe can empty it in 24 hours. If both pipes are opened, how long will it take to fill the tank?`,
      options: ['16 hours', '18 hours', '20 hours', '24 hours'],
      correctAnswer: '24 hours',
      explanation: `Net filling rate per hour = 1/12 - 1/24 = 1/24. Therefore, it will take 24 hours to fill the tank.`
    },
    'MEDIUM': {
      text: `A train moves past a telegraph post in 6 seconds and a 120m long bridge in 15 seconds. What is the speed of the train in km/h?`,
      options: ['48 km/h', '52 km/h', '60 km/h', '64 km/h'],
      correctAnswer: '48 km/h',
      explanation: `Let length of train be L. Speed S = L/6 = (L+120)/15.
      15L = 6L + 720 => 9L = 720 => L = 80m.
      S = 80/6 m/s = (80/6) * (18/5) = 48 km/h.`
    },
    'HARD': {
      text: `In how many different ways can the letters of the word 'CORPORATION' be arranged so that the vowels always come together?`,
      options: ['48,000', '50,400', '52,200', '57,600'],
      correctAnswer: '50,400',
      explanation: `Vowels are O, O, A, I, O. Consonants are C, R, P, R, T, N.
      Group vowels as 1 unit: (OOAIO) + 6 consonants = 7 units.
      Arrange 7 units (with R repeated twice): 7!/2! = 2520.
      Arrange vowels within unit (with O repeated 3 times): 5!/3! = 20.
      Total arrangements = 2520 * 20 = 50,400.`
    },
    'EXPERT': {
      text: `What is the time complexity to search for an element in a binary search tree in the worst case?`,
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctAnswer: 'O(n)',
      explanation: `In the worst case (skewed binary search tree), searching takes O(n) operations where n is the number of nodes.`
    }
  };

  const fallbackJSON = JSON.stringify(fallbackMap[difficulty] || fallbackMap['EASY']);

  const responseText = await callGemini(prompt, fallbackJSON);
  try {
    const cleanedText = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    return JSON.parse(fallbackJSON);
  }
};

export const assignQuestionMetadata = async (
  questionText: string,
  options: string[]
): Promise<{ category: string; topic: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'; explanation: string }> => {
  const prompt = `Given the following multiple-choice question:
  Question: "${questionText}"
  Options: ${JSON.stringify(options)}
  
  Determine the category ("Quantitative Aptitude", "Logical Reasoning", "Verbal Ability", "Programming MCQs"), the specific topic name (e.g. "Time and Work", "Syllogisms", "C", "Python"), the difficulty ("EASY", "MEDIUM", "HARD", "EXPERT"), and write a detailed step-by-step logic explanation.
  Return a raw JSON object matching this structure:
  {
    "category": "Quantitative Aptitude",
    "topic": "Time and Work",
    "difficulty": "EASY",
    "explanation": "Detailed step-by-step solution"
  }
  Do not wrap the JSON in markdown code blocks.`;

  const fallback = JSON.stringify({
    category: "Programming MCQs",
    topic: "C",
    difficulty: "EASY",
    explanation: "This question tests core programming logic. Please refer to standard syntax guides."
  });

  const responseText = await callGemini(prompt, fallback);
  try {
    const cleanedText = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    return JSON.parse(fallback);
  }
};

export const generateNextInterviewQuestion = async (
  company: string,
  history: { sender: 'AI' | 'USER'; text: string }[]
): Promise<string> => {
  const transcript = history.map((h) => `${h.sender}: ${h.text}`).join('\n');
  const prompt = `You are a professional technical interviewer conducting an interview for the company ${company}.
Here is the transcript of the interview so far:
${transcript}

Ask the candidate the next logical question. It could be a follow-up on their project, a DSA question, or a logic puzzle.
Respond with ONLY the next interview question. Do not include any introductory phrases, markdown formatting, or extra conversational filler. Just the raw question.`;

  const fallbackQuestions = [
    'That sounds interesting. Can you tell me about the database structure you chose for your main project and why?',
    'How would you design a system to handle high concurrency in a login flow?',
    'Can you explain the difference between processes and threads in an operating system?',
    'Thank you. We have completed the technical portion. Feel free to conclude when you are ready to receive your report.'
  ];
  const currentTurn = history.filter(h => h.sender === 'USER').length;
  const fallback = fallbackQuestions[currentTurn - 1] || fallbackQuestions[fallbackQuestions.length - 1];

  return callGemini(prompt, fallback);
};

