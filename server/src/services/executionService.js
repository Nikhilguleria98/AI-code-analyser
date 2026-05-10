import vm from 'vm';

const formatValue = (value) => {
  if (typeof value === 'undefined') return 'undefined';
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch (_error) {
    return String(value);
  }
};

const getRuntimeLocation = (stack = '', filePath) => {
  const escapedFile = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = stack.match(new RegExp(`${escapedFile}:(\\d+):(\\d+)`));

  return {
    line: Number(match?.[1]) || 1,
    column: Number(match?.[2]) || 1
  };
};

export const runPastedJavaScript = (code, filePath = 'pasted-code.js') => {
  const output = [];
  const sandboxConsole = {
    log: (...args) => output.push(args.map(formatValue).join(' ')),
    error: (...args) => output.push(args.map(formatValue).join(' ')),
    warn: (...args) => output.push(args.map(formatValue).join(' '))
  };

  const context = vm.createContext({
    console: sandboxConsole,
    Math,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Date,
    RegExp,
    parseInt,
    parseFloat,
    isNaN,
    isFinite
  });

  try {
    const script = new vm.Script(code, {
      filename: filePath,
      displayErrors: true
    });
    const result = script.runInContext(context, { timeout: 1000 });

    return {
      status: 'success',
      output,
      result: formatValue(result)
    };
  } catch (error) {
    const location = getRuntimeLocation(error.stack, filePath);

    return {
      status: 'error',
      output,
      error: error.message,
      line: location.line,
      column: location.column
    };
  }
};
