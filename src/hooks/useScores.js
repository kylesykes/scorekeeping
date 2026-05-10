import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";

/**
 * Manages per-player score streams for a session, with realtime sync.
 *
 * Each score is an independent row keyed to a player, ordered by entered_at.
 * There is no shared "round" object — a player's Nth entry is simply their
 * Nth score by time.
 */
export function useScores(sessionCode) {
  const [scores, setScores] = useState([]);

  const fetchScores = useCallback(async () => {
    if (!sessionCode) return;
    const { data } = await supabase
      .from("scores")
      .select()
      .eq("session_code", sessionCode)
      .order("entered_at");
    if (data) setScores(data);
  }, [sessionCode]);

  const appendScore = useCallback(
    async ({ playerId, score, formula, deviceId }) => {
      if (!sessionCode) return null;
      const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
      const optimistic = {
        id: optimisticId,
        session_code: sessionCode,
        player_id: playerId,
        score,
        formula,
        entered_by: deviceId,
        entered_at: new Date().toISOString(),
      };
      setScores((prev) => [...prev, optimistic]);

      const { data, error } = await supabase
        .from("scores")
        .insert({
          session_code: sessionCode,
          player_id: playerId,
          score,
          formula,
          entered_by: deviceId,
        })
        .select()
        .single();

      if (error) {
        console.error("Error appending score:", error);
        setScores((prev) => prev.filter((s) => s.id !== optimisticId));
        return null;
      }
      setScores((prev) => prev.map((s) => (s.id === optimisticId ? data : s)));
      return data;
    },
    [sessionCode]
  );

  const updateScore = useCallback(async ({ scoreId, score, formula, deviceId }) => {
    setScores((prev) =>
      prev.map((s) =>
        s.id === scoreId ? { ...s, score, formula, entered_by: deviceId } : s
      )
    );

    const { data, error } = await supabase
      .from("scores")
      .update({ score, formula, entered_by: deviceId })
      .eq("id", scoreId)
      .select()
      .single();
    if (error) {
      console.error("Error updating score:", error);
      return null;
    }
    return data;
  }, []);

  const deleteScore = useCallback(async (scoreId) => {
    setScores((prev) => prev.filter((s) => s.id !== scoreId));
    const { error } = await supabase.from("scores").delete().eq("id", scoreId);
    if (error) {
      console.error("Error deleting score:", error);
      fetchScores();
      return false;
    }
    return true;
  }, [fetchScores]);

  useEffect(() => {
    if (!sessionCode) return;
    fetchScores();

    const channel = supabase
      .channel(`scores:${sessionCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scores",
          filter: `session_code=eq.${sessionCode}`,
        },
        () => fetchScores()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionCode, fetchScores]);

  /** Map of playerId -> ordered array of score rows (oldest first) */
  const scoresByPlayer = useMemo(() => {
    const byPlayer = {};
    for (const s of scores) {
      if (!byPlayer[s.player_id]) byPlayer[s.player_id] = [];
      byPlayer[s.player_id].push(s);
    }
    return byPlayer;
  }, [scores]);

  /** Map of playerId -> total score */
  const totals = useMemo(
    () =>
      scores.reduce((acc, s) => {
        acc[s.player_id] = (acc[s.player_id] ?? 0) + s.score;
        return acc;
      }, {}),
    [scores]
  );

  /** Largest stream length across all players — used for grid-by-index display */
  const maxEntries = useMemo(
    () =>
      Object.values(scoresByPlayer).reduce(
        (max, arr) => Math.max(max, arr.length),
        0
      ),
    [scoresByPlayer]
  );

  return {
    scores,
    scoresByPlayer,
    totals,
    maxEntries,
    appendScore,
    updateScore,
    deleteScore,
  };
}
