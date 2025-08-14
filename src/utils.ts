export const getLanguageForType = (type: string): string => {
  const langMap: { [key: string]: string } = {
    'jq': 'text', // Monaco doesn't have jq highlighting, use plain text to avoid errors
    'lua': 'lua',
    'handlebars': 'handlebars',
    'pg': 'sql',
    'auth': 'yaml',
    'validate': 'json',
    'cache': 'yaml',
    'log': 'yaml',
    'curl': 'shell'
  };
  return langMap[type] || 'text';
};

export const getDefaultCode = (type: string): string => {
  switch (type) {
    case 'curl':
      return 'curl -s "https://api.example.com/data"';
    case 'jq':
      return '. | { transformed: .data }';
    case 'lua':
      return 'return { message = "Hello from Lua!" }';
    case 'handlebars':
      return '<h1>{{title}}</h1>';
    case 'pg':
      return 'SELECT * FROM users LIMIT 10';
    default:
      return '';
  }
};

export const availableOperations = [
  { type: 'curl', label: 'curl', language: 'shell' },
  { type: 'jq', label: 'jq', language: 'text' },
  { type: 'lua', label: 'lua', language: 'lua' },
  { type: 'handlebars', label: 'handlebars', language: 'handlebars' },
  { type: 'pg', label: 'pg', language: 'sql' },
  { type: 'auth', label: 'auth', language: 'yaml' },
  { type: 'validate', label: 'validate', language: 'json' },
  { type: 'cache', label: 'cache', language: 'yaml' },
  { type: 'log', label: 'log', language: 'yaml' }
];