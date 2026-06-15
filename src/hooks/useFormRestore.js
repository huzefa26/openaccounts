import { useEffect, useRef } from 'react';
import useTransactionStore from '../store/transactionStore';

export default function useFormRestore(dispatch, isEdit) {
  const { formRestoreState, markFormRestored, undoRestoreState, clearUndoRestoreState, saveFormRestoreState } = useTransactionStore();

  const formRef = useRef(null);

  useEffect(() => {
    if (!isEdit && formRestoreState) {
      dispatch({ type: 'RESTORE', state: formRestoreState });
      markFormRestored();
    }
  }, []);

  useEffect(() => {
    if (!isEdit && undoRestoreState) {
      dispatch({ type: 'RESTORE', state: undoRestoreState });
      clearUndoRestoreState();
    }
  }, [undoRestoreState]);

  useEffect(() => {
    return () => {
      if (!isEdit) {
        saveFormRestoreState(formRef.current);
      }
    };
  }, [isEdit]);

  return formRef;
}
