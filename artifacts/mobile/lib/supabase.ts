import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://seivupcbzsykhnsybbvp.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_GzBByTJvZwMjbZrv-qBf-A_rJEnJnyC";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
