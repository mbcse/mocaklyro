export type ENV = {
    API_URL: string;
    FRONTEND_URL: string;
  };
  
  export const env: ENV = {
    API_URL: process.env.NEXT_PUBLIC_API_URL!,
    FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  } as const;