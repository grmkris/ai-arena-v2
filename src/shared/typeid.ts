import { typeid } from "typeid-js";
import { z } from "zod";

const idTypesMapNameToPrefix = {
  match: "mat",
  agent: "agt",
  replay: "rpl",
  token: "tok",
  request: "req",
} as const;

type IdTypeName = keyof typeof idTypesMapNameToPrefix;
type PrefixOf<T extends IdTypeName> = (typeof idTypesMapNameToPrefix)[T];
type TypeId<T extends string> = `${T}_${string}`;

/** Create a Zod validator for a TypeID with a given prefix */
function typeIdValidator<T extends IdTypeName>(name: T) {
  const prefix = idTypesMapNameToPrefix[name];
  return z.string().refine(
    (val): val is TypeId<PrefixOf<T>> =>
      val.startsWith(`${prefix}_`) && val.length > prefix.length + 1,
    { message: `Invalid ${name} ID: must start with "${prefix}_"` },
  );
}

/** Create a generator function for TypeIDs with a given prefix */
function typeIdGenerator<T extends IdTypeName>(name: T) {
  const prefix = idTypesMapNameToPrefix[name];
  return (): TypeId<PrefixOf<T>> =>
    typeid(prefix).toString() as TypeId<PrefixOf<T>>;
}

// ── Named Types ──

export type MatchId = TypeId<"mat">;
export type AgentStatsId = TypeId<"agt">;
export type ReplayId = TypeId<"rpl">;
export type TokenId = TypeId<"tok">;
export type RequestId = TypeId<"req">;

// ── Validators ──

export const MatchIdSchema = typeIdValidator("match");
export const AgentStatsIdSchema = typeIdValidator("agent");
export const ReplayIdSchema = typeIdValidator("replay");
export const TokenIdSchema = typeIdValidator("token");
export const RequestIdSchema = typeIdValidator("request");

// ── Generators ──

export const generateMatchId = typeIdGenerator("match");
export const generateAgentStatsId = typeIdGenerator("agent");
export const generateReplayId = typeIdGenerator("replay");
export const generateTokenId = typeIdGenerator("token");
export const generateRequestId = typeIdGenerator("request");
