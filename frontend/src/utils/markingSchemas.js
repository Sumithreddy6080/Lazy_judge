// Marking schemas for each event type

export const markingSchemas = {
  'paper-presentation': [
    { questionNumber: 1, parameterName: 'Originality & Innovation', maxScore: 25 },
    { questionNumber: 2, parameterName: 'Technical Depth', maxScore: 25 },
    { questionNumber: 3, parameterName: 'Presentation Quality', maxScore: 20 },
    { questionNumber: 4, parameterName: 'Documentation & Structure', maxScore: 15 },
    { questionNumber: 5, parameterName: 'Q&A Performance', maxScore: 15 }
  ],
  'poster-presentation': [
    { questionNumber: 1, parameterName: 'Creativity & Visual Appeal', maxScore: 20 },
    { questionNumber: 2, parameterName: 'Technical Content', maxScore: 25 },
    { questionNumber: 3, parameterName: 'Concept Clarity', maxScore: 25 },
    { questionNumber: 4, parameterName: 'Relevance to Theme', maxScore: 15 },
    { questionNumber: 5, parameterName: 'Presentation Skills', maxScore: 15 }
  ],
  'startup-expo': [
    { questionNumber: 1, parameterName: 'Creativity & Innovation', maxScore: 20 },
    { questionNumber: 2, parameterName: 'Technical Feasibility', maxScore: 20 },
    { questionNumber: 3, parameterName: 'Problem-Solution Fit', maxScore: 20 },
    { questionNumber: 4, parameterName: 'Prototype/Model Quality', maxScore: 20 },
    { questionNumber: 5, parameterName: 'Pitch Delivery & Communication', maxScore: 20 }
  ]
};

export const getMarkingSchema = (eventType) => {
  return markingSchemas[eventType] || [];
};

export const getTotalMaxScore = (eventType) => {
  const schema = getMarkingSchema(eventType);
  return schema.reduce((sum, param) => sum + param.maxScore, 0);
};
