export function transformObjectToInnerString(obj: Record<string, unknown>, indent: string = ''): string {
  const entries = Object.entries(obj);
  
  return entries.map(([key, value]) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const nested = transformObjectToInnerString(value as Record<string, unknown>, indent + '  ');
      return `${indent}${key}: {\n${nested}\n${indent}}`;
    }
    
    if (Array.isArray(value)) {
      const arrayItems = value.map(item => 
        typeof item === 'string' ? `'${item}'` : String(item)
      ).join(', ');
      return `${indent}${key}: [${arrayItems}]`;
    }
    
    const formatted = typeof value === 'string' ? `'${value}'` : String(value);
    return `${indent}${key}: ${formatted}`;
  }).join(',\n');
}