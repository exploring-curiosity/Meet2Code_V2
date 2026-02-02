'use client';

import type {
  ChatMessage,
  Contest,
  RoomDetail,
  LCProblem,
  LeetCodeQuestionListResponse,
  LCTestCase,
  RunTestsResponse,
} from './types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:9000';

async function request<T>(path: string, options: RequestInit & { suppressErrorLog?: boolean } = {}): Promise<T> {
  const { suppressErrorLog, ...fetchOptions } = options;
  const response = await fetch(`${BACKEND_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers ?? {}),
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text || response.statusText);
    if (!suppressErrorLog) {
      console.error(`API Error [${response.status}] ${path}:`, text || response.statusText);
    }
    throw error;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export interface SessionResponse {
  loggedin: boolean;
  user?: {
    id: string;
    login: string;
    displayName?: string;
    imageUrl?: string;
  };
}

export async function fetchSession(): Promise<SessionResponse> {
  try {
    return await request<SessionResponse>('/api/oauth/isloggedin', { 
      method: 'GET',
      suppressErrorLog: true  // Don't log 401 errors - they're expected when not logged in
    });
  } catch (error) {
    return { loggedin: false };
  }
}

export async function logout(): Promise<void> {
  await request<void>('/api/oauth/logout', { method: 'POST' });
}

export async function fetchPublicRooms() {
  return request('/api/rooms/public', { method: 'GET' });
}

export async function createRoom(payload: {
  name: string;
  description?: string;
  type: 'PUBLIC' | 'PRIVATE';
  password?: string;
}): Promise<RoomDetail> {
  return request('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function joinRoom(slug: string, password?: string): Promise<RoomDetail> {
  return request(`/api/rooms/${slug}/join`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function leaveRoom(slug: string) {
  return request(`/api/rooms/${slug}/leave`, {
    method: 'POST',
  });
}

export async function deleteRoom(slug: string) {
  return request(`/api/rooms/${slug}`, {
    method: 'DELETE',
  });
}

export async function fetchRoomDetails(slug: string): Promise<RoomDetail> {
  return request(`/api/rooms/${slug}`, { method: 'GET' });
}

export async function fetchRoomMessages(slug: string): Promise<ChatMessage[]> {
  return request(`/api/rooms/${slug}/messages`, { method: 'GET' });
}

export async function fetchContests(): Promise<Contest[]> {
  return request('/api/contests', { method: 'GET' });
}

export async function fetchContest(slug: string): Promise<Contest> {
  return request(`/api/contests/${slug}`, { method: 'GET' });
}

export async function joinContest(slug: string) {
  return request(`/api/contests/${slug}/join`, { method: 'POST' });
}

export async function bumpContestScore(slug: string, problemNumber: number) {
  return request(`/api/contests/${slug}/score`, {
    method: 'POST',
    body: JSON.stringify({ problemNumber }),
  });
}

export async function fetchContestLeaderboard(slug: string): Promise<Contest['participants']> {
  return request(`/api/contests/${slug}/leaderboard`, { method: 'GET' });
}

export async function fetchLeetCodeQuestions(params: {
  tags?: string;
  difficulty?: string;
  search?: string;
}): Promise<LeetCodeQuestionListResponse> {
  const searchParams = new URLSearchParams();
  if (params.tags) searchParams.set('tags', params.tags);
  if (params.difficulty) searchParams.set('difficulty', params.difficulty);
  if (params.search) searchParams.set('search', params.search);
  return request(`/api/leetcode/questions?${searchParams.toString()}`, { method: 'GET' });
}

export async function fetchLeetCodeProblemDetails(titleSlug: string): Promise<LCProblem> {
  const params = new URLSearchParams({ titleSlug });
  return request(`/api/leetcode/problem/details?${params.toString()}`, { method: 'GET' });
}

export async function fetchQuestionTestCases(contestId: string, questionId: string): Promise<{ testCases: LCTestCase[] }> {
  const params = new URLSearchParams({ contestId, questionId });
  return request(`/api/questions/testcases?${params.toString()}`, { method: 'GET' });
}

export async function saveQuestionTestCases(
  contestId: string,
  questionId: string,
  testCases: LCTestCase[]
): Promise<{ testCases: LCTestCase[] }> {
  return request('/api/questions/testcases', {
    method: 'POST',
    body: JSON.stringify({ contestId, questionId, testCases }),
  });
}

export async function runQuestionTests(
  code: string,
  language: string,
  testCases: LCTestCase[]
): Promise<RunTestsResponse> {
  return request('/api/questions/run-tests', {
    method: 'POST',
    body: JSON.stringify({ code, language, testCases }),
  });
}

export async function fetchWhiteboard(roomId: string) {
  return request(`/api/whiteboard/${roomId}`, { method: 'GET' });
}

export async function fetchDocument(roomId: string) {
  return request(`/api/documents/${roomId}`, { method: 'GET' });
}
