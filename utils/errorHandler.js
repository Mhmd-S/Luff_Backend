export class AppError extends Error {
  constructor(statusCode, message) {
      super(message);
      this.statusCode = statusCode;
  }
}

export const errorHandlers = {
  handleError(err, res) {
    // Default to a 500 Internal Server Error if no specific status is provided
    const status = err?.type || 500;

    // Customize the error response format
    const response = {
      status: "fail",
      message: err.detail || "Internal Server Error",
    };

    // Log the error for debugging purposes
    console.error(err);

    res.status(status).json(response);
  },

  handleDbError(err, res) {
    if (err.name === "ValidationError") {
      // Handle Mongoose validation errors
      const errors = {};

      for (const field in err.errors) {
        errors[field] = err.errors[field].message;
      }

      res.status(400).json({
        status: "fail",
        errors,
      });
    } else if (err.name === "CastError") {
      // Handle Mongoose cast errors
      const message = `Invalid value for ${err.path}: ${err.value}`;

      res.status(400).json({
        status: "fail",
        message,
      });
    } else {
      // Handle other Mongoose errors
      this.handleError(err, res);
    }
  },

  handleFormError(errors, res) {
    // Handle errors from React Hook Form

    const formattedErrors = {};

    for (const error of errors) {
      formattedErrors[error.path] = error.msg;
    }

    res.status(400).json({
      status: "fail",
      errors: formattedErrors,
    });
  },
};
