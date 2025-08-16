import { WebpipeDocument } from '../types/webpipe';

export interface VariableDefinition {
  name: string;
  type: string;
  value: string;
  lineNumber?: number;
  sourceLocation?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface VariableReference {
  name: string;
  stepType: string;
  stepId: string;
  position: { line: number; column: number };
}

/**
 * Extract all variable definitions from a parsed webpipe document
 */
export function extractVariableDefinitions(parsedData: any, sourceText?: string): VariableDefinition[] {
  if (!parsedData?.variables) return [];
  
  const definitions: VariableDefinition[] = [];
  
  for (const variable of parsedData.variables) {
    const definition: VariableDefinition = {
      name: variable.name,
      type: variable.varType || 'unknown',
      value: variable.value || ''
    };
    
    // If we have source text, try to find the line number where this variable is defined
    if (sourceText && variable.name) {
      const lineNumber = findVariableDefinitionLine(sourceText, variable.name, variable.varType);
      if (lineNumber !== -1) {
        definition.lineNumber = lineNumber;
      }
    }
    
    definitions.push(definition);
  }
  
  return definitions;
}

/**
 * Find the line number where a variable is defined in the source text
 */
export function findVariableDefinitionLine(sourceText: string, variableName: string, variableType?: string): number {
  const lines = sourceText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for patterns like: "pg getUserQuery = `SELECT ...`" or "jq myVar = {...}"
    const patterns = [
      new RegExp(`^${variableType || '\\w+'}\\s+${variableName}\\s*=`),
      new RegExp(`^${variableName}\\s*=`), // fallback without type
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(line)) {
        return i + 1; // Convert to 1-based line numbering
      }
    }
  }
  
  return -1;
}

/**
 * Check if a given text contains a variable reference
 */
export function detectVariableReference(text: string, availableVariables: VariableDefinition[]): string | null {
  if (!text || !availableVariables.length) return null;
  
  // Common patterns for variable references in webpipe:
  // - "pg: variableName"
  // - "handlebars: variableName"
  // - Direct references in code
  
  for (const variable of availableVariables) {
    const patterns = [
      new RegExp(`^${variable.type}:\\s*${variable.name}$`),
      new RegExp(`^${variable.name}$`),
      // Also check for references within quoted strings or expressions
      new RegExp(`\\b${variable.name}\\b`)
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(text.trim())) {
        return variable.name;
      }
    }
  }
  
  return null;
}

/**
 * Get variable definition by name
 */
export function getVariableDefinition(variableName: string, definitions: VariableDefinition[]): VariableDefinition | null {
  return definitions.find(def => def.name === variableName) || null;
}

/**
 * Extract variable references from pipeline steps
 */
export function extractVariableReferences(parsedData: any): VariableReference[] {
  const references: VariableReference[] = [];
  
  if (!parsedData?.routes) return references;
  
  for (const route of parsedData.routes) {
    if (route.pipeline?.pipeline?.steps) {
      extractReferencesFromSteps(route.pipeline.pipeline.steps, references);
    }
  }
  
  return references;
}

function extractReferencesFromSteps(steps: any[], references: VariableReference[], stepIdPrefix = ''): void {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepId = `${stepIdPrefix}step-${i}`;
    
    if (step.kind === 'Regular' && step.config) {
      // Check if the config looks like a variable reference
      const trimmedConfig = step.config.trim();
      
      // Pattern for references like "getUserQuery" (just the variable name)
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedConfig)) {
        references.push({
          name: trimmedConfig,
          stepType: step.name,
          stepId: stepId,
          position: { line: 0, column: 0 } // This would need more sophisticated parsing
        });
      }
    }
    
    // Handle result blocks with branches
    if (step.kind === 'Result' && step.branches) {
      for (let j = 0; j < step.branches.length; j++) {
        const branch = step.branches[j];
        if (branch.pipeline?.steps) {
          extractReferencesFromSteps(
            branch.pipeline.steps, 
            references, 
            `${stepId}-branch-${j}-`
          );
        }
      }
    }
  }
}

/**
 * Check if a word at a given position in Monaco editor is a variable reference
 */
export function getVariableAtPosition(
  model: any, 
  position: { lineNumber: number; column: number },
  availableVariables: VariableDefinition[]
): { variableName: string; range: any } | null {
  if (!model || !position) return null;
  
  const line = model.getLineContent(position.lineNumber);
  const wordInfo = model.getWordAtPosition(position);
  
  if (!wordInfo) return null;
  
  const word = wordInfo.word;
  
  // Check if this word is a known variable
  const variableDefinition = availableVariables.find(def => def.name === word);
  
  if (variableDefinition) {
    return {
      variableName: word,
      range: {
        startLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: wordInfo.endColumn
      }
    };
  }
  
  return null;
}