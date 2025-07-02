// Monday.com-style Formula Engine
// Supports all major formula functions with real-time calculation

export interface FormulaContext {
  item: any;
  subitems: any[];
  columns: { [key: string]: any };
  boardData: any;
}

export class FormulaEngine {
  private static instance: FormulaEngine;
  
  static getInstance(): FormulaEngine {
    if (!FormulaEngine.instance) {
      FormulaEngine.instance = new FormulaEngine();
    }
    return FormulaEngine.instance;
  }

  // Main formula evaluation function
  evaluateFormula(formula: string, context: FormulaContext): any {
    try {
      // Return early if formula is empty or invalid
      if (!formula || typeof formula !== 'string' || formula.trim() === '') {
        return '';
      }

      // Clean and prepare formula
      const cleanFormula = this.preprocessFormula(formula);
      
      // Return early if still empty after cleaning
      if (!cleanFormula) {
        return '';
      }
      
      // Replace function calls with actual calculations
      const processedFormula = this.replaceFunctions(cleanFormula, context);
      
      // Evaluate the final expression
      return this.safeEvaluate(processedFormula);
    } catch (error) {
      // Only log actual errors, not empty formulas
      if (formula && formula.trim() !== '') {
        console.error('Formula evaluation error:', error);
      }
      return '#ERROR';
    }
  }

  // Alias for compatibility
  calculate(formula: string, context: FormulaContext): any {
    return this.evaluateFormula(formula, context);
  }

  private preprocessFormula(formula: string): string {
    // Remove whitespace and normalize
    return formula.trim().replace(/\s+/g, ' ');
  }

  private replaceFunctions(formula: string, context: FormulaContext): string {
    let result = formula;

    // Mathematical functions
    result = this.replaceFunction(result, 'SUM', (args) => this.sumFunction(args, context));
    result = this.replaceFunction(result, 'AVERAGE', (args) => this.averageFunction(args, context));
    result = this.replaceFunction(result, 'MIN', (args) => this.minFunction(args, context));
    result = this.replaceFunction(result, 'MAX', (args) => this.maxFunction(args, context));
    result = this.replaceFunction(result, 'COUNT', (args) => this.countFunction(args, context));
    result = this.replaceFunction(result, 'ROUND', (args) => this.roundFunction(args, context));

    // Text functions
    result = this.replaceFunction(result, 'CONCATENATE', (args) => this.concatenateFunction(args, context));
    result = this.replaceFunction(result, 'TEXT', (args) => this.textFunction(args, context));
    result = this.replaceFunction(result, 'SUBSTITUTE', (args) => this.substituteFunction(args, context));
    result = this.replaceFunction(result, 'LEN', (args) => this.lenFunction(args, context));

    // Logical functions
    result = this.replaceFunction(result, 'IF', (args) => this.ifFunction(args, context));
    result = this.replaceFunction(result, 'AND', (args) => this.andFunction(args, context));
    result = this.replaceFunction(result, 'OR', (args) => this.orFunction(args, context));
    result = this.replaceFunction(result, 'NOT', (args) => this.notFunction(args, context));

    // Date functions
    result = this.replaceFunction(result, 'TODAY', (args) => this.todayFunction(args, context));
    result = this.replaceFunction(result, 'WORKDAYS', (args) => this.workdaysFunction(args, context));
    result = this.replaceFunction(result, 'DAYS', (args) => this.daysFunction(args, context));

    // Status and Progress functions
    result = this.replaceFunction(result, 'PROGRESS', (args) => this.progressFunction(args, context));
    result = this.replaceFunction(result, 'STATUS_COUNT', (args) => this.statusCountFunction(args, context));

    // Column references {Column Name}
    result = this.replaceColumnReferences(result, context);

    return result;
  }

  private replaceFunction(formula: string, functionName: string, calculator: (args: string[]) => any): string {
    const regex = new RegExp(`${functionName}\\(([^)]*)\\)`, 'gi');
    return formula.replace(regex, (match, argsString) => {
      const args = this.parseArguments(argsString);
      const result = calculator(args);
      return String(result);
    });
  }

  private parseArguments(argsString: string): string[] {
    if (!argsString.trim()) return [];
    
    const args: string[] = [];
    let current = '';
    let depth = 0;
    let inQuotes = false;
    
    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];
      
      if (char === '"' && (i === 0 || argsString[i-1] !== '\\')) {
        inQuotes = !inQuotes;
        current += char;
      } else if (!inQuotes) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ',' && depth === 0) {
          args.push(current.trim());
          current = '';
          continue;
        }
        current += char;
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      args.push(current.trim());
    }
    
    return args;
  }

  private replaceColumnReferences(formula: string, context: FormulaContext): string {
    // Replace {Column Name} with actual values
    return formula.replace(/\{([^}]+)\}/g, (match, columnName) => {
      const value = this.getColumnValue(columnName.trim(), context);
      return String(value || 0);
    });
  }

  private getColumnValue(columnName: string, context: FormulaContext): any {
    const lowerName = columnName.toLowerCase();
    
    // Handle subitems.property references
    if (lowerName.startsWith('subitems.')) {
      const propertyName = lowerName.replace('subitems.', '');
      const subitemValues = (context.subitems || [])
        .map(subitem => subitem && subitem[propertyName] ? subitem[propertyName] : 0)
        .filter(val => val !== undefined && val !== null && val !== '');
      return subitemValues;
    }
    
    // Check item properties first
    if (context.item && context.item[lowerName] !== undefined) {
      return context.item[lowerName];
    }
    
    // Check subitems for aggregated values
    const subitemValues = (context.subitems || [])
      .map(subitem => subitem && subitem[lowerName] ? subitem[lowerName] : 0)
      .filter(val => val !== undefined && val !== null && val !== '');
    
    if (subitemValues.length > 0) {
      // For numeric values, return sum; for text, return first non-empty
      const numericValues = subitemValues.filter(val => !isNaN(Number(val)));
      if (numericValues.length > 0) {
        return numericValues.reduce((sum, val) => sum + Number(val), 0);
      }
      return subitemValues[0];
    }
    
    return 0;
  }

  // Mathematical Functions
  private sumFunction(args: string[], context: FormulaContext): number {
    const values = args.map(arg => this.evaluateArgument(arg, context))
                      .filter(val => !isNaN(Number(val)))
                      .map(val => Number(val));
    return values.reduce((sum, val) => sum + val, 0);
  }

  private averageFunction(args: string[], context: FormulaContext): number {
    const values = args.map(arg => this.evaluateArgument(arg, context))
                      .filter(val => !isNaN(Number(val)))
                      .map(val => Number(val));
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private minFunction(args: string[], context: FormulaContext): number {
    const values = args.map(arg => this.evaluateArgument(arg, context))
                      .filter(val => !isNaN(Number(val)))
                      .map(val => Number(val));
    return values.length > 0 ? Math.min(...values) : 0;
  }

  private maxFunction(args: string[], context: FormulaContext): number {
    const values = args.map(arg => this.evaluateArgument(arg, context))
                      .filter(val => !isNaN(Number(val)))
                      .map(val => Number(val));
    return values.length > 0 ? Math.max(...values) : 0;
  }

  private countFunction(args: string[], context: FormulaContext): number {
    return args.map(arg => this.evaluateArgument(arg, context))
              .filter(val => val !== null && val !== undefined && val !== '').length;
  }

  private roundFunction(args: string[], context: FormulaContext): number {
    const value = Number(this.evaluateArgument(args[0], context));
    const decimals = args[1] ? Number(this.evaluateArgument(args[1], context)) : 0;
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  // Text Functions
  private concatenateFunction(args: string[], context: FormulaContext): string {
    return args.map(arg => String(this.evaluateArgument(arg, context))).join('');
  }

  private textFunction(args: string[], context: FormulaContext): string {
    return String(this.evaluateArgument(args[0], context));
  }

  private substituteFunction(args: string[], context: FormulaContext): string {
    const text = String(this.evaluateArgument(args[0], context));
    const oldText = String(this.evaluateArgument(args[1], context));
    const newText = String(this.evaluateArgument(args[2], context));
    return text.replace(new RegExp(oldText, 'g'), newText);
  }

  private lenFunction(args: string[], context: FormulaContext): number {
    return String(this.evaluateArgument(args[0], context)).length;
  }

  // Logical Functions
  private ifFunction(args: string[], context: FormulaContext): any {
    const condition = this.evaluateArgument(args[0], context);
    const trueValue = args[1] ? this.evaluateArgument(args[1], context) : true;
    const falseValue = args[2] ? this.evaluateArgument(args[2], context) : false;
    return this.isTruthy(condition) ? trueValue : falseValue;
  }

  private andFunction(args: string[], context: FormulaContext): boolean {
    return args.every(arg => this.isTruthy(this.evaluateArgument(arg, context)));
  }

  private orFunction(args: string[], context: FormulaContext): boolean {
    return args.some(arg => this.isTruthy(this.evaluateArgument(arg, context)));
  }

  private notFunction(args: string[], context: FormulaContext): boolean {
    return !this.isTruthy(this.evaluateArgument(args[0], context));
  }

  // Date Functions
  private todayFunction(args: string[], context: FormulaContext): string {
    return new Date().toISOString().split('T')[0];
  }

  private workdaysFunction(args: string[], context: FormulaContext): number {
    const startDate = new Date(this.evaluateArgument(args[0], context));
    const endDate = new Date(this.evaluateArgument(args[1], context));
    
    let workdays = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        workdays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workdays;
  }

  private daysFunction(args: string[], context: FormulaContext): number {
    const startDate = new Date(this.evaluateArgument(args[0], context));
    const endDate = new Date(this.evaluateArgument(args[1], context));
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Status and Progress Functions
  private progressFunction(args: string[], context: FormulaContext): number {
    const completedStatuses = ['Complete', 'Done', 'Finished', 'Installed'];
    const totalSubitems = context.subitems.length;
    
    if (totalSubitems === 0) return 0;
    
    const completedSubitems = context.subitems.filter(subitem => 
      completedStatuses.some(status => 
        String(subitem.status).toLowerCase().includes(status.toLowerCase())
      )
    ).length;
    
    return Math.round((completedSubitems / totalSubitems) * 100);
  }

  private statusCountFunction(args: string[], context: FormulaContext): number {
    const statusToCount = String(this.evaluateArgument(args[0], context)).toLowerCase();
    return context.subitems.filter(subitem => 
      String(subitem.status).toLowerCase().includes(statusToCount)
    ).length;
  }

  private evaluateArgument(arg: string, context: FormulaContext): any {
    // Handle quoted strings
    if (arg.startsWith('"') && arg.endsWith('"')) {
      return arg.slice(1, -1);
    }
    
    // Handle numbers
    if (!isNaN(Number(arg))) {
      return Number(arg);
    }
    
    // Handle column references
    if (arg.includes('{') && arg.includes('}')) {
      return this.replaceColumnReferences(arg, context);
    }
    
    // Handle nested formulas
    if (arg.includes('(') && arg.includes(')')) {
      return this.evaluateFormula(arg, context);
    }
    
    return arg;
  }

  private isTruthy(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.toLowerCase() === 'true' || value !== '';
    return !!value;
  }

  private safeEvaluate(expression: string): any {
    try {
      // Basic arithmetic evaluation
      // Only allow safe mathematical operations
      const cleanExpr = expression.replace(/[^0-9+\-*/.() ]/g, '');
      if (cleanExpr !== expression) {
        return expression; // Return as-is if contains non-math characters
      }
      return Function(`"use strict"; return (${cleanExpr})`)();
    } catch {
      return expression;
    }
  }

  // Utility function to get all column references in a formula
  getColumnReferences(formula: string): string[] {
    const references = [];
    const regex = /\{([^}]+)\}/g;
    let match;
    
    while ((match = regex.exec(formula)) !== null) {
      references.push(match[1].trim());
    }
    
    return references;
  }

  // Validate formula syntax
  validateFormula(formula: string): { isValid: boolean; error?: string } {
    try {
      // Basic validation - check for balanced parentheses
      let depth = 0;
      for (const char of formula) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
        if (depth < 0) return { isValid: false, error: 'Mismatched parentheses' };
      }
      if (depth !== 0) return { isValid: false, error: 'Unbalanced parentheses' };
      
      // Check for valid function names
      const validFunctions = [
        'SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'ROUND',
        'CONCATENATE', 'TEXT', 'SUBSTITUTE', 'LEN',
        'IF', 'AND', 'OR', 'NOT',
        'TODAY', 'WORKDAYS', 'DAYS',
        'PROGRESS', 'STATUS_COUNT'
      ];
      
      const functionRegex = /([A-Z_]+)\(/g;
      let funcMatch;
      while ((funcMatch = functionRegex.exec(formula)) !== null) {
        if (!validFunctions.includes(funcMatch[1])) {
          return { isValid: false, error: `Unknown function: ${funcMatch[1]}` };
        }
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid formula syntax' };
    }
  }
}

export default FormulaEngine;