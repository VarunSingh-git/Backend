class apiError extends Error {
    constructor(
        statusCode,
        messag = "Something went wrong",
        err = [],
        stack = ""
    ) {
        super(messag),
            this.statusCode = statusCode,
            this.data = null,
            this.message = messag,
            this.success = false,
            this.err = err

        if (stack) {
            this.stack = stack
        }
        else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { apiError }

// here we make our error message informative and understandble for error 