// Helper function to format suggestions as a well-aligned table
export function generateSuggestionsList(suggestions: any[]): string {

  if(suggestions.length==1){
    return `${suggestions[0]}`;
  }

  // Loop through suggestions and append each class and confidence as a list item
  return '\n'+suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n');
}