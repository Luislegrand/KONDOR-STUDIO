const { ZodError } = require('zod');

module.exports = function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] || {});
    if (result.success) {
      req[source] = result.data;
      return next();
    }

    const details =
      result.error instanceof ZodError ? result.error.flatten() : undefined;
    return res.status(400).json({
      error: 'Validation failed',
      details,
    });
  };
};
