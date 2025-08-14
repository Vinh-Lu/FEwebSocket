import { useCallback, useEffect, useState } from "react";
import { useCrud } from "./use-crud";
import { FUTA_COMMON } from "@/api/api/endPoint";
import { API_CONFIG } from "@/api/api/const";
import { Department } from "@/types/vms";

export const useDepartment = () => {
  const [departments, setDepartmentOptions] = useState<Department[]>([]);

  const { fetchData } = useCrud<Department>({
    endpoint: FUTA_COMMON.department,
    apiPrefix: API_CONFIG.FUTA_ENDPOINT_COMMON,
  });

  const fetchDepartments = useCallback(
    async (search?: string) => {
      try {
        const params = {
          page: 0,
          size: 10,
          ...(search ? { keyword: search } : {}),
        };
        const res = await fetchData(params);
        const items = res?.items || [];
        setDepartmentOptions(items as  Department[]);
      } catch {
        setDepartmentOptions([]);
      }
    },
    [fetchData]
  );

  // Gọi mặc định lần đầu
  useEffect(() => {
    fetchDepartments();
  }, []);

  return {
    departments,
    fetchDepartments, // dùng cho fetchOptions trong filters
  };
};
