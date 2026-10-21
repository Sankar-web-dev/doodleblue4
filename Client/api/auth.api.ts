import { api } from "@/lib/api";

export interface RolePermission {
  resource: string;
  actions: ("create" | "read" | "update" | "delete")[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Role name string — "SUPER_ADMIN" for the system account, role name otherwise. */
  role: string;
  roleId?: string;
  /** Optional profile image URL. */
  image?: string;
  mustChangePassword: boolean;
  isActive: boolean;
  /** Granular permissions from the user's role. Empty for SUPER_ADMIN (implicit full access). */
  permissions: RolePermission[];
}

/** Display label for common known roles. Falls back to the raw name for custom roles. */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    USER: "User",
  };
  return labels[role] ?? role;
}

export const authApi = {
  signIn: (email: string, password: string) =>
    api.post<{ user: AuthUser; token: string }>("/api/v1/auth/login", {
      email,
      password,
    }),

  signUp: (
    name: string,
    email: string,
    password: string,
    opts?: { roleId?: string; image?: string }
  ) =>
    api.post<{ user: AuthUser; token: string }>("/api/v1/auth/register", {
      name,
      email,
      password,
      roleId: opts?.roleId,
      image: opts?.image,
    }),

  /** Public roles flagged for self-signup. */
  signupRoles: () =>
    api.get<{ id: string; name: string; description: string }[]>(
      "/api/v1/auth/signup-roles"
    ),

  /** Public avatar upload for the signup form (pre-auth). */
  uploadSignupAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.postFormData<{ url: string; filename: string }>(
      "/api/v1/auth/upload-avatar",
      formData
    );
  },

  signOut: () => api.post<{ message: string }>("/api/v1/auth/logout"),

  me: () => api.get<{ user: AuthUser }>("/api/v1/auth/me"),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ message: string; token: string }>(
      "/api/v1/auth/change-password",
      {
        currentPassword,
        newPassword,
      }
    ),
};

export const authService = authApi;
export const AUTH_ME_KEY = ["auth", "me"] as const;
