import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getPlayerColor } from "../lib/colors";

/**
 * Manages a game session: creating, joining, and live player list.
 *
 * Usage:
 *   const { session, players, create, join, addPlayer, loading, error } = useSession();
 */
export function useSession(sessionCode = null) {
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------
  // Create a new session
  // -----------------------------------------------------------
  const create = useCallback(async ({ gameName } = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Generate a unique code via RPC
      const { data: code, error: codeErr } = await supabase.rpc(
        "generate_session_code"
      );
      if (codeErr) throw codeErr;

      // Insert the session
      const { data: sess, error: sessErr } = await supabase
        .from("sessions")
        .insert({ code, game_name: gameName || null })
        .select()
        .single();
      if (sessErr) throw sessErr;

      setSession(sess);
      return sess;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // -----------------------------------------------------------
  // Join an existing session
  // -----------------------------------------------------------
  const join = useCallback(async ({ code }) => {
    setLoading(true);
    setError(null);
    try {
      const upperCode = code.toUpperCase().trim();

      // Fetch the session
      const { data: sess, error: sessErr } = await supabase
        .from("sessions")
        .select()
        .eq("code", upperCode)
        .single();
      if (sessErr) throw new Error("Session not found");

      setSession(sess);
      return sess;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // -----------------------------------------------------------
  // Add a player manually (no device — someone at the table
  // who doesn't have the app open)
  // -----------------------------------------------------------
  const addPlayer = useCallback(
    async (name) => {
      const code = session?.code ?? sessionCode;
      if (!code) return null;
      const { count } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("session_code", code);

      const { data, error: err } = await supabase
        .from("players")
        .insert({
          session_code: code,
          name,
          color: getPlayerColor(count ?? 0),
          device_id: null,
          is_host: false,
        })
        .select()
        .single();
      if (err) {
        setError(err.message);
        return null;
      }
      return data;
    },
    [session, sessionCode]
  );

  // -----------------------------------------------------------
  // Remove a player
  // -----------------------------------------------------------
  const removePlayer = useCallback(
    async (playerId) => {
      if (!session && !sessionCode) return false;
      // Optimistically remove from local state
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));

      const { error: err } = await supabase
        .from("players")
        .delete()
        .eq("id", playerId);
      if (err) {
        console.error("Error removing player:", err);
        return false;
      }
      return true;
    },
    [session, sessionCode]
  );

  // -----------------------------------------------------------
  // Fetch session when joining via URL (sessionCode provided)
  // -----------------------------------------------------------
  useEffect(() => {
    if (session || !sessionCode) return;
    const fetchSession = async () => {
      const { data } = await supabase
        .from("sessions")
        .select()
        .eq("code", sessionCode.toUpperCase())
        .single();
      if (data) setSession(data);
    };
    fetchSession();
  }, [session, sessionCode]);

  // -----------------------------------------------------------
  // Load players + subscribe to realtime changes
  // -----------------------------------------------------------
  useEffect(() => {
    const code = session?.code ?? sessionCode;
    if (!code) return;

    // Initial fetch
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from("players")
        .select()
        .eq("session_code", code)
        .order("joined_at");
      if (data) setPlayers(data);
    };
    fetchPlayers();

    // Realtime subscription
    const channel = supabase
      .channel(`players:${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `session_code=eq.${code}`,
        },
        () => {
          // Re-fetch the full list on any change — simpler than diffing
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.code, sessionCode]);

  // -----------------------------------------------------------
  // Update the game name
  // -----------------------------------------------------------
  const updateGameName = useCallback(
    async (gameName) => {
      const code = session?.code ?? sessionCode;
      if (!code) return false;
      const { error: err } = await supabase
        .from("sessions")
        .update({ game_name: gameName || null })
        .eq("code", code);
      if (err) {
        console.error("Error updating game name:", err);
        return false;
      }
      setSession((prev) => (prev ? { ...prev, game_name: gameName || null } : prev));
      return true;
    },
    [session, sessionCode]
  );

  return { session, players, create, join, addPlayer, removePlayer, updateGameName, loading, error };
}
