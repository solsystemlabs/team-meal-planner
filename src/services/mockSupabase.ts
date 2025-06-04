import {
  User,
  Suggestion,
  Vote,
  Attendance,
  WeekPlan,
} from "../types/database";

export class MockSupabaseService {
  private users: User[] = [
    { id: "1", email: "admin@company.com", name: "Admin User", is_admin: true },
    { id: "2", email: "john@company.com", name: "John Smith", is_admin: false },
    { id: "3", email: "jane@company.com", name: "Jane Doe", is_admin: false },
  ];

  private suggestions: Suggestion[] = [];
  private votes: Vote[] = [];
  private attendance: Attendance[] = [];
  private weekPlans: WeekPlan[] = [];

  async signIn(email: string, password: string) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const user = this.users.find((u) => u.email === email);
    if (user && password === "password") {
      return { user, error: null };
    }
    return { user: null, error: "Invalid credentials" };
  }

  async signUp(email: string, password: string, name: string) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newUser: User = {
      id: String(Date.now()),
      email,
      name,
      is_admin: false,
      created_at: new Date().toISOString(),
    };
    this.users.push(newUser);
    return { user: newUser, error: null };
  }

  async signOut() {}

  async getSuggestions(weekOf: string): Promise<Suggestion[]> {
    if (this.suggestions.length === 0) {
      this.suggestions = [
        {
          id: "1",
          user_id: "2",
          user_name: "John Smith",
          restaurant: "Olive Garden",
          description: "Great Italian food, good for groups",
          week_of: weekOf,
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          user_id: "3",
          user_name: "Jane Doe",
          restaurant: "Chipotle",
          description: "Quick and healthy options",
          week_of: weekOf,
          created_at: new Date().toISOString(),
        },
      ];
    }
    return this.suggestions.filter((s) => s.week_of === weekOf);
  }

  async addSuggestion(
    suggestion: Omit<Suggestion, "id" | "created_at">,
  ): Promise<Suggestion> {
    const newSuggestion: Suggestion = {
      ...suggestion,
      id: String(Date.now()),
      created_at: new Date().toISOString(),
    };
    this.suggestions.push(newSuggestion);
    return newSuggestion;
  }

  async getVotes(): Promise<Vote[]> {
    return this.votes;
  }

  async upsertVote(vote: Omit<Vote, "id">): Promise<Vote> {
    const existingIndex = this.votes.findIndex(
      (v) =>
        v.user_id === vote.user_id && v.suggestion_id === vote.suggestion_id,
    );

    if (existingIndex >= 0) {
      this.votes[existingIndex] = {
        ...this.votes[existingIndex],
        rank: vote.rank,
      };
      return this.votes[existingIndex];
    } else {
      const newVote: Vote = { ...vote, id: String(Date.now()) };
      this.votes.push(newVote);
      return newVote;
    }
  }

  async getAttendance(weekOf: string): Promise<Attendance[]> {
    return this.attendance.filter((a) => a.week_of === weekOf);
  }

  async upsertAttendance(
    attendance: Omit<Attendance, "id">,
  ): Promise<Attendance> {
    const existingIndex = this.attendance.findIndex(
      (a) =>
        a.user_id === attendance.user_id && a.week_of === attendance.week_of,
    );

    if (existingIndex >= 0) {
      this.attendance[existingIndex] = {
        ...this.attendance[existingIndex],
        ...attendance,
      };
      return this.attendance[existingIndex];
    } else {
      const newAttendance: Attendance = {
        ...attendance,
        id: String(Date.now()),
      };
      this.attendance.push(newAttendance);
      return newAttendance;
    }
  }

  async getWeekPlan(weekOf: string): Promise<WeekPlan | null> {
    return this.weekPlans.find((wp) => wp.week_of === weekOf) || null;
  }

  async createWeekPlan(plan: Omit<WeekPlan, "id">): Promise<WeekPlan> {
    const newPlan: WeekPlan = { ...plan, id: String(Date.now()) };
    this.weekPlans.push(newPlan);
    return newPlan;
  }
}

export const mockService = new MockSupabaseService();
