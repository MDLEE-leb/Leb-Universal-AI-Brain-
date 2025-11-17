import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
  password?: string; // Note: Storing plaintext passwords is for demo purposes ONLY.
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string, rememberMe: boolean) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  recoverPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'registeredUsers';

const getInitialUsers = (): User[] => {
    try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
            return JSON.parse(storedUsers);
        }
    } catch (error) {
        console.error("Failed to parse users from localStorage", error);
        localStorage.removeItem(USERS_STORAGE_KEY);
    }
    // Default user if storage is empty or corrupt
    return [{ email: 'user@example.com', password: 'password123' }];
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(getInitialUsers);

  useEffect(() => {
    // Persist users to localStorage whenever the list changes
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
        console.error("Failed to save users to localStorage", error);
    }
  }, [users]);

  useEffect(() => {
    // Check for a logged-in user on initial load from either storage
    try {
      // Prioritize persistent storage over session storage
      const storedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from storage", error);
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
    }
    setLoading(false);
  }, []);

  const login = (email: string, pass: string, rememberMe: boolean): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      // Simulate API call
      setTimeout(() => {
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (foundUser && foundUser.password === pass) {
          const user: User = { email: foundUser.email };
          setCurrentUser(user);
          
          // Clear any previous storage to be safe
          localStorage.removeItem('currentUser');
          sessionStorage.removeItem('currentUser');

          if (rememberMe) {
            localStorage.setItem('currentUser', JSON.stringify(user));
          } else {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
          }
          resolve({ success: true, message: 'Login successful!' });
        } else {
          resolve({ success: false, message: 'Invalid email or password.' });
        }
      }, 1000);
    });
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
  };
  
  const register = (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
       setTimeout(() => {
          const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
          if (userExists) {
            resolve({ success: false, message: 'An account with this email already exists.' });
          } else {
            const newUser = { email, password: pass };
            setUsers(prevUsers => [...prevUsers, newUser]);
            resolve({ success: true, message: 'Registration successful! You can now sign in.' });
          }
       }, 1000);
    });
  };

  const recoverPassword = (email: string): Promise<{ success: boolean; message: string }> => {
     return new Promise((resolve) => {
      // Simulate API call
      setTimeout(() => {
        // For security, always return a success-like message to prevent email enumeration.
        // The backend would handle actually sending an email only if a user exists.
        resolve({ success: true, message: `If an account exists for ${email}, a password recovery link has been sent.` });
      }, 1000);
    });
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
    recoverPassword,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};