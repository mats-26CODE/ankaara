"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Home, Phone } from "lucide-react";
import {
  AUTH_PHONE_ERROR_CODES,
  AuthPhoneError,
  useGoogleOAuth,
  useSendOtp,
} from "@/hooks/use-auth";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { APP_NAME } from "@/constants/values";
import { useTranslation } from "@/hooks/use-translation";
import { clampPhoneDigitInput, formatPhoneForDisplay, validatePhoneNumber } from "@/helpers/helpers";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  landingEase,
  landingFadeIn,
  landingFadeUp,
  landingFadeUpTight,
  landingStaggerParent,
} from "@/components/shared/scroll-reveal";

const LoginContent = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const phoneFromUrl = searchParams.get("phone");

  // Handle OAuth callback when Supabase redirects to /login?code=... (e.g. Site URL misconfigured)
  useEffect(() => {
    if (code) {
      const nextPath = next || redirect || "/dashboard";
      window.location.href = `/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(nextPath)}`;
    }
  }, [code, next, redirect]);

  const [formData, setFormData] = useState({
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [noAccountDialogOpen, setNoAccountDialogOpen] = useState(false);

  const googleOAuthMutation = useGoogleOAuth();
  const sendOtpMutation = useSendOtp(false, "login");

  useEffect(() => {
    if (!phoneFromUrl) return;
    const digits = clampPhoneDigitInput(formatPhoneForDisplay(phoneFromUrl));
    if (digits) setFormData((prev) => ({ ...prev, phone: digits }));
  }, [phoneFromUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, [name]: numericValue }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone number
    const validation = validatePhoneNumber(formData.phone);
    if (!validation.isValid) {
      setError(validation.error || t("auth.login.error"));
      return;
    }

    // Send OTP and navigate to verify-otp page (preserve redirect for after login)
    sendOtpMutation.mutate(
      { phone: formData.phone },
      {
        onSuccess: () => {
          const verifyUrl = new URL("/verify-otp", window.location.origin);
          verifyUrl.searchParams.set("phone", formData.phone);
          if (redirect) verifyUrl.searchParams.set("redirect", redirect);
          router.push(verifyUrl.pathname + verifyUrl.search);
        },
        onError: (err) => {
          const code =
            err instanceof AuthPhoneError
              ? err.code
              : err instanceof Error && err.message.includes("No account found")
                ? AUTH_PHONE_ERROR_CODES.ACCOUNT_NOT_FOUND
                : null;
          if (code === AUTH_PHONE_ERROR_CODES.ACCOUNT_NOT_FOUND) {
            setNoAccountDialogOpen(true);
            sendOtpMutation.reset();
            return;
          }
          setError(err instanceof Error ? err.message : t("auth.login.error"));
        },
      },
    );
  };

  const handleGoogleSignIn = () => {
    googleOAuthMutation.mutate();
  };

  const handleGoToRegister = () => {
    setNoAccountDialogOpen(false);
    sendOtpMutation.reset();
    const signUpUrl = formData.phone.trim()
      ? `/sign-up?phone=${encodeURIComponent(formData.phone.trim())}`
      : "/sign-up";
    router.push(signUpUrl);
  };

  const handleNoAccountDialogChange = (open: boolean) => {
    setNoAccountDialogOpen(open);
    if (!open) sendOtpMutation.reset();
  };

  if (code) {
    return (
      <motion.div
        className="bg-background flex min-h-screen items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: landingEase }}
      >
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: landingEase, delay: 0.08 }}
        >
          <Logo size="sm" />
          <p className="text-muted-foreground text-sm">{t("auth.common.completingSignIn")}</p>
          <Spinner className="size-6" />
        </motion.div>
      </motion.div>
    );
  }

  const testimonial = {
    quote: `${APP_NAME} has made getting paid on time a breeze. Professional invoices, payment links, and mobile money—everything I need in one place.`,
    author: `@${APP_NAME.toLowerCase()}_user`,
  };

  return (
    <div className="flex min-h-screen">
      <div className="bg-background flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center p-8">
          <motion.div
            className="w-full max-w-md space-y-8"
            variants={landingStaggerParent}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={landingFadeUpTight} className="mb-8">
              <Logo size="sm" />
            </motion.div>

            <motion.div variants={landingFadeUp} className="space-y-2">
              <Button variant="outline" size="sm" asChild className="mb-4 rounded-full">
                <Link href="/">
                  <Home className="mr-1 size-4" />
                  {t("auth.common.backToHome")}
                </Link>
              </Button>
              <h1 className="text-foreground text-3xl font-bold">{t("auth.login.welcome")}</h1>
              <p className="text-muted-foreground">{t("auth.login.subtitle")}</p>
            </motion.div>

            {/* Google OAuth Button - Primary */}
            <motion.div variants={landingFadeUpTight}>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full border-2"
                onClick={handleGoogleSignIn}
                disabled={sendOtpMutation.isPending}
                isLoading={googleOAuthMutation.isPending}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {t("auth.login.googleSignIn")}
              </Button>
            </motion.div>

            <motion.div variants={landingFadeIn} className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background text-muted-foreground px-2">
                  {t("auth.login.orContinueWith")}
                </span>
              </div>
            </motion.div>

            {(error || (sendOtpMutation.isError && !noAccountDialogOpen)) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: landingEase }}
                className="text-destructive bg-destructive/10 border-destructive/20 rounded-md border p-3 text-sm"
              >
                {error ||
                  (sendOtpMutation.error instanceof Error
                    ? sendOtpMutation.error.message
                    : t("auth.login.error"))}
              </motion.div>
            )}

            <motion.form
              variants={landingFadeUpTight}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="phone">{t("auth.login.phone")}</Label>
                <InputGroup className="bg-muted/50 border-primary/20 text-foreground placeholder:text-muted-foreground h-10 flex-1 border">
                  <InputGroupAddon align="inline-start">
                    <Phone className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("auth.common.phonePlaceholder")}
                    required
                    disabled={sendOtpMutation.isPending}
                    maxLength={10}
                  />
                </InputGroup>
                <p className="text-muted-foreground text-xs">{t("auth.common.phoneHint")}</p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={sendOtpMutation.isPending}
              >
                {t("auth.login.signIn")}
              </Button>
            </motion.form>

            <motion.p
              variants={landingFadeUpTight}
              className="text-muted-foreground text-center text-sm"
            >
              {t("auth.login.noAccount")}{" "}
              <Link href="/sign-up" className="text-primary font-medium hover:underline">
                {t("auth.login.signUp")}
              </Link>
            </motion.p>

            <motion.p
              variants={landingFadeUpTight}
              className="text-muted-foreground text-center text-xs"
            >
              {t("auth.common.legalPartBeforeTerms", { appName: APP_NAME })}
              <Link href="/terms" className="text-primary hover:underline">
                {t("footer.termsOfService")}
              </Link>
              {t("auth.common.legalBetweenPolicies")}
              <Link href="/privacy" className="text-primary hover:underline">
                {t("footer.privacyPolicy")}
              </Link>
              {t("auth.common.legalAfterPolicies", { appName: APP_NAME })}
            </motion.p>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="bg-muted/30 relative hidden flex-1 items-center justify-center overflow-hidden p-12 lg:flex"
        initial={{ opacity: 0, x: 48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.58, ease: landingEase, delay: 0.12 }}
      >
        <motion.div
          className="relative z-10 w-full max-w-lg space-y-8"
          variants={landingStaggerParent}
          initial="hidden"
          animate="visible"
          transition={{ delayChildren: 0.32 }}
        >
          <motion.div variants={landingFadeUpTight} className="text-muted-foreground/40">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
            </svg>
          </motion.div>

          <motion.blockquote
            variants={landingFadeUp}
            className="text-foreground text-2xl leading-relaxed font-medium lg:text-3xl"
          >
            {testimonial.quote}
          </motion.blockquote>

          <motion.div variants={landingFadeUpTight} className="flex items-center gap-3">
            <div className="text-foreground font-medium">{testimonial.author}</div>
          </motion.div>
        </motion.div>
      </motion.div>

      <Dialog open={noAccountDialogOpen} onOpenChange={handleNoAccountDialogChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("auth.login.noAccountDialogTitle")}</DialogTitle>
            <DialogDescription>{t("auth.login.noAccountDialogDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleNoAccountDialogChange(false)}
            >
              {t("auth.login.cancel")}
            </Button>
            <Button type="button" onClick={handleGoToRegister}>
              {t("auth.login.goToRegister")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const LoginPage = () => (
  <Suspense fallback={null}>
    <LoginContent />
  </Suspense>
);

export default LoginPage;
