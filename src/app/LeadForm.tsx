"use client";

import { useState, FormEvent } from "react";
import { leadSchema } from "@/lib/validation";

const BUDGET_OPTIONS = ["<$1k", "$1k-$5k", "$5k-$15k", "$15k+", "Not sure yet"];

type FieldErrors = Partial<Record<"name" | "email" | "budgetRange" | "message", string>>;

export default function LeadForm() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    budgetRange: "",
    message: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function update<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");

    // Client-side validation first — fast feedback, no round trip needed
    // for obvious mistakes.
    const parsed = leadSchema.safeParse(values);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        name: flat.name?.[0],
        email: flat.email?.[0],
        budgetRange: flat.budgetRange?.[0],
        message: flat.message?.[0],
      });
      return;
    }
    setErrors({});
    setStatus("submitting");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Server-side validation is the source of truth — surface its
        // errors too, in case client and server schemas ever drift.
        if (data.fieldErrors) {
          setErrors({
            name: data.fieldErrors.name?.[0],
            email: data.fieldErrors.email?.[0],
            budgetRange: data.fieldErrors.budgetRange?.[0],
            message: data.fieldErrors.message?.[0],
          });
          setStatus("idle");
          return;
        }
        throw new Error(data.error || "Submission failed");
      }

      setStatus("success");
      setValues({ name: "", email: "", budgetRange: "", message: "" });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="banner banner-success">
        Thanks — your message is in. We&apos;ll get back to you shortly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && <div className="banner banner-error">{serverError}</div>}

      <div className={`field ${errors.name ? "has-error" : ""}`}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Jordan Lee"
        />
        {errors.name && <div className="field-error">{errors.name}</div>}
      </div>

      <div className={`field ${errors.email ? "has-error" : ""}`}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="jordan@company.com"
        />
        {errors.email && <div className="field-error">{errors.email}</div>}
      </div>

      <div className={`field ${errors.budgetRange ? "has-error" : ""}`}>
        <label htmlFor="budgetRange">Budget range</label>
        <select
          id="budgetRange"
          value={values.budgetRange}
          onChange={(e) => update("budgetRange", e.target.value)}
        >
          <option value="">Select a range</option>
          {BUDGET_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {errors.budgetRange && <div className="field-error">{errors.budgetRange}</div>}
      </div>

      <div className={`field ${errors.message ? "has-error" : ""}`}>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="What are you looking to build?"
        />
        {errors.message && <div className="field-error">{errors.message}</div>}
      </div>

      <button className="btn btn-primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
