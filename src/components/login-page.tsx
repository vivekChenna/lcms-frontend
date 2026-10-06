import { Button, Field, FluentProvider, Input, webLightTheme } from "@fluentui/react-components";
import { Eye24Regular, EyeOff24Regular, Gavel24Regular, LockClosed24Regular, Mail24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { useLcms } from "@/lib/lcms-context";

const loginSchema = z.object({ email: z.string().email("Enter a valid email address."), password: z.string().min(8, "Password must be at least 8 characters.") });
type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setSignedIn } = useLcms();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: "onBlur", defaultValues: { email: "", password: "" } });
  return <FluentProvider theme={webLightTheme}><main className="grid min-h-[100dvh] bg-background lg:grid-cols-[1.15fr_0.85fr]"><section className="hidden bg-login-panel p-14 text-login-foreground lg:flex lg:flex-col"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-md bg-login-mark"><Gavel24Regular /></div><div><p className="font-display text-xl font-semibold">Algihaz Legal</p><p className="text-sm text-login-muted">Case Management System</p></div></div><div className="my-auto max-w-xl"><p className="font-display text-4xl font-semibold leading-tight">Clear legal workflows for every business unit.</p><p className="mt-5 max-w-lg text-lg leading-7 text-login-muted">Submit, assign, resolve, and audit legal matters in one controlled workspace.</p></div><p className="text-sm text-login-muted">Internal use only</p></section><section className="flex items-center justify-center p-6"><form onSubmit={form.handleSubmit(() => { setSignedIn(true); navigate({ to: "/" }); })} className="w-full max-w-md"><div className="mb-10 lg:hidden"><div className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground"><Gavel24Regular /></div></div><h1 className="font-display text-3xl font-semibold">Sign in to LCMS</h1><p className="mt-2 text-sm text-muted-foreground">Use your Algihaz credentials to continue.</p><div className="mt-8 space-y-5"><Field label="Work email" validationMessage={form.formState.errors.email?.message}><Input contentBefore={<Mail24Regular />} autoComplete="email" {...form.register("email")} /></Field><Field label="Password" validationMessage={form.formState.errors.password?.message}><Input contentBefore={<LockClosed24Regular />} contentAfter={<Button appearance="transparent" size="small" icon={showPassword ? <EyeOff24Regular /> : <Eye24Regular />} aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} />} type={showPassword ? "text" : "password"} autoComplete="current-password" {...form.register("password")} /></Field><Button appearance="primary" type="submit" size="large" className="w-full">Sign in</Button></div></form></section></main></FluentProvider>;
}