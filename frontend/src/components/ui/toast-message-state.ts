"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export function startToastLoading(message: string) {
  return toast.loading(message, { id: "careerhub-action" });
}

export function useToastErrorState() {
  const [error, setErrorState] = useState("");

  const setError = (message: string) => {
    toast.dismiss("careerhub-action");
    if (message) toast.error(message);
    setErrorState("");
  };

  return [error, setError] as const;
}

export function useToastSuccessState() {
  const [success, setSuccessState] = useState("");

  const setSuccess = (message: string) => {
    toast.dismiss("careerhub-action");
    if (message) toast.success(message);
    setSuccessState("");
  };

  return [success, setSuccess] as const;
}
