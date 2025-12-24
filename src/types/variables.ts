export interface Variable {
  id: string;
  name: string;
  key: string;
  defaultValue: string;
  description?: string;
  category?: string;
  required?: boolean;
}

export interface VariableGroup {
  name: string;
  variables: Variable[];
}

export const DEFAULT_VARIABLES: Variable[] = [
  {
    id: 'var_first_name',
    name: 'First Name',
    key: 'first_name',
    defaultValue: 'Subscriber',
    description: "Recipient's first name",
    category: 'subscriber',
    required: false,
  },
  {
    id: 'var_last_name',
    name: 'Last Name',
    key: 'last_name',
    defaultValue: '',
    description: "Recipient's last name",
    category: 'subscriber',
    required: false,
  },
  {
    id: 'var_email',
    name: 'Email',
    key: 'email',
    defaultValue: '',
    description: "Recipient's email address",
    category: 'subscriber',
    required: true,
  },
  {
    id: 'var_company',
    name: 'Company Name',
    key: 'company_name',
    defaultValue: 'Your Company',
    description: 'Company or organization name',
    category: 'company',
    required: false,
  },
  {
    id: 'var_company_address',
    name: 'Company Address',
    key: 'company_address',
    defaultValue: '',
    description: 'Company mailing address',
    category: 'company',
    required: false,
  },
  {
    id: 'var_unsubscribe_link',
    name: 'Unsubscribe Link',
    key: 'unsubscribe_link',
    defaultValue: '#unsubscribe',
    description: 'Link to unsubscribe page',
    category: 'links',
    required: true,
  },
  {
    id: 'var_view_in_browser',
    name: 'View in Browser Link',
    key: 'view_in_browser_link',
    defaultValue: '#view-in-browser',
    description: 'Link to view email in browser',
    category: 'links',
    required: false,
  },
  {
    id: 'var_current_year',
    name: 'Current Year',
    key: 'current_year',
    defaultValue: new Date().getFullYear().toString(),
    description: 'Current year for copyright',
    category: 'date',
    required: false,
  },
];

export const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export function parseVariables(text: string): string[] {
  const matches = text.matchAll(VARIABLE_PATTERN);
  return [...matches].map(match => match[1]);
}

export function replaceVariables(
  text: string,
  variables: Map<string, string>,
  fallbackToDefault: boolean = true
): string {
  return text.replace(VARIABLE_PATTERN, (match, key) => {
    if (variables.has(key)) {
      return variables.get(key) || '';
    }
    return fallbackToDefault ? match : '';
  });
}

export function createVariableTag(key: string): string {
  return `{{ ${key} }}`;
}

export function isValidVariableKey(key: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key);
}
