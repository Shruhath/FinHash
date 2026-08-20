import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import AddTransactionSheet from "@/components/transactions/AddTransactionSheet";

export interface AddPreset {
  goalId?: string;
  type?: "income" | "expense";
  categoryId?: string;
}

interface AddTransactionApi {
  openAdd: (preset?: AddPreset) => void;
}

const AddTransactionContext = createContext<AddTransactionApi>({ openAdd: () => {} });

/** Lets any screen open the global "add transaction" sheet. */
export function useAddTransaction() {
  return useContext(AddTransactionContext);
}

export function AddTransactionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<AddPreset | undefined>();

  const openAdd = useCallback((next?: AddPreset) => {
    setPreset(next);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openAdd }), [openAdd]);

  return (
    <AddTransactionContext.Provider value={value}>
      {children}
      <AddTransactionSheet
        open={open}
        preset={preset}
        onClose={() => setOpen(false)}
      />
    </AddTransactionContext.Provider>
  );
}
