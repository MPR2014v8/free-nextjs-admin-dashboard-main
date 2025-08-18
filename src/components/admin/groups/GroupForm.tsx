"use client";
import React from "react";

export type GroupFormValues = {
  name: string;
  description?: string;
  tokenLimit?: number;
};

export default function GroupForm({
  onSubmit,
  defaultValue,
}: {
  onSubmit: (v: GroupFormValues) => void;
  defaultValue?: GroupFormValues;
}) {
  const [name, setName] = React.useState(defaultValue?.name ?? "");
  const [description, setDescription] = React.useState(defaultValue?.description ?? "");
  const [tokenLimit, setTokenLimit] = React.useState<number | "">(
    typeof defaultValue?.tokenLimit === "number" ? defaultValue!.tokenLimit : "",
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      tokenLimit: tokenLimit === "" ? undefined : Number(tokenLimit),
    });
  };

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <label className="text-sm">
        Group name
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Admin"
          required
        />
      </label>
      <label className="text-sm">
        Description
        <textarea
          className="mt-1 w-full resize-none rounded-lg border px-3 py-2 text-sm"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
        />
      </label>
      <label className="text-sm">
        Token limit
        <input
          type="number"
          min={0}
          step={1}
          className="mt-1 w-40 rounded-lg border px-3 py-2 text-sm"
          value={tokenLimit}
          onChange={(e) => {
            const v = e.target.value;
            setTokenLimit(v === "" ? "" : Number(v));
          }}
          placeholder="1000"
        />
      </label>

      <div className="mt-1 flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
        >
          Create
        </button>
      </div>
    </form>
  );
}
