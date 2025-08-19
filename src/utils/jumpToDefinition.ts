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

export interface PipelineDefinition {
  name: string;
  steps: any[];
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
 * Extract all pipeline definitions from a parsed webpipe document
 */
export function extractPipelineDefinitions(parsedData: any, sourceText?: string): PipelineDefinition[] {
  if (!parsedData?.pipelines) return [];
  
  const definitions: PipelineDefinition[] = [];
  
  for (const pipeline of parsedData.pipelines) {
    // Check for steps in both possible locations: pipeline.steps or pipeline.pipeline.steps
    const stepsArray = pipeline.steps || pipeline.pipeline?.steps || [];
    const definition: PipelineDefinition = {
      name: pipeline.name,
      steps: stepsArray
    };
    
    // If we have source text, try to find the line number where this pipeline is defined
    if (sourceText && pipeline.name) {
      const lineNumber = findPipelineDefinitionLine(sourceText, pipeline.name);
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
 * Find the line number where a pipeline is defined in the source text
 */
export function findPipelineDefinitionLine(sourceText: string, pipelineName: string): number {
  const lines = sourceText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for patterns like: "pipeline pipelineName ="
    const patterns = [
      new RegExp(`^pipeline\\s+${pipelineName}\\s*=`),
      new RegExp(`^pipeline\\s+${pipelineName}\\s*\\{`), // legacy format with braces
      new RegExp(`^${pipelineName}:\\s*pipeline`), // alternative syntax
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
 * Check if a given text contains a handlebars partial reference
 */
export function detectPartialReference(text: string, availablePartials: VariableDefinition[]): string | null {
  if (!text || !availablePartials.length) return null;
  
  // Look for handlebars partial patterns like {{>partialName}} or {{> partialName}}
  const partialMatch = text.match(/\{\{\s*>\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/);
  if (partialMatch) {
    const partialName = partialMatch[1];
    // Check if this partial exists in our available partials (handlebars variables)
    const partial = availablePartials.find(def => def.name === partialName && def.type === 'handlebars');
    if (partial) {
      return partialName;
    }
  }
  
  return null;
}

/**
 * Check if a given text contains a pipeline reference
 */
export function detectPipelineReference(text: string, availablePipelines: PipelineDefinition[]): string | null {
  if (!text || !availablePipelines.length) return null;
  
  // Common patterns for pipeline references in webpipe:
  // - "pipeline: pipelineName"
  // - Direct references in code
  
  for (const pipeline of availablePipelines) {
    const patterns = [
      new RegExp(`^pipeline:\\s*${pipeline.name}$`),
      new RegExp(`^${pipeline.name}$`),
      // Also check for references within quoted strings or expressions
      new RegExp(`\\b${pipeline.name}\\b`)
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(text.trim())) {
        return pipeline.name;
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
 * Get pipeline definition by name
 */
export function getPipelineDefinition(pipelineName: string, definitions: PipelineDefinition[]): PipelineDefinition | null {
  return definitions.find(def => def.name === pipelineName) || null;
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

// Global state for variable and pipeline definitions
let globalVariableDefinitions: VariableDefinition[] = [];
let globalPipelineDefinitions: PipelineDefinition[] = [];
let hoverProviderRegistered = false;
let hoverStylesInjected = false;

/**
 * Update global variable definitions
 */
export function updateGlobalVariableDefinitions(variableDefinitions: VariableDefinition[]) {
  globalVariableDefinitions = variableDefinitions;
}

/**
 * Update global pipeline definitions
 */
export function updateGlobalPipelineDefinitions(pipelineDefinitions: PipelineDefinition[]) {
  globalPipelineDefinitions = pipelineDefinitions;
}

/**
 * Register hover provider once globally
 */
export function registerHoverProvider(monaco: any) {
  if (hoverProviderRegistered) return;
  
  // Add CSS to ensure hover widgets appear above flow nodes
  if (typeof document !== 'undefined' && !hoverStylesInjected) {
    const style = document.createElement('style');
    style.textContent = `
      .monaco-hover {
        z-index: 10000 !important;
      }
      .monaco-hover-content {
        z-index: 10000 !important;
      }
      .monaco-editor .suggest-widget {
        z-index: 10000 !important;
      }
    `;
    document.head.appendChild(style);
    hoverStylesInjected = true;
  }
  
  monaco.languages.registerHoverProvider('*', {
    provideHover: (model: any, position: any) => {
      // Check for handlebars partial references first
      const partialInfo = getPartialAtPosition(model, position, globalVariableDefinitions);
      if (partialInfo) {
        const definition = globalVariableDefinitions.find(def => def.name === partialInfo.partialName && def.type === 'handlebars');
        if (definition) {
          return {
            range: new monaco.Range(
              partialInfo.range.startLineNumber,
              partialInfo.range.startColumn,
              partialInfo.range.endLineNumber,
              partialInfo.range.endColumn
            ),
            contents: [
              { value: `**${definition.name}** (handlebars partial)` },
              { value: `\`\`\`handlebars\n${definition.value}\n\`\`\`` }
            ]
          };
        }
      }
      
      // Check for variable references
      const variableInfo = getVariableAtPosition(model, position, globalVariableDefinitions);
      if (variableInfo) {
        const definition = globalVariableDefinitions.find(def => def.name === variableInfo.variableName);
        if (definition) {
          return {
            range: new monaco.Range(
              variableInfo.range.startLineNumber,
              variableInfo.range.startColumn,
              variableInfo.range.endLineNumber,
              variableInfo.range.endColumn
            ),
            contents: [
              { value: `**${definition.name}** (${definition.type})` },
              { value: `\`\`\`${definition.type}\n${definition.value}\n\`\`\`` }
            ]
          };
        }
      }
      
      // Check for pipeline references
      const pipelineInfo = getPipelineAtPosition(model, position, globalPipelineDefinitions);
      if (pipelineInfo) {
        const definition = globalPipelineDefinitions.find(def => def.name === pipelineInfo.pipelineName);
        if (definition) {
          const stepsPreview = definition.steps.length > 0 
            ? `${definition.steps.length} step${definition.steps.length > 1 ? 's' : ''}`
            : 'No steps';
          return {
            range: new monaco.Range(
              pipelineInfo.range.startLineNumber,
              pipelineInfo.range.startColumn,
              pipelineInfo.range.endLineNumber,
              pipelineInfo.range.endColumn
            ),
            contents: [
              { value: `**${definition.name}** (pipeline)` },
              { value: `Pipeline with ${stepsPreview}` }
            ]
          };
        }
      }
      
      return null;
    }
  });
  
  hoverProviderRegistered = true;
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

/**
 * Check if a position in Monaco editor is over a handlebars partial reference
 */
export function getPartialAtPosition(
  model: any, 
  position: { lineNumber: number; column: number },
  availablePartials: VariableDefinition[]
): { partialName: string; range: any } | null {
  if (!model || !position) return null;
  
  const line = model.getLineContent(position.lineNumber);
  
  // Look for handlebars partial patterns like {{>partialName}} or {{> partialName}}
  const partialRegex = /\{\{\s*>\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  let match;
  
  while ((match = partialRegex.exec(line)) !== null) {
    const partialName = match[1];
    const startColumn = match.index + 1; // Monaco uses 1-based column numbering
    const endColumn = startColumn + match[0].length;
    
    // Check if the cursor position is within this partial reference
    if (position.column >= startColumn && position.column <= endColumn) {
      // Check if this partial exists in our available partials (handlebars variables)
      const partial = availablePartials.find(def => def.name === partialName && def.type === 'handlebars');
      if (partial) {
        return {
          partialName,
          range: {
            startLineNumber: position.lineNumber,
            startColumn: startColumn,
            endLineNumber: position.lineNumber,
            endColumn: endColumn
          }
        };
      }
    }
  }
  
  return null;
}

/**
 * Check if a word at a given position in Monaco editor is a pipeline reference
 */
export function getPipelineAtPosition(
  model: any, 
  position: { lineNumber: number; column: number },
  availablePipelines: PipelineDefinition[]
): { pipelineName: string; range: any } | null {
  if (!model || !position) return null;
  
  const line = model.getLineContent(position.lineNumber);
  const wordInfo = model.getWordAtPosition(position);
  
  if (!wordInfo) return null;
  
  const word = wordInfo.word;
  
  // Check if this word is a known pipeline
  const pipelineDefinition = availablePipelines.find(def => def.name === word);
  
  if (pipelineDefinition) {
    return {
      pipelineName: word,
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