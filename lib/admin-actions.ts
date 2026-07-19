import { ApiError } from "./api";

type AdminActionDatabaseError = {
  code?: string;
  message?: string;
};

export function throwAdminActionError(error: AdminActionDatabaseError | null) {
  if (!error) return;
  if (error.code === "P0002")
    throw new ApiError("Seçilmiş hədəf tapılmadı.", 404, "TARGET_NOT_FOUND");
  if (error.code === "42501")
    throw new ApiError(
      "Bu idarəçi əməliyyatına icazə verilmir.",
      403,
      "ADMIN_ACTION_FORBIDDEN",
    );
  if (error.code === "23514")
    throw new ApiError(
      "Hədəfi artıq bu vəziyyətə keçirmək mümkün deyil.",
      409,
      "ADMIN_ACTION_CONFLICT",
    );
  if (error.code === "22023")
    throw new ApiError(
      "İdarəçi əməliyyatı etibarlı deyil.",
      422,
      "INVALID_ADMIN_ACTION",
    );
  throw error;
}
