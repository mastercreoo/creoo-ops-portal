import { googleLogout } from '@react-oauth/google';

export type AuthUser = {
  email: string;
  name: string;
  picture?: string;
};

let currentUser: AuthUser | null = null;

export const authService = {
  loginWithGoogle: (googleUser: any): AuthUser => {
    const profile = googleUser;

    const user: AuthUser = {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    };

    currentUser = user;
    localStorage.setItem('auth_user', JSON.stringify(user));
    return user;
  },

  getCurrentUser: (): AuthUser | null => {
    if (currentUser) return currentUser;
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  },

  logout: () => {
    googleLogout();
    currentUser = null;
    localStorage.removeItem('auth_user');
  },
};
