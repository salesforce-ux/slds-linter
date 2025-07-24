/* Usage: 
// Example usage
const templateString = "Hello, my name is ${name}. I am ${age} years old and I live in ${city}.";
// Or "Hello, my name is {{name}}. I am {{age}} years old and I live in {{city}}."
const args = {
    name: "John",
    age: "30",
    city: "New York"
};

const result = replacePlaceholders(templateString, args);
*/
export function replacePlaceholders(template: string, args: { [key: string]: string }): string {
    // Handle both ${key} and {{key}} formats
    return template
        .replace(/\${(.*?)}/g, (_, key) => args[key.trim()] || '')
        .replace(/\{\{(.*?)\}\}/g, (_, key) => args[key.trim()] || '');
}

// Use only for small arrays
export function addOnlyUnique(arrayA: string[] = [], arrayB: string[] = []): string[] {
    if(!arrayA.length){
        return arrayB;
    }
    return arrayA.concat(arrayB.filter(v => !arrayA.includes(v)));
} 