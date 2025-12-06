import { create } from 'zustand'

export type DataProps = {
  name: string;
  weight: string;
  height: string;
  age: string;
  gender: string;
  level: string;
  objective: string;
}

type DataState = {
  user: DataProps;
  setPageOne: (data: Omit<DataProps, "gender" | "level" | "objective">) => void;
  setPageTwo: (data: Pick<DataProps, "gender" | "level" | "objective">) => void;
  resetData: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  user: {
    name: "",
    weight: "",
    height: "",
    age: "",
    gender: "",
    level: "",
    objective: ""
  },
  setPageOne: (data) => set((state) => ({ 
    user: { ...state.user, ...data }
  })),
  setPageTwo: (data) => set((state) => ({ 
    user: { ...state.user, ...data }
  })),
  resetData: () => set({ 
    user: {
      name: "",
      weight: "",
      height: "",
      age: "",
      gender: "",
      level: "",
      objective: ""
    }
  })
}))
