export type Participant = {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
};

export type RoomDetail = {
  slug: string;
  name: string;
  description?: string;
  hostId: string;
  type: 'PUBLIC' | 'PRIVATE';
  passwordProtected: boolean;
  participants: Participant[];
};

export type ChatMessage = {
  id: string;
  authorId?: string;
  authorUsername?: string;
  body: string;
  createdAt: string;
};

export type Contest = {
  slug: string;
  name: string;
  status: 'NOT_STARTED' | 'RUNNING' | 'COMPLETED';
  startTime: string;
  questions: string[];
  participants: {
    userId: string;
    username: string;
    score: number;
  }[];
};

// LeetCode problem types
export type LCTestCase = {
  input: string;
  output: string;
};

export type TestRunResult = {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  error: string;
  executionTimeMs: number;
  success: boolean;
};

export type RunTestsResponse = {
  passed: number;
  total: number;
  results: TestRunResult[];
};

export type LCProblem = {
  titleSlug: string;
  title: string;
  difficulty: string;
  statement: string; // HTML
  sampleTests: LCTestCase[];
};

export type LeetCodeTag = {
  name: string;
  slug: string;
};

export type LeetCodeQuestion = {
  title: string;
  titleSlug: string;
  difficulty: string;
  topicTags: LeetCodeTag[];
};

export type LeetCodeQuestionListResponse = {
  total: number;
  questions: LeetCodeQuestion[];
};
