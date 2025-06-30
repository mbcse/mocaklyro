export interface AnalyzeUserRequest {
    githubUsername: string;
    addresses: string[];
    forceRefresh?: boolean;
    email: string;
}

export interface AnalyzeUserResponse {
    success: boolean;
    data?: any;
    error?: string;
} 