import { FUTA_PUNISH } from "@/api/api/endPoint"
import { createApiHooks } from "./use-endpoint-query";
import { DashboardCompany } from "@/types/home";
const { useEndpointQuery } = createApiHooks();

const { fetcher } = createApiHooks();
export function useDashboardMonth() {
  return useEndpointQuery(FUTA_PUNISH.dashboadMonth)
}

export function useDashboardYear() {
  return useEndpointQuery(FUTA_PUNISH.dashboadYear)
}

export function useDashboardCompany() {
  return fetcher < DashboardCompany > (FUTA_PUNISH.dashboardCompany)
}