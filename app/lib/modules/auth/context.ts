import { createContext } from "react-router";
import type { User } from "~/lib/clients/onebot/models";

export const userContext = createContext<User>();
