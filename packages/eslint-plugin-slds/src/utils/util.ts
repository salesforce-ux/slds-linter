export default function replacePlaceholders(template: string, args: { [key: string]: string }): string {
    return template
        .replace(/\${(.*?)}/g, (_, key) => args[key.trim()] || '')
        .replace(/\{\{(.*?)\}\}/g, (_, key) => args[key.trim()] || '');
}

export function addOnlyUnique(arrayA: string[] = [], arrayB: string[] = []): string[] {
    if(!arrayA.length){
        return arrayB;
    }
    return arrayA.concat(arrayB.filter(v => !arrayA.includes(v)));
} 