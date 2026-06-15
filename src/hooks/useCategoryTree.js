import { useMemo } from 'react';

export default function useCategoryTree(categories) {
  return useMemo(() => {
    const visible = categories.filter((c) => !c.is_system);

    const childrenMap = {};
    const roots = [];
    const grouped = {};

    for (const cat of visible) {
      if (cat.parent_id) {
        if (!childrenMap[cat.parent_id]) childrenMap[cat.parent_id] = [];
        childrenMap[cat.parent_id].push(cat);
      } else {
        roots.push(cat);
        if (!grouped[cat.type]) grouped[cat.type] = [];
        grouped[cat.type].push(cat);
      }
    }

    return { childrenMap, roots, grouped };
  }, [categories]);
}
