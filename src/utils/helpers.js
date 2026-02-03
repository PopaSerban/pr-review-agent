function sanitizeRepoName(repoFullName) {
  return repoFullName.replace(/\//g, '-');
}

function isValidHttpMethod(method) {
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  return validMethods.includes(method.toUpperCase());
}

module.exports = {
  sanitizeRepoName,
  isValidHttpMethod
};
