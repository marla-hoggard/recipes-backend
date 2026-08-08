type ApiErrorOptions = {
  status?: number;
  message: string;
  details?: string;
  hint?: string;
};

export class ApiError extends Error {
  status: number;
  details?: string;
  hint?: string;

  constructor({ status = 400, message, details, hint }: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.hint = hint;
  }
}
