// Data layer — Supabase (cloud) when configured, localStorage (demo) otherwise.
(function () {
  const C = window.APP_CONFIG || {};
  const CLOUD = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase);
  const sb = CLOUD ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;

  const LS = { forms: "cmchf_forms", subs: "cmchf_subs", sess: "cmchf_admin" };
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
  const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  const now = () => new Date().toISOString();

  function seedLocal() {
    let forms = lsGet(LS.forms, null);
    if (!forms) {
      forms = [{ ...structuredClone(window.DEFAULT_RCH_FORM), id: uid(), created_at: now(), updated_at: now() }];
      lsSet(LS.forms, forms);
    }
    return forms;
  }

  function friendly(error) {
    if (!error) return error;
    if (error.code === "23505") return new Error("Yeh form link (slug) pehle se use ho raha hai. Dusra slug rakho.");
    return new Error(error.message || String(error));
  }

  async function checkAdmin() {
    const { data, error } = await sb.rpc("is_admin");
    if (error) throw friendly(error);
    return data === true;
  }

  const DB = {
    mode: CLOUD ? "cloud" : "local",

    async getActiveForm(slug) {
      if (CLOUD) {
        const { data, error } = await sb.from("forms").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
        if (error) throw friendly(error);
        return data;
      }
      return seedLocal().find((f) => f.slug === slug && f.is_active) || null;
    },

    async listForms() {
      if (CLOUD) {
        const { data, error } = await sb.from("forms").select("*").order("created_at", { ascending: true });
        if (error) throw friendly(error);
        return data;
      }
      return seedLocal();
    },

    async saveForm(form) {
      const row = {
        slug: form.slug, title: form.title, subtitle: form.subtitle || "",
        title_hi: form.title_hi || "", subtitle_hi: form.subtitle_hi || "",
        fields: form.fields, is_active: !!form.is_active, updated_at: now()
      };
      if (CLOUD) {
        const q = form.id
          ? sb.from("forms").update(row).eq("id", form.id).select().single()
          : sb.from("forms").insert(row).select().single();
        const { data, error } = await q;
        if (error) throw friendly(error);
        return data;
      }
      const forms = seedLocal();
      if (forms.some((f) => f.slug === row.slug && f.id !== form.id)) throw friendly({ code: "23505" });
      if (form.id) {
        const i = forms.findIndex((f) => f.id === form.id);
        forms[i] = { ...forms[i], ...row };
        lsSet(LS.forms, forms);
        return forms[i];
      }
      const created = { ...row, id: uid(), created_at: now() };
      forms.push(created);
      lsSet(LS.forms, forms);
      return created;
    },

    async deleteForm(id) {
      if (CLOUD) {
        const { error } = await sb.from("forms").delete().eq("id", id);
        if (error) throw friendly(error);
        return;
      }
      lsSet(LS.forms, seedLocal().filter((f) => f.id !== id));
      lsSet(LS.subs, lsGet(LS.subs, []).filter((s) => s.form_id !== id));
    },

    async submit(form_id, data) {
      if (CLOUD) {
        const { error } = await sb.from("submissions").insert({ form_id, data });
        if (error) throw friendly(error);
        return;
      }
      const subs = lsGet(LS.subs, []);
      subs.push({ id: uid(), form_id, data, created_at: now() });
      lsSet(LS.subs, subs);
    },

    async listSubmissions(form_id) {
      if (CLOUD) {
        const all = [];
        const page = 1000;
        for (let from = 0; ; from += page) {
          const { data, error } = await sb.from("submissions").select("*").eq("form_id", form_id)
            .order("created_at", { ascending: false }).range(from, from + page - 1);
          if (error) throw friendly(error);
          all.push(...data);
          if (data.length < page) break;
        }
        return all;
      }
      return lsGet(LS.subs, []).filter((s) => s.form_id === form_id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },

    async deleteSubmission(id) {
      if (CLOUD) {
        const { error } = await sb.from("submissions").delete().eq("id", id);
        if (error) throw friendly(error);
        return;
      }
      lsSet(LS.subs, lsGet(LS.subs, []).filter((s) => s.id !== id));
    },

    async login(email, password) {
      if (CLOUD) {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error("Email ya password galat hai.");
        if (!(await checkAdmin())) {
          await sb.auth.signOut();
          throw new Error("Yeh account admin list me nahi hai.");
        }
        return true;
      }
      if (password !== (C.LOCAL_ADMIN_PASSWORD || "admin123")) throw new Error("Password galat hai.");
      sessionStorage.setItem(LS.sess, "1");
      return true;
    },

    async isLoggedIn() {
      if (CLOUD) {
        const { data } = await sb.auth.getSession();
        if (!data.session) return false;
        return checkAdmin().catch(() => false);
      }
      return sessionStorage.getItem(LS.sess) === "1";
    },

    async logout() {
      if (CLOUD) await sb.auth.signOut();
      sessionStorage.removeItem(LS.sess);
    },

    newId: uid
  };

  window.DB = DB;
})();
