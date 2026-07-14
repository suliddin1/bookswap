import { ApiError } from "./api";

type AdminActionDatabaseError = {
  code?: string;
  message?: string;
};

export function throwAdminActionError(error: AdminActionDatabaseError | null) {
  if (!error) return;
  if (error.code === "P0002")
    throw new ApiError(
      "The requested target was not found.",
      404,
      "TARGET_NOT_FOUND",
    );
  if (error.code === "42501")
    throw new ApiError(
      "This administrator action is not allowed.",
      403,
      "ADMIN_ACTION_FORBIDDEN",
    );
  if (error.code === "23514")
    throw new ApiError(
      "The target can no longer move to that state.",
      409,
      "ADMIN_ACTION_CONFLICT",
    );
  if (error.code === "22023")
    throw new ApiError(
      "The administrator action is invalid.",
      422,
      "INVALID_ADMIN_ACTION",
    );
  throw error;
}
