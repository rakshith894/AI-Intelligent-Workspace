
import { useQuery } from "@tanstack/react-query";
import {
  getMyWorkspaces,
  type Workspace,
} from "../services/workspace";

export function useMyWorkspaces() {
  return useQuery<Workspace[]>({
    queryKey: ["my-workspaces"],
    queryFn: getMyWorkspaces,
  });
}
