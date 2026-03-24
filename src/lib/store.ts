import { create } from "zustand";

export type FlowerType = "sunflower" | "tulip" | "lily" | "hydrangea" | "magnolia";

export interface Flower {
  id: string;
  garden_id: string;
  user_id: string;
  topic_name: string;
  flower_type: FlowerType;
  pattern_id: number;
  pattern_offset_x: number;
  pattern_offset_y: number;
  growth_stage: number;
  status: "growing" | "bloomed";
  created_at: string;
}

export interface Unit {
  id: string;
  flower_id: string;
  user_id: string;
  title: string;
  order_index: number;
  content_json: {
    content: string;
    key_terms: { term: string; definition: string }[];
  };
  diagram_mermaid: string | null;
  completed: boolean;
  created_at: string;
}

export interface Quiz {
  id: string;
  unit_id: string;
  user_id: string;
  type: "mc" | "short";
  question: string;
  options_json: string[] | null;
  correct_answer: string;
}

export interface LearnerProfile {
  id: string;
  user_id: string;
  primary_language: string;
  learning_style: string;
  preferences_json: Record<string, unknown>;
}

interface AppState {
  flowers: Flower[];
  currentFlower: Flower | null;
  units: Unit[];
  currentUnit: Unit | null;
  quizzes: Quiz[];
  learnerProfile: LearnerProfile | null;
  setFlowers: (flowers: Flower[]) => void;
  setCurrentFlower: (flower: Flower | null) => void;
  setUnits: (units: Unit[]) => void;
  setCurrentUnit: (unit: Unit | null) => void;
  setQuizzes: (quizzes: Quiz[]) => void;
  setLearnerProfile: (profile: LearnerProfile | null) => void;
  updateFlowerGrowth: (flowerId: string, stage: number, status?: "growing" | "bloomed") => void;
}

export const useAppStore = create<AppState>((set) => ({
  flowers: [],
  currentFlower: null,
  units: [],
  currentUnit: null,
  quizzes: [],
  learnerProfile: null,
  setFlowers: (flowers) => set({ flowers }),
  setCurrentFlower: (flower) => set({ currentFlower: flower }),
  setUnits: (units) => set({ units }),
  setCurrentUnit: (unit) => set({ currentUnit: unit }),
  setQuizzes: (quizzes) => set({ quizzes }),
  setLearnerProfile: (profile) => set({ learnerProfile: profile }),
  updateFlowerGrowth: (flowerId, stage, status) =>
    set((state) => ({
      flowers: state.flowers.map((f) =>
        f.id === flowerId ? { ...f, growth_stage: stage, ...(status && { status }) } : f
      ),
      currentFlower:
        state.currentFlower?.id === flowerId
          ? { ...state.currentFlower, growth_stage: stage, ...(status && { status }) }
          : state.currentFlower,
    })),
}));
