import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";

/**
 * Manages rounds and scores for a session, with realtime sync.
 *
 * Usage:
 *   const { rounds, scores, createRound, upsertScore, completeRound } = useRounds(sessionCode);
 */
export function useRounds(sessionCode) {
  const [rounds, setRounds] = useState([]);
  const [scores, setScores] = useState([]); // all scores for the session

  // -----------------------------------------------------------
  // Fetch helpers
  // -----------------------------------------------------------
  const fetchRounds = useCallback(async () => {
    if (!sessionCode) return;
    const { data } = await supabase
      .from("rounds")
      .select()
      .eq("session_code", sessionCode)
      .order("round_number");
    if (data) setRounds(data);
  }, [sessionCode]);

  const fetchScores = useCallback(async () => {
    if (!sessionCode) return;
    // Join through rounds to get all scores for this session
    const { data } = await supabase
      .from("scores")
      .select("*, rounds!inner(session_code, round_number)")
      .eq("rounds.session_code", sessionCode)
      .order("entered_at");
    if (data) setScores(data);
  }, [sessionCode]);

  // -----------------------------------------------------------
  // Create a new round (uses server-side RPC to avoid race conditions)
  // -----------------------------------------------------------
  const createRound = useCallback(async () => {
    if (!sessionCode) return null;
    const { data, error } = await supabase.rpc("create_round", {
      p_session_code: sessionCode,
    });
    if (error) {
      console.error("Error creating round:", error);
      return null;
    }
    return data;
  }, [sessionCode]);

  // -----------------------------------------------------------
  // Upsert a score (insert or update if already exists)
  // -----------------------------------------------------------
  const upsertScore = useCallback(
    async ({ roundId, playerId, score, formula, deviceId }) => {
      // Optimistic update
      const optimisticScore = {
        round_id: roundId,
        player_id: playerId,
        score,
        formula,
        entered_by: deviceId,
      };

      setScores((prev) => {
        const idx = prev.findIndex((s) => s.round_id === roundId && s.player_id === playerId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...optimisticScore };
          return next;
        }
        return [...prev, optimisticScore];
      });

      const { data, error } = await supabase
        .from("scores")
        .upsert(
          {
            round_id: roundId,
            player_id: playerId,
            score,
            formula,
            entered_by: deviceId,
          },
          { onConflict: "round_id,player_id" }
        )
        .select()
        .single();
      if (error) {
        console.error("Error upserting score:", error);
        return null;
      }
      return data;
    },
    []
  );

  // -----------------------------------------------------------
  // Mark a round as complete
  // -----------------------------------------------------------
  const completeRound = useCallback(async (roundId) => {
    const { error } = await supabase
      .from("rounds")
      .update({ status: "complete" })
      .eq("id", roundId);
    if (error) console.error("Error completing round:", error);
  }, []);

  // -----------------------------------------------------------
  // Delete a round (and its scores via cascade)
  // -----------------------------------------------------------
  const deleteRound = useCallback(async (roundId) => {
    // Optimistically remove from local state
    setRounds((prev) => prev.filter((r) => r.id !== roundId));
    setScores((prev) => prev.filter((s) => s.round_id !== roundId));

    // Delete scores first, then the round
    await supabase.from("scores").delete().eq("round_id", roundId);
    const { error } = await supabase.from("rounds").delete().eq("id", roundId);
    if (error) {
      console.error("Error deleting round:", error);
      // Refetch to restore state on failure
      fetchRounds();
      fetchScores();
      return false;
    }
    return true;
  }, [fetchRounds, fetchScores]);

  // -----------------------------------------------------------
  // Initial fetch + realtime subscriptions
  // -----------------------------------------------------------
  useEffect(() => {
    if (!sessionCode) return;

    fetchRounds();
    fetchScores();

    // Subscribe to round changes
    const roundsChannel = supabase
      .channel(`rounds:${sessionCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rounds",
          filter: `session_code=eq.${sessionCode}`,
        },
        () => fetchRounds()
      )
      .subscribe();

    // Subscribe to score changes (via all scores — we filter client-side)
    const scoresChannel = supabase
      .channel(`scores:${sessionCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scores",
        },
        () => fetchScores()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roundsChannel);
      supabase.removeChannel(scoresChannel);
    };
  }, [sessionCode, fetchRounds, fetchScores]);

  // -----------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------

  /** Map of playerId -> total score across all rounds */
  const totals = useMemo(
    () =>
      scores.reduce((acc, s) => {
        acc[s.player_id] = (acc[s.player_id] ?? 0) + s.score;
        return acc;
      }, {}),
    [scores]
  );

  /** Map of roundId -> { playerId: { score, formula, entered_by } } */
  const scoresByRound = useMemo(
    () =>
      scores.reduce((acc, s) => {
        if (!acc[s.round_id]) acc[s.round_id] = {};
        acc[s.round_id][s.player_id] = { score: s.score, formula: s.formula, entered_by: s.entered_by };
        return acc;
      }, {}),
    [scores]
  );

  /** The currently open round, if any */
  const activeRound = rounds.find((r) => r.status === "open") ?? null;

  return {
    rounds,
    scores,
    totals,
    scoresByRound,
    activeRound,
    createRound,
    upsertScore,
    completeRound,
    deleteRound,
  };
}
