import validator from 'validator';

export const isSafeGithubUrl = (value) => {
  if (!validator.isURL(value || '', { require_protocol: true })) {
    return false;
  }

  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?$/i.test(value);
};

export const sanitizeText = (value = '') => validator.escape(String(value).trim());
