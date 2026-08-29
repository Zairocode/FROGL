import { anyApi } from "convex/server";

/** Referencias al backend Convex sin importar `../convex` (fuera del front). */
export const api = anyApi;

export type Id<TableName extends string = string> = string & {
  __tableName: TableName;
};
